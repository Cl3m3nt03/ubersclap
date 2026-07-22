import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { userRole, vatRegime } from './enums';

/**
 * Compte utilisateur.
 *
 * L'ID est un UUID fourni par le client (ADR-011) : le mobile doit pouvoir
 * creer des entites hors ligne et y referer avant tout aller-retour serveur.
 * UUID v7 cote applicatif — ordonne dans le temps, donc les index ne se
 * fragmentent pas comme avec des v4.
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email', { length: 320 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    phone: varchar('phone', { length: 20 }),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRole('role').notNull().default('DRIVER'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Soft delete. Voir driver_profiles pour la nuance RGPD. */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [index('users_email_idx').on(table.email)],
);

/**
 * Profil professionnel du chauffeur.
 *
 * Ces champs ne sont pas administratifs : ils alimentent chaque facture emise.
 * Tant que `vatRegime`, `siret` et `vtcRegistrationNumber` sont vides, les
 * factures ne sont pas conformes — d'ou l'alerte sur l'ecran Profil.
 *
 * Voir ADR-012, a faire valider par un expert-comptable.
 */
export const driverProfiles = pgTable('driver_profiles', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),

  companyName: varchar('company_name', { length: 200 }),
  legalForm: varchar('legal_form', { length: 100 }),
  siret: varchar('siret', { length: 14 }),
  vatNumber: varchar('vat_number', { length: 20 }),
  /** Numero d'inscription au registre VTC — mention obligatoire. */
  vtcRegistrationNumber: varchar('vtc_registration_number', { length: 50 }),
  vatRegime: vatRegime('vat_regime'),

  address: text('address'),
  logoUrl: text('logo_url'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
