import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
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
 * dans @ubersclap/shared). `tier` et `status` restent la SEULE verite lue par
 * l'application : les colonnes `stripe_*` ne servent qu'a dialoguer avec le
 * prestataire de paiement. Interroger Stripe pour savoir si un ecran est
 * accessible rendrait l'app dependante d'un appel reseau externe a chaque
 * requete — l'abonnement est donc recopie ici et tenu a jour par webhook.
 *
 * Aucun montant, aucune donnee bancaire : les prix vivent dans le tableau de
 * bord Stripe et les moyens de paiement chez Stripe uniquement (regle de
 * PAYMENT_AND_BILLING.md, « aucune donnee bancaire stockee »).
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

    /**
     * Client chez le prestataire de paiement. Cree au premier passage en
     * caisse et conserve ensuite : le recreer perdrait l'historique de
     * facturation et les moyens de paiement enregistres.
     */
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    /** Abonnement en cours chez le prestataire. Null = jamais paye (essai). */
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    /** Tarif souscrit — sert a retrouver le tier et la periodicite. */
    stripePriceId: varchar('stripe_price_id', { length: 255 }),
    /** MONTHLY / YEARLY. Chaine libre : la periodicite vient du tarif Stripe. */
    billingInterval: varchar('billing_interval', { length: 16 }),
    /**
     * Resilie, mais encore actif jusqu'a la fin de la periode payee. Sans ce
     * drapeau on ne peut pas distinguer « abonne » de « part a la fin du
     * mois », et l'ecran d'abonnement mentirait au chauffeur.
     */
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Un webhook n'apporte souvent que l'identifiant Stripe : c'est par lui
    // qu'on retrouve la ligne, donc il doit etre indexe.
    index('subscriptions_stripe_customer_idx').on(table.stripeCustomerId),
    index('subscriptions_stripe_subscription_idx').on(table.stripeSubscriptionId),
  ],
);

/**
 * Evenements de facturation deja traites — idempotence des webhooks.
 *
 * Stripe garantit la livraison « au moins une fois » : le meme evenement peut
 * arriver deux fois, et arrive effectivement deux fois en cas de timeout de
 * notre cote. Sans cette table, un `invoice.paid` rejoue pourrait reappliquer
 * un changement de tier apres une resiliation arrivee entre-temps.
 *
 * La cle primaire est l'identifiant d'evenement Stripe : l'insertion sert de
 * verrou, un conflit signifie « deja traite, ne rien faire ».
 */
export const billingEvents = pgTable('billing_events', {
  /** `evt_...` fourni par Stripe. */
  id: varchar('id', { length: 255 }).primaryKey(),
  type: varchar('type', { length: 120 }).notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
