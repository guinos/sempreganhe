import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { partners, type Partner } from "@/db/schema";

export const partnerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
  whatsappCountryCode: z.string().trim().regex(/^\d{1,3}$/, "Invalid country code").default("55"),
  whatsappPhone: z.string().trim().max(32).nullable(),
  address: z.string().trim().max(500).nullable(),
  hideAddress: z.boolean(),
  currency: z.enum(["BRL", "USD", "EUR"]),
  language: z.enum(["pt-BR", "en-US", "es-ES"]),
  businessType: z.string().trim().max(80).nullable(),
  businessHours: z.string().trim().max(1_000).nullable(),
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
