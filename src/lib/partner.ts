import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { partners, type Partner } from "@/db/schema";

export const partnerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
});

export class PartnerNotFoundError extends Error {
  constructor() {
    super("Partner not found");
    this.name = "PartnerNotFoundError";
  }
}

export class PartnerConflictError extends Error {
  constructor() {
    super("Partner slug already exists");
    this.name = "PartnerConflictError";
  }
}

export async function getPartner(partnerId: string): Promise<Partner> {
  const [partner] = await getDb().select().from(partners).where(eq(partners.id, partnerId)).limit(1);
  if (!partner) throw new PartnerNotFoundError();
  return partner;
}

export async function updatePartner(partnerId: string, input: z.infer<typeof partnerUpdateSchema>): Promise<Partner> {
  try {
    const [partner] = await getDb().update(partners).set({ ...input, updatedAt: new Date() }).where(eq(partners.id, partnerId)).returning();
    if (!partner) throw new PartnerNotFoundError();
    return partner;
  } catch (error) {
    if (error instanceof PartnerNotFoundError) throw error;
    if (isSlugConflict(error)) throw new PartnerConflictError();
    throw error;
  }
}

function isSlugConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505" && "constraint" in error && error.constraint === "partners_slug_unique");
}
