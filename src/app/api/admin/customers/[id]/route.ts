import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  CustomerConflictError,
  CustomerInUseError,
  CustomerNotFoundError,
  customerUpdateSchema,
  deleteCustomer,
  updateCustomer,
} from "@/lib/customers";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { partnerId } = await requireAdminSession();
    const { id } = await context.params;
    const input = customerUpdateSchema.parse(await request.json());
    return NextResponse.json({ customer: await updateCustomer(partnerId, id, input) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { partnerId } = await requireAdminSession();
    const { id } = await context.params;
    await deleteCustomer(partnerId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof CustomerConflictError) return NextResponse.json({ error: "Phone already registered" }, { status: 409 });
  if (error instanceof CustomerNotFoundError) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  if (error instanceof CustomerInUseError) return NextResponse.json({ error: "Customer has participations and cannot be deleted" }, { status: 409 });
  if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
