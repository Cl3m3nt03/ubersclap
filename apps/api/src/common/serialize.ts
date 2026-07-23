import type {
  ClientRecord,
  Course,
  CourseWithClient,
} from '@ubersclap/shared';

import { clients, courses } from '../database/schema';

type ClientRow = typeof clients.$inferSelect;
type CourseRow = typeof courses.$inferSelect;

/**
 * Traduction ligne SQL → ressource d'API.
 *
 * Renvoyer la ligne Drizzle telle quelle serait plus court, mais exposerait le
 * schema physique : `pickup_label` a plat, `deleted_at` visible, et des dates
 * serialisees au bon vouloir de `JSON.stringify`. Le contrat de
 * `@ubersclap/shared` deviendrait faux au premier renommage de colonne.
 */

export function serializeClient(row: ClientRow): ClientRecord {
  return {
    id: row.id,
    driverId: row.driverId,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    company: row.company,
    category: row.category,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeCourse(row: CourseRow): Course {
  return {
    id: row.id,
    driverId: row.driverId,
    clientId: row.clientId,
    type: row.type,
    status: row.status,

    pickup: {
      label: row.pickupLabel,
      latitude: row.pickupLat ?? undefined,
      longitude: row.pickupLng ?? undefined,
    },
    destination: {
      label: row.destinationLabel,
      latitude: row.destinationLat ?? undefined,
      longitude: row.destinationLng ?? undefined,
    },

    scheduledAt: row.scheduledAt.toISOString(),
    timezone: row.timezone,

    passengers: row.passengers,
    luggage: row.luggage,
    childSeat: row.childSeat,

    priceInclTaxCents: row.priceInclTaxCents,
    finalPriceInclTaxCents: row.finalPriceInclTaxCents,
    distanceMeters: row.distanceMeters,
    durationMinutes: row.durationMinutes,

    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeCourseWithClient(
  row: CourseRow,
  client: Pick<ClientRow, 'id' | 'firstName' | 'lastName' | 'phone'>,
): CourseWithClient {
  return {
    ...serializeCourse(row),
    client: {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      phone: client.phone,
    },
  };
}
