import type {
  ClientRecord,
  Course,
  CourseWithClient,
  Expense,
  Invoice,
  InvoiceSummary,
} from '@ubersclap/shared';

import { clients, courses, expenses, invoices, invoiceLines } from '../database/schema';

type ClientRow = typeof clients.$inferSelect;
type CourseRow = typeof courses.$inferSelect;
type ExpenseRow = typeof expenses.$inferSelect;
type InvoiceRow = typeof invoices.$inferSelect;
type InvoiceLineRow = typeof invoiceLines.$inferSelect;

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

export function serializeInvoice(
  row: InvoiceRow,
  lines: InvoiceLineRow[],
): Invoice {
  return {
    id: row.id,
    driverId: row.driverId,
    clientId: row.clientId,
    invoiceNumber: row.invoiceNumber,
    status: row.status,
    // Une facture emise porte toujours ces dates ; le `!` reste defensif face a
    // une ligne heritee d'un brouillon jamais emis.
    issuedAt: (row.issuedAt ?? row.createdAt).toISOString(),
    dueAt: (row.dueAt ?? row.createdAt).toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
    totalExclTaxCents: row.totalExclTaxCents,
    taxCents: row.taxCents,
    totalInclTaxCents: row.totalInclTaxCents,
    lines: lines.map((line) => ({
      id: line.id,
      courseId: line.courseId,
      label: line.label,
      quantity: line.quantity,
      unitPriceExclTaxCents: line.unitPriceExclTaxCents,
      taxRate: line.taxRate,
    })),
    pdfUrl: row.pdfUrl,
  };
}

export function serializeExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    driverId: row.driverId,
    courseId: row.courseId,
    vehicleId: row.vehicleId,
    category: row.category,
    amountCents: row.amountCents,
    description: row.description,
    spentAt: row.spentAt.toISOString(),
    receiptUrl: row.receiptUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function serializeInvoiceSummary(
  row: InvoiceRow,
  clientName: string,
  courseCount: number,
): InvoiceSummary {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    status: row.status,
    issuedAt: row.issuedAt?.toISOString() ?? null,
    dueAt: row.dueAt?.toISOString() ?? null,
    totalInclTaxCents: row.totalInclTaxCents,
    clientName,
    courseCount,
  };
}
