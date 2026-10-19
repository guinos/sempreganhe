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
  restaurants,
  restaurantRelations,
  userRole,
  users,
  userRelations,
  type Customer,
  type NewCustomer,
  type NewParticipation,
  type NewPromotion,
  type NewRestaurant,
  type NewUser,
  type Participation,
  type Promotion,
  type Restaurant,
  type User,
} from "./index";

const columnNames = (table: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(table).columns.map((column) => column.name);

const indexedColumnNames = (index: ReturnType<typeof getTableConfig>["indexes"][number]) =>
  index.config.columns.map((column) => (column as { name?: string }).name);

const tableNames = [restaurants, users, promotions, customers, participations].map(
  (table) => getTableConfig(table).name,
);

it("exports the five tenant-aware domain tables", () => {
  expect(tableNames).toEqual(["restaurants", "users", "promotions", "customers", "participations"]);
  expect(columnNames(users)).toContain("restaurant_id");
  expect(columnNames(promotions)).toContain("restaurant_id");
  expect(columnNames(customers)).toContain("restaurant_id");
  expect(columnNames(participations)).toContain("restaurant_id");
});

it("defines the required columns and timestamp behavior", () => {
  expect(columnNames(restaurants)).toEqual(["id", "name", "slug", "created_at", "updated_at"]);
  expect(columnNames(users)).toEqual([
    "id",
    "restaurant_id",
    "name",
    "email",
    "password_hash",
    "role",
    "created_at",
    "updated_at",
  ]);
  expect(columnNames(promotions)).toEqual([
    "id",
    "restaurant_id",
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
    "restaurant_id",
    "name",
    "phone",
    "created_at",
    "updated_at",
  ]);
  expect(columnNames(participations)).toEqual([
    "id",
    "restaurant_id",
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

  for (const table of [restaurants, users, promotions, customers, participations]) {
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
  expect(participationStatus.enumValues).toEqual(["pending_registration", "redeemed"]);
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

  const restaurantConfig = getTableConfig(restaurants);
  const userConfig = getTableConfig(users);
  const promotionConfig = getTableConfig(promotions);
  const customerConfig = getTableConfig(customers);
  const participationConfig = getTableConfig(participations);

  expect(userConfig.indexes.some((index) => index.config.unique && indexedColumnNames(index).includes("email"))).toBe(true);
  expect(promotionConfig.indexes.some((index) => index.config.unique && indexedColumnNames(index).includes("public_code"))).toBe(true);
  expect(participationConfig.indexes.some((index) => index.config.unique && indexedColumnNames(index).includes("public_token"))).toBe(true);
  expect(customerConfig.indexes.some((index) => index.config.unique && indexedColumnNames(index).join(",") === "restaurant_id,phone")).toBe(true);
  expect(promotionConfig.checks).toHaveLength(1);
  expect(restaurantConfig.foreignKeys).toHaveLength(0);
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
    tableConfig.indexes
      .filter((index) => index.config.unique)
      .map((index) => indexedColumnNames(index).join(","));
  const foreignKeyPairs = participationConfig.foreignKeys.map((foreignKey) => {
    const reference = foreignKey.reference();
    return {
      columns: reference.columns.map((column) => column.name),
      foreignColumns: reference.foreignColumns.map((column) => column.name),
    };
  });

  expect(uniqueColumnPairs(promotionConfig)).toContain("id,restaurant_id");
  expect(uniqueColumnPairs(customerConfig)).toContain("id,restaurant_id");
  expect(foreignKeyPairs).toContainEqual({
    columns: ["promotion_id", "restaurant_id"],
    foreignColumns: ["id", "restaurant_id"],
  });
  expect(foreignKeyPairs).toContainEqual({
    columns: ["customer_id", "restaurant_id"],
    foreignColumns: ["id", "restaurant_id"],
  });
  expect(participations.customerId.notNull).toBe(false);
});

it("exposes relations for tenant-owned records and participation links", () => {
  expect(restaurantRelations).toBeDefined();
  expect(userRelations).toBeDefined();
  expect(promotionRelations).toBeDefined();
  expect(customerRelations).toBeDefined();
  expect(participationRelations).toBeDefined();
});

it("exports inferred select and insert model types", () => {
  expectTypeOf<Restaurant["id"]>().toBeString();
  expectTypeOf<NewRestaurant["name"]>().toBeString();
  expectTypeOf<User["restaurantId"]>().toBeString();
  expectTypeOf<NewUser["passwordHash"]>().toBeString();
  expectTypeOf<Promotion["publicCode"]>().toBeString();
  expectTypeOf<NewPromotion["startsAt"]>().toEqualTypeOf<Date>();
  expectTypeOf<Customer["phone"]>().toBeString();
  expectTypeOf<NewCustomer["restaurantId"]>().toBeString();
  expectTypeOf<Participation["customerId"]>().toEqualTypeOf<string | null>();
  expectTypeOf<NewParticipation["customerId"]>().toEqualTypeOf<string | null | undefined>();
});
