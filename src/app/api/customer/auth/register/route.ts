import { NextResponse } from "next/server";
import { createCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME, customerSessionCookieOptions } from "@/lib/customer-auth";
import { CustomerAccountConflictError, customerAccountRegistrationSchema, registerCustomerAccount } from "@/lib/customer-accounts";
import { InvalidPhoneError } from "@/lib/phone";

export async function POST(request: Request) {
  try {
    const account = await registerCustomerAccount(customerAccountRegistrationSchema.parse(await request.json()));
    const response = NextResponse.json({ ok: true }, { status: 201 });
    response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, createCustomerSessionToken({ customerAccountId: account.id }), customerSessionCookieOptions);
    return response;
  } catch (error) {
    if (error instanceof CustomerAccountConflictError) return NextResponse.json({ error: "E-mail ou telefone já cadastrado." }, { status: 409 });
    if (error instanceof InvalidPhoneError) return NextResponse.json({ error: "Informe um telefone válido." }, { status: 400 });
    if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Confira os dados informados." }, { status: 400 });
    return NextResponse.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 });
  }
}
