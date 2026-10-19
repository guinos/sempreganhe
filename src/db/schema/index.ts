import { relations, sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["owner", "admin"]);
export const promotionStatus = pgEnum("promotion_status", ["draft", "active", "paused", "ended"]);
export const participationStatus = pgEnum("participation_status", ["pending_registration", "redeemed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const restaurants = pgTable(
  "restaurants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("restaurants_slug_unique").on(table.slug)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    name: text("name").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_restaurant_id_idx").on(table.restaurantId),
    check("users_email_lowercase_check", sql`${table.email} = lower(${table.email})`),
  ],
);

export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    title: text("title").notNull(),
    prizeDescription: text("prize_description").notNull(),
    publicCode: varchar("public_code", { length: 128 }).notNull(),
    status: promotionStatus("status").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("promotions_public_code_unique").on(table.publicCode),
    uniqueIndex("promotions_id_restaurant_unique").on(table.id, table.restaurantId),
    index("promotions_restaurant_id_idx").on(table.restaurantId),
    index("promotions_status_idx").on(table.status),
    index("promotions_period_idx").on(table.startsAt, table.endsAt),
    check("promotions_valid_period_check", sql`${table.endsAt} > ${table.startsAt}`),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customers_restaurant_phone_unique").on(table.restaurantId, table.phone),
    uniqueIndex("customers_id_restaurant_unique").on(table.id, table.restaurantId),
    index("customers_restaurant_id_idx").on(table.restaurantId),
  ],
);

export const participations = pgTable(
  "participations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    restaurantId: uuid("restaurant_id")
      .notNull()
      .references(() => restaurants.id),
    promotionId: uuid("promotion_id").notNull(),
    customerId: uuid("customer_id"),
    publicToken: varchar("public_token", { length: 128 }).notNull(),
    prizeDescription: text("prize_description").notNull(),
    privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true }),
    status: participationStatus("status").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("participations_public_token_unique").on(table.publicToken),
    index("participations_restaurant_id_idx").on(table.restaurantId),
    index("participations_promotion_id_idx").on(table.promotionId),
    index("participations_customer_id_idx").on(table.customerId),
    foreignKey({
      name: "participations_promotion_restaurant_fk",
      columns: [table.promotionId, table.restaurantId],
      foreignColumns: [promotions.id, promotions.restaurantId],
    }),
    foreignKey({
      name: "participations_customer_restaurant_fk",
      columns: [table.customerId, table.restaurantId],
      foreignColumns: [customers.id, customers.restaurantId],
    }),
    check(
      "participations_status_fields_check",
      sql`(
        ${table.status} = 'pending_registration'
        AND ${table.customerId} IS NULL
        AND ${table.registeredAt} IS NULL
        AND ${table.privacyAcceptedAt} IS NULL
      ) OR (
        ${table.status} = 'redeemed'
        AND ${table.customerId} IS NOT NULL
        AND ${table.registeredAt} IS NOT NULL
        AND ${table.privacyAcceptedAt} IS NOT NULL
      )`,
    ),
  ],
);

export const restaurantRelations = relations(restaurants, ({ many }) => ({
  users: many(users),
  promotions: many(promotions),
  customers: many(customers),
  participations: many(participations),
}));

export const userRelations = relations(users, ({ one }) => ({
  restaurant: one(restaurants, { fields: [users.restaurantId], references: [restaurants.id] }),
}));

export const promotionRelations = relations(promotions, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [promotions.restaurantId], references: [restaurants.id] }),
  participations: many(participations),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  restaurant: one(restaurants, { fields: [customers.restaurantId], references: [restaurants.id] }),
  participations: many(participations),
}));

export const participationRelations = relations(participations, ({ one }) => ({
  restaurant: one(restaurants, { fields: [participations.restaurantId], references: [restaurants.id] }),
  promotion: one(promotions, { fields: [participations.promotionId], references: [promotions.id] }),
  customer: one(customers, { fields: [participations.customerId], references: [customers.id] }),
}));

export type Restaurant = InferSelectModel<typeof restaurants>;
export type NewRestaurant = InferInsertModel<typeof restaurants>;
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Promotion = InferSelectModel<typeof promotions>;
export type NewPromotion = InferInsertModel<typeof promotions>;
export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type Participation = InferSelectModel<typeof participations>;
export type NewParticipation = InferInsertModel<typeof participations>;
