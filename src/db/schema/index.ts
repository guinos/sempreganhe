import { relations, sql } from "drizzle-orm";
import {
  check,
  boolean,
  date,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
  text,
} from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["owner", "admin"]);
export const promotionStatus = pgEnum("promotion_status", ["draft", "active", "paused", "ended"]);
export const participationStatus = pgEnum("participation_status", ["pending_registration", "pending_confirmation", "redeemed", "rejected"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const partners = pgTable(
  "partners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    whatsappCountryCode: varchar("whatsapp_country_code", { length: 3 }).default("55").notNull(),
    whatsappPhone: varchar("whatsapp_phone", { length: 32 }),
    address: text("address"),
    hideAddress: boolean("hide_address").default(false).notNull(),
    currency: varchar("currency", { length: 3 }).default("BRL").notNull(),
    language: varchar("language", { length: 10 }).default("pt-BR").notNull(),
    businessType: varchar("business_type", { length: 80 }),
    businessHours: text("business_hours"),
    ...timestamps,
  },
  (table) => [uniqueIndex("partners_slug_unique").on(table.slug)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id),
    name: text("name").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    phone: varchar("phone", { length: 32 }),
    documentType: varchar("document_type", { length: 20 }),
    documentNumber: varchar("document_number", { length: 32 }),
    billingAddress: text("billing_address"),
    active: boolean("active").default(true).notNull(),
    role: userRole("role").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_partner_id_idx").on(table.partnerId),
    check("users_email_lowercase_check", sql`${table.email} = lower(${table.email})`),
  ],
);

export const promotions = pgTable(
  "promotions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id),
    title: text("title").notNull(),
    prizeDescription: text("prize_description").notNull(),
    publicCode: varchar("public_code", { length: 128 }).notNull(),
    status: promotionStatus("status").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    maxParticipationsPerCustomer: integer("max_participations_per_customer").default(1).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("promotions_public_code_unique").on(table.publicCode),
    unique("promotions_id_partner_unique").on(table.id, table.partnerId),
    index("promotions_partner_id_idx").on(table.partnerId),
    index("promotions_status_idx").on(table.status),
    index("promotions_period_idx").on(table.startsAt, table.endsAt),
    check("promotions_valid_period_check", sql`${table.endsAt} > ${table.startsAt}`),
    check("promotions_max_participations_check", sql`${table.maxParticipationsPerCustomer} > 0`),
  ],
);

export const customerAccounts = pgTable(
  "customer_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: varchar("first_name", { length: 80 }).notNull(),
    lastName: varchar("last_name", { length: 120 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 15 }).notNull(),
    birthDate: date("birth_date", { mode: "date" }).notNull(),
    passwordHash: text("password_hash").notNull(),
    privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }).notNull(),
    privacyPolicyVersion: varchar("privacy_policy_version", { length: 32 }).notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customer_accounts_email_unique").on(table.email),
    uniqueIndex("customer_accounts_phone_unique").on(table.phone),
    check("customer_accounts_email_lowercase_check", sql`${table.email} = lower(${table.email})`),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id"),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("customers_partner_phone_unique").on(table.partnerId, table.phone),
    unique("customers_id_partner_unique").on(table.id, table.partnerId),
    index("customers_partner_id_idx").on(table.partnerId),
    index("customers_account_id_idx").on(table.accountId),
    foreignKey({
      name: "customers_account_id_customer_accounts_id_fk",
      columns: [table.accountId],
      foreignColumns: [customerAccounts.id],
    }),
  ],
);


