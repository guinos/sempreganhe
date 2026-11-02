import { NextResponse } from "next/server";
import { CustomerAccountConflictError, CustomerAccountNotFoundError, customerAccountUpdateSchema, getCustomerAccount, updateCustomerAccount } from "@/lib/customer-accounts";
import { CustomerSessionError, requireCustomerSession } from "@/lib/customer-auth";
import { InvalidPhoneError } from "@/lib/phone";

export async function GET() {
  try {
    const { customerAccountId } = await requireCustomerSession();
    return NextResponse.json({ account: await getCustomerAccount(customerAccountId) });
  } catch (error) {
    if (error instanceof CustomerSessionError || error instanceof CustomerAccountNotFoundError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Não foi possível carregar seus dados." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { customerAccountId } = await requireCustomerSession();
    const input = customerAccountUpdateSchema.parse(await request.json());
    return NextResponse.json({ account: await updateCustomerAccount(customerAccountId, input) });
  } catch (error) {
    if (error instanceof CustomerSessionError || error instanceof CustomerAccountNotFoundError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof CustomerAccountConflictError) {
      return NextResponse.json({ error: "E-mail ou telefone já cadastrado." }, { status: 409 });
    }
    if (error instanceof InvalidPhoneError) {
      return NextResponse.json({ error: "Informe um telefone válido." }, { status: 400 });
    }
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) {
      return NextResponse.json({ error: "Confira os dados informados." }, { status: 400 });
    }
    return NextResponse.json({ error: "Não foi possível salvar seus dados." }, { status: 500 });
  }
}
