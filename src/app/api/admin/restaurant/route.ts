import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getRestaurant, RestaurantConflictError, RestaurantNotFoundError, restaurantUpdateSchema, updateRestaurant } from "@/lib/restaurant";

export async function GET() {
  try {
    const { restaurantId } = await requireAdminSession();
    return NextResponse.json({ restaurant: await getRestaurant(restaurantId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { restaurantId } = await requireAdminSession();
    const input = restaurantUpdateSchema.parse(await request.json());
    return NextResponse.json({ restaurant: await updateRestaurant(restaurantId, input) });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof RestaurantConflictError) return NextResponse.json({ error: "Slug já utilizado" }, { status: 409 });
  if (error instanceof RestaurantNotFoundError) return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
  if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
