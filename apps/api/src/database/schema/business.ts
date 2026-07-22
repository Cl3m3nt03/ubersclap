import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './identity';
import {
  clientCategory,
  courseStatus,
  courseType,
  expenseCategory,
  fuelType,
} from './enums';

/**
 * `driverId` reference `users.id`.
 *
 * Au MVP un utilisateur est un chauffeur. Le nommage anticipe la version
 * Business, ou un chauffeur sera un membre parmi d'autres d'une organisation :
 * les tables metier n'auront alors pas a etre renommees.
 *
 * ADR-007 : toute table metier porte `driver_id` en colonne DIRECTE, meme
 * quand il serait deductible par jointure. Une isolation qui depend d'une
 * jointure est une isolation qu'un JOIN oublie fait sauter.
 */

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey(),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 320 }),
    company: varchar('company', { length: 200 }),
    category: clientCategory('category').notNull().default('OCCASIONAL'),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // Toute requete metier commence par driver_id : il est en tete de chaque
    // index composite, sinon Postgres ne peut pas s'en servir.
    index('clients_driver_name_idx').on(
      table.driverId,
      table.lastName,
      table.firstName,
    ),
    index('clients_driver_phone_idx').on(table.driverId, table.phone),
  ],
);

export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').primaryKey(),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    brand: varchar('brand', { length: 100 }).notNull(),
    model: varchar('model', { length: 100 }).notNull(),
    registration: varchar('registration', { length: 20 }).notNull(),
    year: integer('year'),
    fuelType: fuelType('fuel_type'),
    currentKm: integer('current_km'),
    isActive: boolean('is_active').notNull().default(true),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [index('vehicles_driver_idx').on(table.driverId)],
);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey(),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'restrict' }),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id, {
      onDelete: 'set null',
    }),

    type: courseType('type').notNull().default('ONE_WAY'),
    status: courseStatus('status').notNull().default('DRAFT'),

    pickupLabel: text('pickup_label').notNull(),
    pickupLat: doublePrecision('pickup_lat'),
    pickupLng: doublePrecision('pickup_lng'),
    destinationLabel: text('destination_label').notNull(),
    destinationLat: doublePrecision('destination_lat'),
    destinationLng: doublePrecision('destination_lng'),

    /**
     * ADR-008 : instant absolu, jamais DATE + TIME.
     *
     * Un couple date/heure sans fuseau est ambigu deux fois par an — au
     * passage a l'heure d'hiver, 02:30 existe deux fois.
     *
     * `timezone` est conserve EN PLUS de l'instant parce que « la course est a
     * 9 h heure locale » est l'intention de l'utilisateur, et elle doit
     * survivre a un deplacement.
     */
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    timezone: varchar('timezone', { length: 64 })
      .notNull()
      .default('Europe/Paris'),

    passengers: integer('passengers').notNull().default(1),
    luggage: integer('luggage').notNull().default(0),
    childSeat: boolean('child_seat').notNull().default(false),

    /** ADR-009 : centimes entiers. Jamais decimal, jamais float. */
    priceInclTaxCents: integer('price_incl_tax_cents').notNull(),
    finalPriceInclTaxCents: integer('final_price_incl_tax_cents'),

    distanceMeters: integer('distance_meters'),
    durationMinutes: integer('duration_minutes'),

    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // L'index de l'agenda et du dashboard : « mes courses sur une plage ».
    index('courses_driver_scheduled_idx').on(table.driverId, table.scheduledAt),
    index('courses_driver_status_idx').on(table.driverId, table.status),
    index('courses_client_idx').on(table.clientId),
  ],
);

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey(),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').references(() => courses.id, {
      onDelete: 'set null',
    }),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id, {
      onDelete: 'set null',
    }),

    category: expenseCategory('category').notNull(),
    amountCents: integer('amount_cents').notNull(),
    description: text('description'),
    spentAt: timestamp('spent_at', { withTimezone: true }).notNull(),
    receiptUrl: text('receipt_url'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [index('expenses_driver_spent_idx').on(table.driverId, table.spentAt)],
);
