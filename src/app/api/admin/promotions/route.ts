import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { createPromotion, listPromotions, PromotionConflictError, promotionCreateSchema } from "@/lib/promotions";

export async function GET() {
  try {
    const { partnerId } = await requireAdminSession();
    return NextResponse.json({ promotions: await listPromotions(partnerId) }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { partnerId } = await requireAdminSession();
    const input = promotionCreateSchema.parse(await request.json());
    return NextResponse.json({ promotion: await createPromotion(partnerId, input) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof SyntaxError || error instanceof TypeError) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (error instanceof PromotionConflictError) return NextResponse.json({ error: "Já existe uma promoção com esse código público." }, { status: 409 });
  if (error instanceof Error && error.name === "ZodError") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  logger.error({
    errorName: error instanceof Error ? error.name : "UnknownError",
    code: getErrorProperty(error, "code"),
    constraint: getErrorProperty(error, "constraint"),
    table: getErrorProperty(error, "table"),
    column: getErrorProperty(error, "column"),
  }, "Admin promotion request failed");
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

function getErrorProperty(error: unknown, property: string): string | undefined {
  if (!error || typeof error !== "object" || !(property in error)) return undefined;
  const value = (error as Record<string, unknown>)[property];
  return typeof value === "string" ? value : undefined;
}
