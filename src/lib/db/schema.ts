import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const dayOfWeekEnum = pgEnum('day_of_week', [
  'LUNES',
  'MARTES',
  'MIERCOLES',
  'JUEVES',
  'VIERNES',
  'SABADO',
  'DOMINGO',
]);

export const bookingStatusEnum = pgEnum('booking_status', ['confirmed', 'cancelled']);

export const business = pgTable('business', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  address: text('address'),
  phone: text('phone'),
  whatsappNumber: text('whatsapp_number'),
  whatsappMessageTemplate: text('whatsapp_message_template'),
  whatsappClientMessageTemplate: text('whatsapp_client_message_template'),
  mapsUrl: text('maps_url'),
  instagramUrl: text('instagram_url'),
  minAdvanceHours: integer('min_advance_hours').notNull().default(2),
  maxAdvanceDays: integer('max_advance_days').notNull().default(7),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => business.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  durationMin: integer('duration_min').notNull(),
  priceCents: integer('price_cents').notNull().default(0),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  icon: text('icon'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const availabilityBlocks = pgTable('availability_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => business.id, { onDelete: 'cascade' }),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookingBlocks = pgTable('booking_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id')
    .notNull()
    .references(() => business.id, { onDelete: 'cascade' }),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable(
  'clients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('clients_email_idx').on(table.email)],
);

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => business.id, { onDelete: 'cascade' }),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id')
      .notNull()
      .references(() => services.id, { onDelete: 'restrict' }),
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    status: bookingStatusEnum('status').notNull().default('confirmed'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('bookings_start_status_idx').on(table.startAt, table.status),
    index('bookings_business_idx').on(table.businessId),
    index('bookings_client_idx').on(table.clientId),
  ],
);

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const businessRelations = relations(business, ({ many }) => ({
  services: many(services),
  availabilityBlocks: many(availabilityBlocks),
  bookingBlocks: many(bookingBlocks),
  bookings: many(bookings),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  business: one(business, { fields: [services.businessId], references: [business.id] }),
  bookings: many(bookings),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  business: one(business, { fields: [bookings.businessId], references: [business.id] }),
  client: one(clients, { fields: [bookings.clientId], references: [clients.id] }),
  service: one(services, { fields: [bookings.serviceId], references: [services.id] }),
}));
