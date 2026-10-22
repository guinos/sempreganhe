import { getTableConfig } from "drizzle-orm/pg-core";
import { expect, expectTypeOf, it } from "vitest";
import {
  customers,
  customerRelations,
  participationStatus,
  participations,
  participationRelations,
  promotionStatus,
  promotions,
  promotionRelations,
  partners,
  partnerRelations,
  userRole,
  users,
  userRelations,
  type Customer,
  type NewCustomer,
  type NewParticipation,
  type NewPromotion,
  type NewPartner,
  type NewUser,
  type Participation,
  type Promotion,
  type Partner,
  type User,
} from "./index";

const columnNames = (table: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(table).columns.map((column) => column.name);

const indexedColumnNames = (index: ReturnType<typeof getTableConfig>["indexes"][number]) =>
  index.config.columns.map((column) => (column as { name?: string }).name);

const uniqueConstraintColumnNames = (
  constraint: ReturnType<typeof getTableConfig>["uniqueConstraints"][number],
) => constraint.columns.map((column) => column.name);

const tableNames = [partners, users, promotions, customers, participations].map(
  (table) => getTableConfig(table).name,
);

it("exports the five tenant-aware domain tables", () => {
  expect(tableNames).toEqual(["partners", "users", "promotions", "customers", "participations"]);
  expect(columnNames(users)).toContain("partner_id");
  expect(columnNames(promotions)).toContain("partner_id");
  expect(columnNames(customers)).toContain("partner_id");
  expect(columnNames(participations)).toContain("partner_id");
});

it("defines the required columns and timestamp behavior", () => {
  expect(columnNames(partners)).toEqual([
    "id",
    "name",
    "slug",
    "whatsapp_phone",
    "address",
    "hide_address",
    "currency",
    "language",
    "business_type",
    "business_hours",
    "created_at",
    "updated_at",
  ]);
  expect(columnNames(users)).toEqual([
    "id",
    "partner_id",
    "name",
    "email",
    "password_hash",
    "phone",
    "document_type",
    "document_number",
    "billing_address",
    "active",
    "role",
    "created_at",
    "updated_at",
  ]);
  expect(columnNames(promotions)).toEqual([
    "id",
    "partner_id",
    "title",
    "prize_description",
    "public_code",
    "status",
    "starts_at",
    "ends_at",
    "created_at",
    "updated_at",
  ]);
  expect(columnNames(customers)).toEqual([
    "id",
    "partner_id",
    "name",
    "phone",
    "created_at",
    "updated_at",
  ]);
  expect(columnNames(participations)).toEqual([
    "id",
    "partner_id",
    "promotion_id",
    "customer_id",
    "public_token",
    "prize_description",
    "privacy_accepted_at",
    "scraped_at",
    "registered_at",
    "status",
    "created_at",
    "updated_at",
  ]);

  for (const table of [partners, users, promotions, customers, participations]) {
    const columns = getTableConfig(table).columns;
    expect(columns.find((column) => column.name === "id")?.hasDefault).toBe(true);
    expect(
      columns
        .filter((column) => column.name.endsWith("_at"))
        .every((column) => "withTimezone" in column && column.withTimezone),
    ).toBe(true);
  }
});

it("defines the approved enum values", () => {
  expect(userRole.enumValues).toEqual(["owner", "admin"]);
  expect(promotionStatus.enumValues).toEqual(["draft", "active", "paused", "ended"]);
  expect(participationStatus.enumValues).toEqual(["pending_registration", "pending_confirmation", "redeemed", "rejected"]);
});

it("declares the lowercase email check while keeping email unique", () => {
  const userConfig = getTableConfig(users);

  expect(userConfig.checks.map((check) => check.name)).toContain("users_email_lowercase_check");
  expect(
    userConfig.indexes.some(
      (index) => index.config.unique && indexedColumnNames(index).join(",") === "email",
    ),
  ).toBe(true);
});

it("declares the participation status field consistency check", () => {
  const participationConfig = getTableConfig(participations);

  expect(participationConfig.checks.map((check) => check.name)).toContain(
    "participations_status_fields_check",
  );
});

it("allows an unregistered participation and declares integrity constraints", () => {
  expect(participations.customerId.notNull).toBe(false);

  const partnerConfig = getTableConfig(partners);
  const userConfig = getTableConfig(users);
  const promotionConfig = getTableConfig(promotions);
  const customerConfig = getTableConfig(customers);
  const participationConfig = getTableConfig(participations);

  expect(userConfig.indexes.some((index) => index.config.unique && indexedColumnNames(index).includes("email"))).toBe(true);
  expect(promotionConfig.indexes.some((index) => index.config.unique && indexedColumnNames(index).includes("public_code"))).toBe(true);
  expect(participationConfig.indexes.some((index) => index.config.unique && indexedColumnNames(index).includes("public_token"))).toBe(true);
  expect(customerConfig.indexes.some((index) => index.config.unique && indexedColumnNames(index).join(",") === "partner_id,phone")).toBe(true);
  expect(customerConfig.uniqueConstraints).toHaveLength(1);
  expect(promotionConfig.uniqueConstraints).toHaveLength(1);
  expect(promotionConfig.checks).toHaveLength(1);
  expect(partnerConfig.foreignKeys).toHaveLength(0);
  expect(userConfig.foreignKeys).toHaveLength(1);
  expect(promotionConfig.foreignKeys).toHaveLength(1);
  expect(customerConfig.foreignKeys).toHaveLength(1);
  expect(participationConfig.foreignKeys).toHaveLength(3);
  expect(participationConfig.foreignKeys.every((foreignKey) => foreignKey.onDelete !== "cascade")).toBe(true);
});

it("declares tenant-consistent promotion and nullable customer foreign keys", () => {
  const promotionConfig = getTableConfig(promotions);
  const customerConfig = getTableConfig(customers);
  const participationConfig = getTableConfig(participations);
  const uniqueColumnPairs = (tableConfig: ReturnType<typeof getTableConfig>) =>
    tableConfig.uniqueConstraints.map((constraint) => uniqueConstraintColumnNames(constraint).join(","));
  const foreignKeyPairs = participationConfig.foreignKeys.map((foreignKey) => {
    const reference = foreignKey.reference();
    return {
      columns: reference.columns.map((column) => column.name),
      foreignColumns: reference.foreignColumns.map((column) => column.name),
    };
  });

  expect(uniqueColumnPairs(promotionConfig)).toContain("id,partner_id");
  expect(uniqueColumnPairs(customerConfig)).toContain("id,partner_id");
  expect(foreignKeyPairs).toContainEqual({
    columns: ["promotion_id", "partner_id"],
    foreignColumns: ["id", "partner_id"],
  });
  expect(foreignKeyPairs).toContainEqual({
    columns: ["customer_id", "partner_id"],
    foreignColumns: ["id", "partner_id"],
  });
  expect(participations.customerId.notNull).toBe(false);
});

it("exposes relations for tenant-owned records and participation links", () => {
  expect(partnerRelations).toBeDefined();
  expect(userRelations).toBeDefined();
  expect(promotionRelations).toBeDefined();
  expect(customerRelations).toBeDefined();
  expect(participationRelations).toBeDefined();
});

it("exports inferred select and insert model types", () => {
  expectTypeOf<Partner["id"]>().toBeString();
  expectTypeOf<NewPartner["name"]>().toBeString();
  expectTypeOf<User["partnerId"]>().toBeString();
  expectTypeOf<NewUser["passwordHash"]>().toBeString();
  expectTypeOf<Promotion["publicCode"]>().toBeString();
  expectTypeOf<NewPromotion["startsAt"]>().toEqualTypeOf<Date>();
  expectTypeOf<Customer["phone"]>().toBeString();
  expectTypeOf<NewCustomer["partnerId"]>().toBeString();
  expectTypeOf<Participation["customerId"]>().toEqualTypeOf<string | null>();
  expectTypeOf<NewParticipation["customerId"]>().toEqualTypeOf<string | null | undefined>();
});
