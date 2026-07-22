import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity';

/**
 * Cles d'idempotence — ADR-010.
 *
 * Tout POST exige un en-tete `Idempotency-Key`. Le serveur stocke la cle avec
 * la reponse produite ; une cle deja vue renvoie la reponse d'origine sans
 * reexecuter.
 *
 * Ce n'est pas une precaution theorique. Le cas d'usage central de
 * l'application est un chauffeur dans un parking souterrain d'aeroport : il
 * cree une course, le reseau tombe, le mobile retente. Sans idempotence il se
 * retrouve avec deux courses, puis deux factures.
 *
 * `driverId` fait partie de la cle : deux chauffeurs peuvent generer le meme
 * UUID sans que l'un recupere la reponse de l'autre.
 */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    key: varchar('key', { length: 128 }).notNull(),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    /** Empreinte du corps : la meme cle avec un corps different est un bug client. */
    requestHash: varchar('request_hash', { length: 64 }).notNull(),
    responseStatus: integer('response_status').notNull(),
    responseBody: text('response_body').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Purge apres 24 h — au-dela, un rejeu n'a plus de sens metier. */
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('idempotency_lookup_idx').on(table.driverId, table.key),
    index('idempotency_expiry_idx').on(table.expiresAt),
  ],
);

/**
 * Journal d'audit — ADR-013.
 *
 * Le chauffeur est responsable de traitement pour les donnees de ses clients ;
 * nous sommes sous-traitant. Tracer les acces et modifications fait partie des
 * obligations de l'article 28.
 *
 * Sert aussi au support : « ma course a disparu » devient verifiable.
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey(),
    driverId: uuid('driver_id').references(() => users.id, {
      onDelete: 'set null',
    }),

    action: varchar('action', { length: 64 }).notNull(),
    entity: varchar('entity', { length: 64 }).notNull(),
    entityId: uuid('entity_id'),
    metadata: text('metadata'),
    ipAddress: varchar('ip_address', { length: 45 }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('audit_logs_driver_created_idx').on(table.driverId, table.createdAt)],
);

/**
 * Sessions de rafraichissement.
 *
 * Le refresh token n'est jamais stocke en clair : seule son empreinte est
 * conservee. Une fuite de la base ne doit pas permettre de se faire passer
 * pour un utilisateur.
 *
 * Une ligne par appareil, ce qui permet une deconnexion ciblee et, plus tard,
 * un ecran « appareils connectes ».
 */
export const refreshTokens = pgTable(
  'refresh_tokens',
  {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    tokenHash: varchar('token_hash', { length: 128 }).notNull().unique(),
    deviceName: varchar('device_name', { length: 128 }),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('refresh_tokens_user_idx').on(table.userId)],
);