export const participations = pgTable(
  "participations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id),
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
    index("participations_partner_id_idx").on(table.partnerId),
    index("participations_promotion_id_idx").on(table.promotionId),
    index("participations_customer_id_idx").on(table.customerId),
    foreignKey({
      name: "participations_promotion_partner_fk",
      columns: [table.promotionId, table.partnerId],
      foreignColumns: [promotions.id, promotions.partnerId],
    }),
    foreignKey({
      name: "participations_customer_partner_fk",
      columns: [table.customerId, table.partnerId],
      foreignColumns: [customers.id, customers.partnerId],
    }),
    check(
      "participations_status_fields_check",
      sql`(
        ${table.status} = 'pending_registration'
        AND ${table.customerId} IS NULL
        AND ${table.registeredAt} IS NULL
        AND ${table.privacyAcceptedAt} IS NULL
      ) OR (
        ${table.status} IN ('pending_confirmation', 'redeemed', 'rejected')
        AND ${table.customerId} IS NOT NULL
        AND ${table.registeredAt} IS NOT NULL
        AND ${table.privacyAcceptedAt} IS NOT NULL
      )`,
    ),
  ],
);

export const promotionCustomerUsage = pgTable(
  "promotion_customer_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id").notNull().references(() => partners.id),
    promotionId: uuid("promotion_id").notNull(),
    customerId: uuid("customer_id").notNull(),
    participationCount: integer("participation_count").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    unique("promotion_customer_usage_scope_unique").on(table.partnerId, table.promotionId, table.customerId),
    foreignKey({
      name: "promotion_customer_usage_promotion_partner_fk",
      columns: [table.promotionId, table.partnerId],
      foreignColumns: [promotions.id, promotions.partnerId],
    }),
    foreignKey({
      name: "promotion_customer_usage_customer_partner_fk",
      columns: [table.customerId, table.partnerId],
      foreignColumns: [customers.id, customers.partnerId],
    }),
    check("promotion_customer_usage_count_check", sql`${table.participationCount} >= 0`),
  ],
);

export const partnerRelations = relations(partners, ({ many }) => ({
  users: many(users),
  promotions: many(promotions),
  customers: many(customers),
  participations: many(participations),
}));

export const customerAccountRelations = relations(customerAccounts, ({ many }) => ({
  customers: many(customers),
}));

export const userRelations = relations(users, ({ one }) => ({
  partner: one(partners, { fields: [users.partnerId], references: [partners.id] }),
}));

export const promotionRelations = relations(promotions, ({ one, many }) => ({
  partner: one(partners, { fields: [promotions.partnerId], references: [partners.id] }),
  participations: many(participations),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  account: one(customerAccounts, { fields: [customers.accountId], references: [customerAccounts.id] }),
  partner: one(partners, { fields: [customers.partnerId], references: [partners.id] }),
  participations: many(participations),
}));

export const participationRelations = relations(participations, ({ one }) => ({
  partner: one(partners, { fields: [participations.partnerId], references: [partners.id] }),
  promotion: one(promotions, { fields: [participations.promotionId], references: [promotions.id] }),
  customer: one(customers, { fields: [participations.customerId], references: [customers.id] }),
}));

export const promotionCustomerUsageRelations = relations(promotionCustomerUsage, ({ one }) => ({
  partner: one(partners, { fields: [promotionCustomerUsage.partnerId], references: [partners.id] }),
  promotion: one(promotions, { fields: [promotionCustomerUsage.promotionId], references: [promotions.id] }),
  customer: one(customers, { fields: [promotionCustomerUsage.customerId], references: [customers.id] }),
}));

export type Partner = InferSelectModel<typeof partners>;
export type NewPartner = InferInsertModel<typeof partners>;
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Promotion = InferSelectModel<typeof promotions>;
export type NewPromotion = InferInsertModel<typeof promotions>;
export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type CustomerAccount = InferSelectModel<typeof customerAccounts>;
export type NewCustomerAccount = InferInsertModel<typeof customerAccounts>;
export type Participation = InferSelectModel<typeof participations>;
export type NewParticipation = InferInsertModel<typeof participations>;
export type PromotionCustomerUsage = InferSelectModel<typeof promotionCustomerUsage>;
export type NewPromotionCustomerUsage = InferInsertModel<typeof promotionCustomerUsage>;
