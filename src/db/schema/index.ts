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
  jsonb,
} from "drizzle-orm/pg-core";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const userRole = pgEnum("user_role", ["owner", "admin"]);
export const promotionStatus = pgEnum("promotion_status", ["draft", "active", "paused", "ended"]);
export const participationStatus = pgEnum("participation_status", ["pending_registration", "pending_confirmation", "redeemed", "rejected"]);
export const rewardType = pgEnum("reward_type", ["main_prize", "points"]);
export const pointRedemptionType = pgEnum("point_redemption_type", ["percentage", "fixed_amount"]);
export const pointRedemptionStatus = pgEnum("point_redemption_status", ["pending", "confirmed", "rejected"]);
export const pointLedgerEntryType = pgEnum("point_ledger_entry_type", ["earned", "reserved", "released", "adjustment"]);

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

export const adminAuditLogs = pgTable(
  "admin_audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id),
    actorUserId: uuid("actor_user_id")
      .notNull()
      .references(() => users.id),
    action: varchar("action", { length: 80 }).notNull(),
    resourceType: varchar("resource_type", { length: 80 }).notNull(),
    resourceId: uuid("resource_id"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>().default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_logs_partner_created_idx").on(table.partnerId, table.createdAt),
    index("admin_audit_logs_resource_idx").on(table.resourceType, table.resourceId),
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
    mainPrizeProbability: integer("main_prize_probability").default(100).notNull(),
    pointsPerParticipation: integer("points_per_participation").default(0).notNull(),
    mainPrizeMaxRedemptions: integer("main_prize_max_redemptions").default(1).notNull(),
    mainPrizeRedemptions: integer("main_prize_redemptions").default(0).notNull(),
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
    passwordChangedAt: timestamp("password_changed_at", { withTimezone: true }),
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

export const customerPasswordResetTokens = pgTable(
  "customer_password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerAccountId: uuid("customer_account_id")
      .notNull()
      .references(() => customerAccounts.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_password_reset_tokens_hash_unique").on(table.tokenHash),
    index("customer_password_reset_tokens_account_idx").on(table.customerAccountId),
    index("customer_password_reset_tokens_expiry_idx").on(table.expiresAt),
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
    rewardType: rewardType("reward_type").default("main_prize").notNull(),
    pointsAwarded: integer("points_awarded").default(0).notNull(),
    privacyAcceptedAt: timestamp("privacy_accepted_at", { withTimezone: true }),
    scrapedAt: timestamp("scraped_at", { withTimezone: true }).notNull(),
    registeredAt: timestamp("registered_at", { withTimezone: true }),
    status: participationStatus("status").notNull(),
    ...timestamps,
  },
  (table) => [
    unique("participations_id_partner_unique").on(table.id, table.partnerId),
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

export const customerPointBalances = pgTable("customer_point_balances", { id: uuid("id").defaultRandom().primaryKey(), partnerId: uuid("partner_id").notNull().references(() => partners.id), customerId: uuid("customer_id").notNull(), availablePoints: integer("available_points").default(0).notNull(), ...timestamps }, (table) => [unique("customer_point_balances_scope_unique").on(table.partnerId, table.customerId), foreignKey({ name: "customer_point_balances_customer_partner_fk", columns: [table.customerId, table.partnerId], foreignColumns: [customers.id, customers.partnerId] }), check("customer_point_balances_range_check", sql`${table.availablePoints} >= 0 AND ${table.availablePoints} <= 100`)]);

export const pointRewards = pgTable("point_rewards", { id: uuid("id").defaultRandom().primaryKey(), partnerId: uuid("partner_id").notNull().references(() => partners.id), title: text("title").notNull(), description: text("description"), redemptionType: pointRedemptionType("redemption_type").notNull(), discountValue: integer("discount_value").notNull(), costPoints: integer("cost_points").default(100).notNull(), active: boolean("active").default(true).notNull(), ...timestamps }, (table) => [index("point_rewards_partner_id_idx").on(table.partnerId), unique("point_rewards_id_partner_unique").on(table.id, table.partnerId), check("point_rewards_cost_check", sql`${table.costPoints} = 100`), check("point_rewards_value_check", sql`${table.discountValue} > 0`)]);

export const pointRedemptions = pgTable("point_redemptions", { id: uuid("id").defaultRandom().primaryKey(), partnerId: uuid("partner_id").notNull().references(() => partners.id), customerId: uuid("customer_id").notNull(), pointRewardId: uuid("point_reward_id").notNull(), pointsCost: integer("points_cost").notNull(), status: pointRedemptionStatus("status").default("pending").notNull(), requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(), decidedAt: timestamp("decided_at", { withTimezone: true }), decidedByUserId: uuid("decided_by_user_id"), ...timestamps }, (table) => [index("point_redemptions_partner_id_idx").on(table.partnerId), index("point_redemptions_customer_id_idx").on(table.customerId), foreignKey({ name: "point_redemptions_customer_partner_fk", columns: [table.customerId, table.partnerId], foreignColumns: [customers.id, customers.partnerId] }), foreignKey({ name: "point_redemptions_reward_partner_fk", columns: [table.pointRewardId, table.partnerId], foreignColumns: [pointRewards.id, pointRewards.partnerId] }), foreignKey({ name: "point_redemptions_decider_fk", columns: [table.decidedByUserId], foreignColumns: [users.id] }), unique("point_redemptions_id_partner_unique").on(table.id, table.partnerId), check("point_redemptions_cost_check", sql`${table.pointsCost} = 100`)]);

export const customerPointsLedger = pgTable("customer_points_ledger", { id: uuid("id").defaultRandom().primaryKey(), partnerId: uuid("partner_id").notNull().references(() => partners.id), customerId: uuid("customer_id").notNull(), participationId: uuid("participation_id"), redemptionId: uuid("redemption_id"), entryType: pointLedgerEntryType("entry_type").notNull(), pointsDelta: integer("points_delta").notNull(), balanceAfter: integer("balance_after").notNull(), description: text("description"), ...timestamps }, (table) => [index("customer_points_ledger_scope_idx").on(table.partnerId, table.customerId, table.createdAt), uniqueIndex("customer_points_ledger_participation_unique").on(table.participationId, table.entryType), uniqueIndex("customer_points_ledger_redemption_unique").on(table.redemptionId, table.entryType), foreignKey({ name: "customer_points_ledger_customer_partner_fk", columns: [table.customerId, table.partnerId], foreignColumns: [customers.id, customers.partnerId] }), foreignKey({ name: "customer_points_ledger_participation_partner_fk", columns: [table.participationId, table.partnerId], foreignColumns: [participations.id, participations.partnerId] }), foreignKey({ name: "customer_points_ledger_redemption_partner_fk", columns: [table.redemptionId, table.partnerId], foreignColumns: [pointRedemptions.id, pointRedemptions.partnerId] }), check("customer_points_ledger_balance_check", sql`${table.balanceAfter} >= 0 AND ${table.balanceAfter} <= 100`)]);
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
export type AdminAuditLog = InferSelectModel<typeof adminAuditLogs>;
export type NewAdminAuditLog = InferInsertModel<typeof adminAuditLogs>;
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
export type CustomerPointBalance = InferSelectModel<typeof customerPointBalances>;
export type NewCustomerPointBalance = InferInsertModel<typeof customerPointBalances>;
export type PointReward = InferSelectModel<typeof pointRewards>;
export type NewPointReward = InferInsertModel<typeof pointRewards>;
export type PointRedemption = InferSelectModel<typeof pointRedemptions>;
export type NewPointRedemption = InferInsertModel<typeof pointRedemptions>;
export type CustomerPointsLedger = InferSelectModel<typeof customerPointsLedger>;
export type NewCustomerPointsLedger = InferInsertModel<typeof customerPointsLedger>;
