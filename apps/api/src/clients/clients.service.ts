import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, ilike, isNull, or, desc, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import type { CreateClientInput, PassengerInput } from '@cadance/shared';

import { DATABASE } from '../database/database.module';
import type { Database } from '../database/client';
import { clients, courses } from '../database/schema';
import { serializeClient } from '../common/serialize';

/**
 * Normalise un numero pour le rapprochement.
 *
 * « 06 12 34 56 78 », « 0612345678 » et « +33 6 12 34 56 78 » designent le
 * meme client. Sans normalisation, le repertoire se remplit de doublons du
 * meme passager et l'historique se disperse.
 */
export function normalisePhone(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+33')) return `0${digits.slice(3)}`;
  if (digits.startsWith('33') && digits.length === 11) return `0${digits.slice(2)}`;
  return digits;
}

@Injectable()
export class ClientsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(driverId: string, search?: string) {
    const term = search?.trim();

    const rows = await this.db
      .select()
      .from(clients)
      .where(
        and(
          // ADR-007 : toute requete metier commence par driverId.
          eq(clients.driverId, driverId),
          isNull(clients.deletedAt),
          term
            ? or(
                ilike(clients.firstName, `%${term}%`),
                ilike(clients.lastName, `%${term}%`),
                ilike(clients.phone, `%${term}%`),
                ilike(clients.company, `%${term}%`),
              )
            : undefined,
        ),
      )
      .orderBy(clients.lastName, clients.firstName)
      .limit(200);

    return rows.map(serializeClient);
  }

  async findOne(driverId: string, id: string) {
    const record = await this.findRow(driverId, id);

    const [stats] = await this.db
      .select({
        courseCount: sql<number>`count(*)::int`,
        totalCents: sql<number>`coalesce(sum(coalesce(${courses.finalPriceInclTaxCents}, ${courses.priceInclTaxCents})), 0)::int`,
        lastCourseAt: sql<Date | null>`max(${courses.scheduledAt})`,
      })
      .from(courses)
      .where(
        and(
          eq(courses.clientId, id),
          eq(courses.driverId, driverId),
          isNull(courses.deletedAt),
        ),
      );

    return {
      ...serializeClient(record),
      stats: {
        ...stats,
        lastCourseAt: stats.lastCourseAt
          ? new Date(stats.lastCourseAt).toISOString()
          : null,
      },
    };
  }

  private async findRow(driverId: string, id: string) {
    const record = await this.db.query.clients.findFirst({
      where: and(
        eq(clients.id, id),
        eq(clients.driverId, driverId),
        isNull(clients.deletedAt),
      ),
    });

    if (!record) {
      // 404 et non 403 : repondre « interdit » confirmerait que
      // l'identifiant existe chez un autre chauffeur.
      throw new NotFoundException({
        message: 'Client introuvable',
        code: 'CLIENT_NOT_FOUND',
      });
    }

    return record;
  }

  /**
   * Creation d'un client, rejouable.
   *
   * L'identifiant vient du mobile (ADR-011) : il est genere au moment de la
   * saisie, avant tout reseau. Une meme creation peut donc arriver deux fois
   * avec une cle d'idempotence differente — file offline rejouee apres une
   * reinstallation, ou cache purge. L'`Idempotency-Key` ne couvre pas ce cas,
   * puisque la cle a change.
   *
   * `onConflictDoNothing` puis relecture : la seconde arrivee renvoie la ligne
   * existante au lieu d'une violation de cle primaire remontee en 500. Le
   * chauffeur voyait une erreur illisible sur une action qui avait deja
   * abouti.
   */
  async create(driverId: string, input: CreateClientInput) {
    const [created] = await this.db
      .insert(clients)
      .values({
        id: input.id,
        driverId,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: normalisePhone(input.phone),
        email: input.email,
        company: input.company,
        category: input.category,
        notes: input.notes,
      })
      .onConflictDoNothing({ target: clients.id })
      .returning();

    if (created) return serializeClient(created);

    // Deja cree : on renvoie l'existant, mais seulement s'il appartient bien au
    // chauffeur. Un identifiant appartenant a un autre compte ne doit rien
    // reveler — c'est un conflit, pas une lecture.
    const existing = await this.findRow(driverId, input.id);
    return serializeClient(existing);
  }

  async update(driverId: string, id: string, patch: Partial<CreateClientInput>) {
    await this.findRow(driverId, id);

    const [updated] = await this.db
      .update(clients)
      .set({
        ...patch,
        phone: patch.phone ? normalisePhone(patch.phone) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(clients.id, id), eq(clients.driverId, driverId)))
      .returning();

    return serializeClient(updated);
  }

  /**
   * Suppression logique.
   *
   * Un client efface reste reference par ses courses passees et, plus tard,
   * par ses factures — des documents qui doivent rester lisibles des annees.
   * Une suppression physique casserait l'historique comptable.
   */
  async remove(driverId: string, id: string) {
    await this.findRow(driverId, id);

    await this.db
      .update(clients)
      .set({ deletedAt: new Date() })
      .where(and(eq(clients.id, id), eq(clients.driverId, driverId)));
  }

  /**
   * Rapproche un passager saisi a la volee, ou le cree.
   *
   * C'est ce qui permet au formulaire de course de ne demander que nom,
   * prenom et telephone : le repertoire client se construit tout seul, sans
   * double saisie et sans doublon.
   */
  async resolvePassenger(driverId: string, passenger: PassengerInput) {
    const phone = normalisePhone(passenger.phone);

    const existing = await this.db.query.clients.findFirst({
      where: and(
        eq(clients.driverId, driverId),
        eq(clients.phone, phone),
        isNull(clients.deletedAt),
      ),
      orderBy: desc(clients.createdAt),
    });

    if (existing) return existing;

    const [created] = await this.db
      .insert(clients)
      .values({
        id: uuidv7(),
        driverId,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        phone,
        email: passenger.email,
      })
      .returning();

    return created;
  }
}
