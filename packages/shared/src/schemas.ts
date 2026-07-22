/**
 * Schemas Zod — valides cote API, deduits en types cote mobile.
 *
 * C'est le seul vrai gain d'un stack TypeScript full-stack (ADR-002) :
 * un schema ecrit une fois, utilise pour valider les entrees du backend ET
 * pour typer les formulaires du mobile. Les deux ne peuvent plus diverger.
 */

import { z } from 'zod';
import { COURSE_STATUSES, COURSE_TYPES } from './course';

/**
 * Identifiants generes cote mobile (UUID v7).
 *
 * Voir ADR-011 : sans ID local, impossible de creer une course hors ligne et
 * d'y referer. v7 plutot que v4 car il est ordonne dans le temps, ce qui evite
 * la fragmentation des index Postgres.
 */
export const uuidSchema = z.string().uuid();

/** Instant absolu, ISO 8601 avec fuseau. Jamais une date nue (ADR-008). */
export const instantSchema = z.string().datetime({ offset: true });

/** Montant en centimes entiers (ADR-009). */
export const centsSchema = z.number().int();

const phoneSchema = z
  .string()
  .trim()
  .min(6, 'Numéro de téléphone trop court')
  .max(20, 'Numéro de téléphone trop long');

// ---------------------------------------------------------------- Client

export const CLIENT_CATEGORIES = [
  'VIP',
  'BUSINESS',
  'REGULAR',
  'OCCASIONAL',
  'PROSPECT',
] as const;

export type ClientCategory = (typeof CLIENT_CATEGORIES)[number];

export const CLIENT_CATEGORY_LABEL: Record<ClientCategory, string> = {
  VIP: 'VIP',
  BUSINESS: 'Entreprise',
  REGULAR: 'Régulier',
  OCCASIONAL: 'Occasionnel',
  PROSPECT: 'Prospect',
};

export const createClientSchema = z.object({
  id: uuidSchema,
  firstName: z.string().trim().min(1, 'Le prénom est obligatoire'),
  lastName: z.string().trim().min(1, 'Le nom est obligatoire'),
  phone: phoneSchema,
  email: z.string().trim().email('Adresse email invalide').optional(),
  company: z.string().trim().optional(),
  category: z.enum(CLIENT_CATEGORIES).default('OCCASIONAL'),
  notes: z.string().trim().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

export const clientSchema = createClientSchema.extend({
  driverId: uuidSchema,
  createdAt: instantSchema,
  updatedAt: instantSchema,
});

export type Client = z.infer<typeof clientSchema>;

// ---------------------------------------------------------------- Course

export const addressSchema = z.object({
  label: z.string().trim().min(1, "L'adresse est obligatoire"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type Address = z.infer<typeof addressSchema>;

export const createCourseSchema = z.object({
  id: uuidSchema,
  clientId: uuidSchema,
  type: z.enum(COURSE_TYPES).default('ONE_WAY'),

  pickup: addressSchema,
  destination: addressSchema,

  /**
   * Instant absolu + fuseau (ADR-008).
   *
   * Le fuseau est conserve en plus de l'instant parce que « la course est a
   * 9 h heure locale » est l'intention de l'utilisateur, et elle doit survivre
   * a un deplacement ou a un changement d'heure.
   */
  scheduledAt: instantSchema,
  timezone: z.string().default('Europe/Paris'),

  passengers: z.number().int().min(1).max(16).default(1),
  luggage: z.number().int().min(0).max(20).default(0),
  childSeat: z.boolean().default(false),

  /** Prix TTC annonce au client. Le HT est deduit (voir money.ts). */
  priceInclTaxCents: centsSchema.nonnegative('Le prix ne peut pas être négatif'),

  notes: z.string().trim().optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const courseSchema = createCourseSchema.extend({
  driverId: uuidSchema,
  status: z.enum(COURSE_STATUSES),
  finalPriceInclTaxCents: centsSchema.nonnegative().nullable(),
  distanceMeters: z.number().int().nonnegative().nullable(),
  durationMinutes: z.number().int().nonnegative().nullable(),
  createdAt: instantSchema,
  updatedAt: instantSchema,
});

export type Course = z.infer<typeof courseSchema>;

export const transitionCourseSchema = z.object({
  to: z.enum(COURSE_STATUSES),
  /** Renseigne uniquement lors du passage a COMPLETED. */
  finalPriceInclTaxCents: centsSchema.nonnegative().optional(),
});

// --------------------------------------------------------------- Invoice

export const INVOICE_STATUSES = [
  'DRAFT',
  'SENT',
  'PAID',
  'OVERDUE',
  'CANCELLED',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
};

/**
 * Creation de facture : un client, N courses (ADR-005).
 *
 * Le modele « 1 course = 1 facture » fermait le segment B2B, qui est justement
 * celui qui paie le plus cher l'abonnement : un hotel veut une facture
 * mensuelle groupee, pas quarante factures de 65 €.
 */
export const createInvoiceSchema = z.object({
  id: uuidSchema,
  clientId: uuidSchema,
  courseIds: z
    .array(uuidSchema)
    .min(1, 'Sélectionnez au moins une course à facturer'),
  dueAt: instantSchema.optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const invoiceLineSchema = z.object({
  id: uuidSchema,
  courseId: uuidSchema.nullable(),
  label: z.string(),
  quantity: z.number().int().positive(),
  unitPriceExclTaxCents: centsSchema,
  taxRate: z.number().min(0).max(1),
});

export const invoiceSchema = z.object({
  id: uuidSchema,
  driverId: uuidSchema,
  clientId: uuidSchema,

  /**
   * Numerotation chronologique continue, sans trou (ADR-012).
   * Attribuee en base, dans une transaction, au moment de l'emission.
   * Jamais cote client.
   */
  invoiceNumber: z.string().regex(/^\d{4}-\d{5}$/, 'Format attendu : AAAA-NNNNN'),

  status: z.enum(INVOICE_STATUSES),
  issuedAt: instantSchema,
  dueAt: instantSchema,
  paidAt: instantSchema.nullable(),

  totalExclTaxCents: centsSchema,
  taxCents: centsSchema,
  totalInclTaxCents: centsSchema,

  lines: z.array(invoiceLineSchema),
  pdfUrl: z.string().url().nullable(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceLine = z.infer<typeof invoiceLineSchema>;
