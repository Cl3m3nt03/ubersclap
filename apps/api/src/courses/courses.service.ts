import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, isNull, lte, asc } from 'drizzle-orm';
import {
  canTransition,
  COURSE_STATUS_LABEL,
  type CourseStatus,
  type CreateCourseInput,
  type UpdateCourseInput,
} from '@ubersclap/shared';

import { DATABASE } from '../database/database.module';
import type { Database } from '../database/client';
import { courses, clients } from '../database/schema';
import { ClientsService } from '../clients/clients.service';
import {
  serializeCourse,
  serializeCourseWithClient,
} from '../common/serialize';

@Injectable()
export class CoursesService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly clientsService: ClientsService,
  ) {}

  async list(
    driverId: string,
    filters: {
      from?: string;
      to?: string;
      status?: CourseStatus;
      clientId?: string;
    },
  ) {
    const rows = await this.db
      .select({ course: courses, client: clients })
      .from(courses)
      .innerJoin(clients, eq(courses.clientId, clients.id))
      .where(
        and(
          eq(courses.driverId, driverId),
          isNull(courses.deletedAt),
          filters.from ? gte(courses.scheduledAt, new Date(filters.from)) : undefined,
          filters.to ? lte(courses.scheduledAt, new Date(filters.to)) : undefined,
          filters.status ? eq(courses.status, filters.status) : undefined,
          filters.clientId ? eq(courses.clientId, filters.clientId) : undefined,
        ),
      )
      .orderBy(asc(courses.scheduledAt))
      .limit(500);

    return rows.map(({ course, client }) =>
      serializeCourseWithClient(course, client),
    );
  }

  async findOne(driverId: string, id: string) {
    return serializeCourse(await this.findRow(driverId, id));
  }

  private async findRow(driverId: string, id: string) {
    const record = await this.db.query.courses.findFirst({
      where: and(
        eq(courses.id, id),
        eq(courses.driverId, driverId),
        isNull(courses.deletedAt),
      ),
    });

    if (!record) {
      throw new NotFoundException({
        message: 'Course introuvable',
        code: 'COURSE_NOT_FOUND',
      });
    }

    return record;
  }

  /**
   * Cree une course.
   *
   * Le formulaire mobile ne demande que la date, l'heure, le passager, les
   * deux adresses et le tarif. Le client est resolu ou cree ici, a partir du
   * telephone : le chauffeur n'a pas a creer une fiche avant de noter une
   * reservation prise au telephone.
   */
  async create(driverId: string, input: CreateCourseInput) {
    const clientId = input.clientId
      ? (await this.assertClientBelongsToDriver(driverId, input.clientId)).id
      : (await this.clientsService.resolvePassenger(driverId, input.passenger!))
          .id;

    const [created] = await this.db
      .insert(courses)
      .values({
        id: input.id,
        driverId,
        clientId,
        type: input.type,
        // Une course naît CONFIRMED : quand un chauffeur note une réservation,
        // elle est déjà prise. DRAFT existe pour une saisie interrompue, pas
        // comme état de départ par défaut.
        status: 'CONFIRMED',
        pickupLabel: input.pickup.label,
        pickupLat: input.pickup.latitude,
        pickupLng: input.pickup.longitude,
        destinationLabel: input.destination.label,
        destinationLat: input.destination.latitude,
        destinationLng: input.destination.longitude,
        scheduledAt: new Date(input.scheduledAt),
        timezone: input.timezone,
        passengers: input.passengers,
        luggage: input.luggage,
        childSeat: input.childSeat,
        priceInclTaxCents: input.priceInclTaxCents,
        distanceMeters: input.distanceMeters,
        durationMinutes: input.durationMinutes,
        notes: input.notes,
      })
      .returning();

    return serializeCourse(created);
  }

  async update(driverId: string, id: string, patch: UpdateCourseInput) {
    const existing = await this.findRow(driverId, id);

    // Une course terminee ou annulee ne se modifie plus : elle a servi de base
    // a un prix annonce au client, et bientot a une ligne de facture.
    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new BadRequestException({
        message: `Une course ${COURSE_STATUS_LABEL[existing.status].toLowerCase()} ne peut plus être modifiée`,
        code: 'COURSE_NOT_EDITABLE',
      });
    }

    const [updated] = await this.db
      .update(courses)
      .set({
        type: patch.type,
        pickupLabel: patch.pickup?.label,
        pickupLat: patch.pickup?.latitude,
        pickupLng: patch.pickup?.longitude,
        destinationLabel: patch.destination?.label,
        destinationLat: patch.destination?.latitude,
        destinationLng: patch.destination?.longitude,
        scheduledAt: patch.scheduledAt ? new Date(patch.scheduledAt) : undefined,
        timezone: patch.timezone,
        passengers: patch.passengers,
        luggage: patch.luggage,
        childSeat: patch.childSeat,
        priceInclTaxCents: patch.priceInclTaxCents,
        distanceMeters: patch.distanceMeters,
        durationMinutes: patch.durationMinutes,
        notes: patch.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(courses.id, id), eq(courses.driverId, driverId)))
      .returning();

    return serializeCourse(updated);
  }

  /**
   * Change le statut d'une course.
   *
   * La transition est validee par la machine a etats de @ubersclap/shared, la
   * meme que celle utilisee par le mobile. Le serveur refuse ce que l'UI
   * n'aurait jamais du proposer : on ne fait pas confiance au client pour
   * l'integrite du cycle de vie.
   */
  async transition(
    driverId: string,
    id: string,
    to: CourseStatus,
    finalPriceInclTaxCents?: number,
  ) {
    const existing = await this.findRow(driverId, id);

    if (!canTransition(existing.status, to)) {
      throw new BadRequestException({
        message: `Impossible de passer de « ${COURSE_STATUS_LABEL[existing.status]} » à « ${COURSE_STATUS_LABEL[to]} »`,
        code: 'INVALID_TRANSITION',
      });
    }

    const [updated] = await this.db
      .update(courses)
      .set({
        status: to,
        // Le prix final n'est fige qu'a la fin de la course : c'est celui qui
        // sera facture, et il peut differer du prix annonce (attente, detour).
        finalPriceInclTaxCents:
          to === 'COMPLETED'
            ? (finalPriceInclTaxCents ?? existing.priceInclTaxCents)
            : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(courses.id, id), eq(courses.driverId, driverId)))
      .returning();

    return serializeCourse(updated);
  }

  async remove(driverId: string, id: string) {
    await this.findRow(driverId, id);

    await this.db
      .update(courses)
      .set({ deletedAt: new Date() })
      .where(and(eq(courses.id, id), eq(courses.driverId, driverId)));
  }

  private async assertClientBelongsToDriver(driverId: string, clientId: string) {
    const client = await this.db.query.clients.findFirst({
      where: and(
        eq(clients.id, clientId),
        eq(clients.driverId, driverId),
        isNull(clients.deletedAt),
      ),
    });

    if (!client) {
      throw new NotFoundException({
        message: 'Client introuvable',
        code: 'CLIENT_NOT_FOUND',
      });
    }

    return client;
  }
}
