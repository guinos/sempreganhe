import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { AccountConflictError, AccountNotFoundError, accountEmailSchema, accountPasswordSchema, accountProfileSchema, getAccount, InvalidCurrentPasswordError, updateAccountEmail, updateAccountPassword, updateAccountProfile } from "@/lib/account";

export async function GET() {
  try {
    const { userId } = await requireAdminSession();
    return NextResponse.json({ account: sanitizeAccount(await getAccount(userId)) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await requireAdminSession();
    const input = accountProfileSchema.parse(await request.json());
    return NextResponse.json({ account: sanitizeAccount(await updateAccountProfile(userId, input)) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await requireAdminSession();
    const input = accountEmailSchema.parse(await request.json());
    return NextResponse.json({ account: sanitizeAccount(await updateAccountEmail(userId, input.email)) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireAdminSession();
    const input = accountPasswordSchema.parse(await request.json());
    await updateAccountPassword(userId, input.currentPassword, input.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

function sanitizeAccount(account: Awaited<ReturnType<typeof getAccount>>) {
  const { passwordHash: _passwordHash, ...safeAccount } = account;
  return safeAccount;
}

function handleError(error: unknown) {
  if (error instanceof AccountConflictError) return NextResponse.json({ error: "E-mail já está em uso." }, { status: 409 });
  if (error instanceof InvalidCurrentPasswordError) return NextResponse.json({ error: "Senha atual inválida." }, { status: 400 });
  if (error instanceof AccountNotFoundError) return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
}
