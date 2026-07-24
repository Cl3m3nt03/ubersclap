import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { of, tap, type Observable } from 'rxjs';
import type { Request, Response } from 'express';

import { DATABASE } from '../database/database.module';
import type { Database } from '../database/client';
import { idempotencyKeys } from '../database/schema';

const RETENTION_HOURS = 24;

/**
 * Idempotence des POST — ADR-010.
 *
 * Ce n'est pas une precaution theorique. Le cas d'usage central de
 * l'application est un chauffeur dans un parking souterrain d'aeroport : il
 * cree une course, le reseau tombe pendant la reponse, le mobile retente.
 * Sans idempotence il se retrouve avec deux courses, puis deux factures.
 *
 * Le client envoie un `Idempotency-Key`. Le serveur stocke la cle avec la
 * reponse produite ; une cle deja vue renvoie la reponse d'origine sans
 * reexecuter la logique metier.
 *
 * La cle est associee au `driverId` : deux chauffeurs peuvent generer la meme
 * valeur sans que l'un recupere la reponse de l'autre.
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['idempotency-key'];

    if (typeof key !== 'string' || key.length === 0) {
      throw new BadRequestException({
        message: "En-tête Idempotency-Key requis sur cette requête",
        code: 'MISSING_IDEMPOTENCY_KEY',
      });
    }

    const driverId = request.driver?.sub;
    if (!driverId) return next.handle();

    const requestHash = createHash('sha256')
      .update(JSON.stringify(request.body ?? {}))
      .digest('hex');

    const existing = await this.db.query.idempotencyKeys.findFirst({
      where: and(
        eq(idempotencyKeys.key, key),
        eq(idempotencyKeys.driverId, driverId),
      ),
    });

    if (existing) {
      /**
       * Meme cle, corps different : c'est un bug du client, pas un rejeu
       * legitime. On refuse plutot que de renvoyer une reponse qui ne
       * correspond pas a ce qui a ete demande — un silence ici produirait une
       * incoherence invisible cote mobile.
       */
      if (existing.requestHash !== requestHash) {
        throw new ConflictException({
          message:
            'Cette clé d\'idempotence a déjà été utilisée avec un contenu différent',
          code: 'IDEMPOTENCY_KEY_REUSED',
        });
      }

      const response = context.switchToHttp().getResponse<Response>();
      response.status(existing.responseStatus);
      return of(JSON.parse(existing.responseBody));
    }

    return next.handle().pipe(
      tap((body: unknown) => {
        const response = context.switchToHttp().getResponse<Response>();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + RETENTION_HOURS);

        // Enregistrement en arriere-plan : l'echec du cache d'idempotence ne
        // doit jamais faire echouer une creation qui a reussi.
        void this.db
          .insert(idempotencyKeys)
          .values({
            key,
            driverId,
            requestHash,
            responseStatus: response.statusCode,
            responseBody: JSON.stringify(body ?? null),
            expiresAt,
          })
          .onConflictDoNothing()
          .catch(() => undefined);
      }),
    );
  }
}
