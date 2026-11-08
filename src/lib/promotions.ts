import "server-only";

import { randomBytes } from "node:crypto";
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
    mainPrizeProbability: z.coerce.number().int().min(0).max(100).default(100),
    pointsPerParticipation: z.coerce.number().int().min(0).max(100).default(0),
    mainPrizeMaxRedemptions: z.coerce.number().int().min(1).default(1),
  })
  .refine((value) => value.endsAt > value.startsAt, { message: "endsAt must be after startsAt", path: ["endsAt"] })
  .refine((value) => value.mainPrizeProbability === 100 || value.pointsPerParticipation > 0, {
    message: "Points per participation are required when the main prize probability is below 100",
    path: ["pointsPerParticipation"],
  });

export const promotionUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    prizeDescription: z.string().trim().min(1).max(1_000).optional(),
    publicCode: z.string().trim().min(1).max(128).optional(),
    status: promotionStatusSchema.optional(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional(),
    maxParticipationsPerCustomer: z.coerce.number().int().min(1).optional(),
    mainPrizeProbability: z.coerce.number().int().min(0).max(100).optional(),
    pointsPerParticipation: z.coerce.number().int().min(0).max(100).optional(),
    mainPrizeMaxRedemptions: z.coerce.number().int().min(1).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "At least one field is required" })
  .refine((value) => Boolean(value.startsAt) === Boolean(value.endsAt), {
    message: "startsAt and endsAt must be provided together",
    path: ["endsAt"],
  })
  .refine((value) => !value.startsAt || !value.endsAt || value.endsAt > value.startsAt, {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  })
  .refine((value) => value.mainPrizeProbability === undefined || value.mainPrizeProbability === 100 || (value.pointsPerParticipation ?? 0) > 0, {
    message: "Points per participation are required when the main prize probability is below 100",
    path: ["pointsPerParticipation"],
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

export class PromotionLimitError extends Error {
  constructor() {
    super("O limite principal não pode ser menor que a quantidade de prêmios já resgatados.");
    this.name = "PromotionLimitError";
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

export async function duplicatePromotion(partnerId: string, id: string): Promise<Promotion> {
  const [source] = await getDb()
    .select()
    .from(promotions)
    .where(and(eq(promotions.id, id), eq(promotions.partnerId, partnerId)))
    .limit(1);
  if (!source) throw new PromotionNotFoundError();

  const codeSuffix = `-COPIA-${randomBytes(8).toString("hex").toUpperCase()}`;
  const [copy] = await getDb()
    .insert(promotions)
    .values({
      partnerId,
      title: `${source.title.slice(0, 192)} (cópia)`,
      prizeDescription: source.prizeDescription,
      publicCode: `${source.publicCode.slice(0, 128 - codeSuffix.length)}${codeSuffix}`,
      status: "draft",
      startsAt: source.startsAt,
      endsAt: source.endsAt,
      maxParticipationsPerCustomer: source.maxParticipationsPerCustomer,
      mainPrizeProbability: source.mainPrizeProbability,
      pointsPerParticipation: source.pointsPerParticipation,
      mainPrizeMaxRedemptions: source.mainPrizeMaxRedemptions,
      mainPrizeRedemptions: 0,
    })
    .returning();

  return copy;
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
    if (isMainPrizeLimitConflict(error)) throw new PromotionLimitError();
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
  if (!error || typeof error !== "object") return false;
  const databaseError = error as { code?: unknown; constraint?: unknown; message?: unknown };
  return databaseError.code === "23505" && (
    databaseError.constraint === "promotions_public_code_unique" ||
    (typeof databaseError.message === "string" && databaseError.message.includes('"promotions_public_code_unique"'))
  );
}

function isMainPrizeLimitConflict(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const databaseError = error as { code?: unknown; constraint?: unknown; message?: unknown };
  return databaseError.code === "23514" && (
    databaseError.constraint === "promotions_main_prize_redemptions_check" ||
    (typeof databaseError.message === "string" && databaseError.message.includes("promotions_main_prize_redemptions_check"))
  );
}
