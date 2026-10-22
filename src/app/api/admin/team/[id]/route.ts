import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getTeamUser, TeamMemberNotFoundError, TeamPermissionError, teamMemberUpdateSchema, updateTeamMember } from "@/lib/team";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { userId, partnerId } = await requireAdminSession();
    if ((await getTeamUser(userId)).role !== "owner") throw new TeamPermissionError();
    const { id } = await context.params;
    const { active } = teamMemberUpdateSchema.parse(await request.json());
    return NextResponse.json({ member: await updateTeamMember(partnerId, id, active) });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown) {
  if (error instanceof TeamPermissionError) return NextResponse.json({ error: "Apenas o owner pode gerenciar a equipe." }, { status: 403 });
  if (error instanceof TeamMemberNotFoundError) return NextResponse.json({ error: "Membro não encontrado." }, { status: 404 });
  if (error instanceof SyntaxError || (error instanceof Error && error.name === "ZodError")) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  if (error instanceof Error && error.name === "AdminSessionError") return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
}
