import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { restaurants, type Restaurant } from "@/db/schema";

export const restaurantUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido"),
});

export class RestaurantNotFoundError extends Error {
  constructor() {
    super("Restaurant not found");
    this.name = "RestaurantNotFoundError";
  }
}

export class RestaurantConflictError extends Error {
  constructor() {
    super("Restaurant slug already exists");
    this.name = "RestaurantConflictError";
  }
}

export async function getRestaurant(restaurantId: string): Promise<Restaurant> {
  const [restaurant] = await getDb().select().from(restaurants).where(eq(restaurants.id, restaurantId)).limit(1);
  if (!restaurant) throw new RestaurantNotFoundError();
  return restaurant;
}

export async function updateRestaurant(restaurantId: string, input: z.infer<typeof restaurantUpdateSchema>): Promise<Restaurant> {
  try {
    const [restaurant] = await getDb().update(restaurants).set({ ...input, updatedAt: new Date() }).where(eq(restaurants.id, restaurantId)).returning();
    if (!restaurant) throw new RestaurantNotFoundError();
    return restaurant;
  } catch (error) {
    if (error instanceof RestaurantNotFoundError) throw error;
    if (isSlugConflict(error)) throw new RestaurantConflictError();
    throw error;
  }
}

function isSlugConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505" && "constraint" in error && error.constraint === "restaurants_slug_unique");
}
