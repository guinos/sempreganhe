import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createTeamMember, getTeamUser, listTeam, TeamMemberConflictError, TeamPermissionError, teamMemberCreateSchema } from "@/lib/team";

export async function GET() {
  try {
    const { partnerId } = await requireAdminSession();
    return NextResponse.json({ team: await listTeam(partnerId) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId, partnerId } = await requireAdminSession();
    if ((await getTeamUser(partnerId, userId)).role !== "owner") throw new TeamPermissionError();
    const input = teamMemberCreateSchema.parse(await request.json());
    return NextResponse.json({ member: await createTeamMember(partnerId, input) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof TeamPermissionError) return NextResponse.json({ error: "Apenas o owner pode gerenciar a equipe." }, { status: 403 });
  if (error instanceof TeamMemberConflictError) return NextResponse.json({ error: "E-mail já está em uso." }, { status: 409 });
  if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
}
