import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

export function findAdminUserByEmail(email: string) {
  return getDb().select().from(users).where(and(eq(users.email, email), inArray(users.role, ["owner", "admin"]))).limit(1);
}
