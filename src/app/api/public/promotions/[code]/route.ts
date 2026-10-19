import { NextResponse } from "next/server";
import { findPublicPromotion, PublicPromotionNotFoundError, scratchPromotion } from "@/lib/public-promotions";

type Context = { params: Promise<{ code: string }> };

export async function GET(_request: Request, context: Context) {
  try {
    const promotion = await findPublicPromotion((await context.params).code);
    return NextResponse.json({ promotion: { title: promotion.title, publicCode: promotion.publicCode } });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(_request: Request, context: Context) {
  try {
    const promotion = await findPublicPromotion((await context.params).code);
    const participation = await scratchPromotion(promotion);
    return NextResponse.json({ participation: { publicToken: participation.publicToken, prizeDescription: participation.prizeDescription, status: participation.status } }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof PublicPromotionNotFoundError) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
