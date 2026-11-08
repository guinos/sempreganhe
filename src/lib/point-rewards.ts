import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { pointRewards, type PointReward } from "@/db/schema";

const redemptionTypeSchema = z.enum(["percentage", "fixed_amount"]);

export const pointRewardCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1_000).optional().or(z.literal("")),
  redemptionType: redemptionTypeSchema,
  discountValue: z.coerce.number().int().positive().max(100_000),
  active: z.boolean().default(true),
});

export const pointRewardUpdateSchema = pointRewardCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: "At least one field is required",
});

export class PointRewardNotFoundError extends Error {
  constructor() {
    super("Point reward not found");
    this.name = "PointRewardNotFoundError";
  }
}

export function listPointRewards(partnerId: string): Promise<PointReward[]> {
  return getDb().select().from(pointRewards).where(eq(pointRewards.partnerId, partnerId)).orderBy(desc(pointRewards.createdAt));
}

export async function createPointReward(partnerId: string, input: z.infer<typeof pointRewardCreateSchema>): Promise<PointReward> {
  const [reward] = await getDb().insert(pointRewards).values({ ...input, partnerId, description: input.description || null }).returning();
  return reward;
}

export async function updatePointReward(partnerId: string, id: string, input: z.infer<typeof pointRewardUpdateSchema>): Promise<PointReward> {
  const [reward] = await getDb().update(pointRewards).set({ ...input, updatedAt: new Date() })
    .where(and(eq(pointRewards.id, id), eq(pointRewards.partnerId, partnerId))).returning();
  if (!reward) throw new PointRewardNotFoundError();
  return reward;
}

export async function deletePointReward(partnerId: string, id: string): Promise<void> {
  const [reward] = await getDb().delete(pointRewards)
    .where(and(eq(pointRewards.id, id), eq(pointRewards.partnerId, partnerId))).returning({ id: pointRewards.id });
  if (!reward) throw new PointRewardNotFoundError();
}
