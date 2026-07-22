import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Enums Postgres.
 *
 * Les valeurs sont reprises telles quelles de @ubersclap/shared, qui reste la
 * source de verite. Drizzle exige des litteraux a la definition du schema, donc
 * on ne peut pas les importer directement — d'ou les tests de coherence dans
 * `schema.spec.ts` qui echouent si les deux listes divergent.
 */

export const userRole = pgEnum('user_role', ['DRIVER', 'MANAGER', 'ADMIN']);

/** ADR-004. INVOICED et PAID absents : ils appartiennent a la facture. */
export const courseStatus = pgEnum('course_status', [
  'DRAFT',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const courseType = pgEnum('course_type', [
  'ONE_WAY',
  'ROUND_TRIP',
  'AIRPORT',
  'STATION',
  'EVENT',
  'HOURLY',
  'OTHER',
]);

export const clientCategory = pgEnum('client_category', [
  'VIP',
  'BUSINESS',
  'REGULAR',
  'OCCASIONAL',
  'PROSPECT',
]);

export const invoiceStatus = pgEnum('invoice_status', [
  'DRAFT',
  'SENT',
  'PAID',
  'OVERDUE',
  'CANCELLED',
]);

export const expenseCategory = pgEnum('expense_category', [
  'FUEL',
  'TOLL',
  'PARKING',
  'MAINTENANCE',
  'INSURANCE',
  'OTHER',
]);

/**
 * Regime de TVA — ADR-012.
 *
 * Pilote le calcul ET les mentions legales. Un chauffeur en franchise dont le
 * regime est mal renseigne emet des factures fausses.
 */
export const vatRegime = pgEnum('vat_regime', ['FRANCHISE', 'NORMAL']);

export const fuelType = pgEnum('fuel_type', [
  'DIESEL',
  'GASOLINE',
  'HYBRID',
  'ELECTRIC',
]);
