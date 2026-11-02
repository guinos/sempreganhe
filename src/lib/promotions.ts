import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { promotions, type Promotion } from "@/db/schema";

const promotionStatusSchema = z.enum(["draft", "active", "paused", "ended"]);

export const promotionCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    prizeDescription: z.string().trim().min(1).max(1_000),
    publicCode: z.string().trim().min(1).max(128),
    status: promotionStatusSchema,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    maxParticipationsPerCustomer: z.coerce.number().int().min(1).default(1),
  })
  .refine((value) => value.endsAt > value.startsAt, { message: "endsAt must be after startsAt", path: ["endsAt"] });

export const promotionUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    prizeDescription: z.string().trim().min(1).max(1_000).optional(),
    publicCode: z.string().trim().min(1).max(128).optional(),
    status: promotionStatusSchema.optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    maxParticipationsPerCustomer: z.coerce.number().int().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" })
  .refine((value) => Boolean(value.startsAt) === Boolean(value.endsAt), {
    message: "startsAt and endsAt must be provided together",
    path: ["endsAt"],
  })
  .refine((value) => !value.startsAt || !value.endsAt || value.endsAt > value.startsAt, {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

export type PromotionCreateInput = z.infer<typeof promotionCreateSchema>;
export type PromotionUpdateInput = z.infer<typeof promotionUpdateSchema>;

export class PromotionConflictError extends Error {
  constructor() {
    super("Promotion public code already exists");
    this.name = "PromotionConflictError";
  }
}

export class PromotionNotFoundError extends Error {
  constructor() {
    super("Promotion not found");
    this.name = "PromotionNotFoundError";
  }
}

export function listPromotions(partnerId: string): Promise<Promotion[]> {
  return getDb().select().from(promotions).where(eq(promotions.partnerId, partnerId)).orderBy(desc(promotions.createdAt));
}

export async function createPromotion(partnerId: string, input: PromotionCreateInput): Promise<Promotion> {
  try {
    const [promotion] = await getDb().insert(promotions).values({ ...input, partnerId }).returning();
    return promotion;
  } catch (error) {
    if (isPublicCodeConflict(error)) throw new PromotionConflictError();
    throw error;
  }
}

export async function updatePromotion(partnerId: string, id: string, input: PromotionUpdateInput): Promise<Promotion> {
  try {
    const [promotion] = await getDb()
      .update(promotions)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(promotions.id, id), eq(promotions.partnerId, partnerId)))
      .returning();
    if (!promotion) throw new PromotionNotFoundError();
    return promotion;
  } catch (error) {
    if (error instanceof PromotionNotFoundError) throw error;
    if (isPublicCodeConflict(error)) throw new PromotionConflictError();
    throw error;
  }
}

export async function deletePromotion(partnerId: string, id: string): Promise<Promotion> {
  const [promotion] = await getDb()
    .delete(promotions)
    .where(and(eq(promotions.id, id), eq(promotions.partnerId, partnerId)))
    .returning();
  if (!promotion) throw new PromotionNotFoundError();
  return promotion;
}

function isPublicCodeConflict(error: unknown): boolean {
  return Boolean(
    error && typeof error === "object" && "code" in error && error.code === "23505" &&
      "constraint" in error && error.constraint === "promotions_public_code_unique",
  );
}
