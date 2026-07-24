import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity';
import { planTier, subscriptionStatus, userRole } from './enums';

/**
 * Organisation — la brique du multi-utilisateur (ADR-015, version Business).
 *
 * Toute activite appartient a une organisation, meme un chauffeur seul : son
 * compte SOLO est une organisation d'une personne dont il est l'ADMIN. Poser ce
 * modele des maintenant evite la refonte le jour ou une societe de transport
 * ajoute des chauffeurs — les tables metier portent deja `driver_id` en direct
 * (ADR-007), il suffira de resoudre l'acces par appartenance a l'organisation.
 *
 * Au MVP, les donnees restent isolees par chauffeur : l'organisation existe en
 * base et cadre l'abonnement, mais le partage entre membres est une evolution,
 * pas un acquis. On ne branche donc encore aucune lecture cross-chauffeur.
 */
export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 200 }).notNull(),
    /** Proprietaire — l'ADMIN initial, celui qui a cree le compte. */
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('organizations_owner_idx').on(table.ownerUserId)],
);

/**
 * Appartenance d'un utilisateur a une organisation, avec son role.
 *
 * Le role reutilise l'enum `user_role` (DRIVER / MANAGER / ADMIN) : c'est lui
 * qui portera les permissions du tier Business — un ADMIN ajoute et retire des
 * chauffeurs, un MANAGER repartit les courses, un DRIVER voit les siennes.
 */
export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: userRole('role').notNull().default('DRIVER'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Un utilisateur n'a qu'une appartenance par organisation.
    unique('org_memberships_org_user').on(table.organizationId, table.userId),
    index('org_memberships_user_idx').on(table.userId),
  ],
);

/**
 * Abonnement d'une organisation — une organisation, un abonnement.
 *
 * Le tier pilote les fonctionnalites disponibles (voir la table de permissions
 * dans @ubersclap/shared). Les champs de facturation externe (Stripe & co.) ne
 * sont pas ici : ils viendront quand le paiement sera branche. Ce qu'on fige
 * maintenant, c'est le tier et l'etat, sur lesquels tout le reste s'appuiera.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .unique()
      .references(() => organizations.id, { onDelete: 'cascade' }),

    tier: planTier('tier').notNull().default('SOLO'),
    status: subscriptionStatus('status').notNull().default('TRIALING'),

    /** Fin de la periode courante (essai ou cycle paye). Null tant qu'illimite. */
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);
