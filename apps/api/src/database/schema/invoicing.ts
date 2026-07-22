import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  doublePrecision,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity';
import { clients, courses } from './business';
import { invoiceStatus } from './enums';

/**
 * Compteur de numerotation — ADR-012.
 *
 * La numerotation des factures doit etre chronologique, continue et SANS TROU.
 * Un trou est un risque en controle fiscal.
 *
 * Le compteur vit donc en base, une ligne par chauffeur et par annee, et
 * s'incremente dans la meme transaction que l'insertion de la facture, avec un
 * verrou de ligne (`SELECT ... FOR UPDATE`).
 *
 * Ce qu'il ne faut surtout PAS faire : un compteur applicatif en memoire, un
 * MAX(invoice_number) + 1, ou une attribution cote client. Les trois produisent
 * des trous ou des doublons des qu'il y a deux requetes simultanees.
 */
export const invoiceSequences = pgTable(
  'invoice_sequences',
  {
    driverId: uuid('driver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    year: integer('year').notNull(),
    lastNumber: integer('last_number').notNull().default(0),
  },
  (table) => [unique('invoice_sequences_driver_year').on(table.driverId, table.year)],
);

/**
 * Facture — ADR-005 : une facture couvre 1..N courses.
 *
 * Le modele « 1 course = 1 facture » fermait le segment B2B, celui qui paie le
 * plus cher l'abonnement : un hotel veut une facture mensuelle groupee, pas
 * quarante factures de 65 euros.
 *
 * Les montants sont FIGES a l'emission dans les colonnes ci-dessous, jamais
 * recalcules a l'affichage. Une facture emise est immuable : si le prix d'une
 * course change ensuite, la facture deja envoyee au client ne doit pas bouger.
 * Correction = avoir (`creditNotes`).
 */
export const invoices = pgTable(
  'invoices',
  {
    id: uuid('id').primaryKey(),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),

    /** Format AAAA-NNNNN, attribue par invoiceSequences. */
    invoiceNumber: varchar('invoice_number', { length: 20 }).notNull(),

    status: invoiceStatus('status').notNull().default('DRAFT'),
    issuedAt: timestamp('issued_at', { withTimezone: true }),
    dueAt: timestamp('due_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),

    totalExclTaxCents: integer('total_excl_tax_cents').notNull(),
    taxCents: integer('tax_cents').notNull(),
    totalInclTaxCents: integer('total_incl_tax_cents').notNull(),

    /**
     * Identite de l'emetteur figee au moment de l'emission.
     *
     * Une facture doit rester lisible telle qu'elle a ete emise. Si le
     * chauffeur change de raison sociale ou passe de la franchise au regime
     * normal l'annee suivante, ses anciennes factures doivent continuer
     * d'afficher les mentions qui etaient exactes a leur date.
     */
    issuerSnapshot: text('issuer_snapshot'),

    pdfUrl: text('pdf_url'),
    /** PDF/A-3 avec XML CII embarque — facturation electronique. */
    facturXUrl: text('factur_x_url'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Deux factures d'un meme chauffeur ne peuvent pas porter le meme numero.
    // La contrainte est en base, pas seulement dans le service : c'est la
    // seule garantie qui tient sous concurrence.
    unique('invoices_driver_number').on(table.driverId, table.invoiceNumber),
    index('invoices_driver_status_idx').on(table.driverId, table.status),
    index('invoices_client_idx').on(table.clientId),
  ],
);

export const invoiceLines = pgTable(
  'invoice_lines',
  {
    id: uuid('id').primaryKey(),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'cascade' }),
    /**
     * Nullable et `set null` : une ligne peut exister sans course (frais
     * divers), et surtout la suppression d'une course ne doit jamais alterer
     * une facture deja emise.
     */
    courseId: uuid('course_id').references(() => courses.id, {
      onDelete: 'set null',
    }),

    /** Libelle fige, ex. « Transport de personnes — Paris → CDG ». */
    label: text('label').notNull(),
    quantity: integer('quantity').notNull().default(1),
    unitPriceExclTaxCents: integer('unit_price_excl_tax_cents').notNull(),
    /** Taux fige : 0.10 transport de personnes, 0 en franchise. */
    taxRate: doublePrecision('tax_rate').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('invoice_lines_invoice_idx').on(table.invoiceId)],
);

/**
 * Avoir — ADR-012.
 *
 * Une facture emise ne se modifie jamais et ne se supprime jamais. La seule
 * correction admise est un avoir, qui reference la facture d'origine.
 */
export const creditNotes = pgTable(
  'credit_notes',
  {
    id: uuid('id').primaryKey(),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    invoiceId: uuid('invoice_id')
      .notNull()
      .references(() => invoices.id, { onDelete: 'restrict' }),

    creditNoteNumber: varchar('credit_note_number', { length: 20 }).notNull(),
    reason: text('reason').notNull(),

    totalExclTaxCents: integer('total_excl_tax_cents').notNull(),
    taxCents: integer('tax_cents').notNull(),
    totalInclTaxCents: integer('total_incl_tax_cents').notNull(),

    issuedAt: timestamp('issued_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    pdfUrl: text('pdf_url'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('credit_notes_driver_number').on(table.driverId, table.creditNoteNumber),
  ],
);
