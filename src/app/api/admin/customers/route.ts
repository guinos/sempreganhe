import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createCustomer, customerCreateSchema, CustomerConflictError, listCustomers } from "@/lib/customers";

export async function GET(request: Request) {
  try {
    const { partnerId } = await requireAdminSession();
    const search = new URL(request.url).searchParams.get("search") ?? undefined;
    return NextResponse.json({ customers: await listCustomers(partnerId, search) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { partnerId } = await requireAdminSession();
    const input = customerCreateSchema.parse(await request.json());
    return NextResponse.json({ customer: await createCustomer(partnerId, input) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof CustomerConflictError) return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
  if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
