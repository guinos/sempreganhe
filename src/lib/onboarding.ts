import "server-only";

import { z } from "zod";
import { getDb } from "@/db";
import { partners, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

export const partnerRegistrationSchema = z.object({
  partnerName: z.string().trim().min(2).max(160),
  slug: z.string().trim().toLowerCase().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  ownerName: z.string().trim().min(2).max(160),
  ownerEmail: z.string().trim().toLowerCase().email().max(320),
  ownerPassword: z.string().min(8).max(200),
  whatsappCountryCode: z.string().trim().regex(/^\d{1,3}$/).optional().default("55"),
  whatsappPhone: z.string().trim().max(32).optional().default("").transform((value) => value || null),
  businessType: z.string().trim().max(80).optional().default("").transform((value) => value || null),
});

export class PartnerRegistrationConflictError extends Error {
  constructor() {
    super("Partner registration conflict");
    this.name = "PartnerRegistrationConflictError";
  }
}

export async function registerPartner(input: z.infer<typeof partnerRegistrationSchema>) {
  try {
    return await getDb().transaction(async (tx) => {
      const [partner] = await tx.insert(partners).values({
        name: input.partnerName,
        slug: input.slug,
        whatsappCountryCode: input.whatsappCountryCode,
        whatsappPhone: input.whatsappPhone,
        businessType: input.businessType,
      }).returning({ id: partners.id, name: partners.name, slug: partners.slug });

      const [owner] = await tx.insert(users).values({
        partnerId: partner.id,
        name: input.ownerName,
        email: input.ownerEmail,
        passwordHash: await hashPassword(input.ownerPassword),
        role: "owner",
      }).returning({ id: users.id, email: users.email, role: users.role });

      return { partner, owner };
    });
  } catch (error) {
    if (isRegistrationConflict(error)) throw new PartnerRegistrationConflictError();
    throw error;
  }
}

function isRegistrationConflict(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "23505" &&
      "constraint" in error && (error.constraint === "partners_slug_unique" || error.constraint === "users_email_unique"),
  );
}
