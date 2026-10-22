import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { users, type User } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

export const teamMemberCreateSchema = z.object({
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(200),
  role: z.literal("admin").default("admin"),
});

export const teamMemberUpdateSchema = z.object({ active: z.boolean() });
export type TeamMemberCreateInput = z.infer<typeof teamMemberCreateSchema>;

export class TeamMemberNotFoundError extends Error {
  constructor() {
    super("Team member not found");
    this.name = "TeamMemberNotFoundError";
  }
}

export class TeamMemberConflictError extends Error {
  constructor() {
    super("Email already exists");
    this.name = "TeamMemberConflictError";
  }
}

export class TeamPermissionError extends Error {
  constructor() {
    super("Only the partner owner can manage the team");
    this.name = "TeamPermissionError";
  }
}

export function listTeam(partnerId: string) {
  return getDb().select({ id: users.id, partnerId: users.partnerId, name: users.name, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users).where(eq(users.partnerId, partnerId)).orderBy(desc(users.createdAt));
}

export async function createTeamMember(partnerId: string, input: TeamMemberCreateInput) {
  try {
    const [member] = await getDb().insert(users).values({ partnerId, name: input.name, email: input.email, passwordHash: await hashPassword(input.password), role: input.role }).returning();
    return sanitizeMember(member);
  } catch (error) {
    if (isEmailConflict(error)) throw new TeamMemberConflictError();
    throw error;
  }
}

export async function updateTeamMember(partnerId: string, id: string, active: boolean) {
  const [member] = await getDb().update(users).set({ active, updatedAt: new Date() }).where(and(eq(users.id, id), eq(users.partnerId, partnerId), eq(users.role, "admin"))).returning();
  if (!member) throw new TeamMemberNotFoundError();
  return sanitizeMember(member);
}

export async function getTeamUser(userId: string): Promise<User> {
  const [user] = await getDb().select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new TeamMemberNotFoundError();
  return user;
}

function sanitizeMember(member: User) {
  const { passwordHash: _passwordHash, ...safeMember } = member;
  return safeMember;
}

function isEmailConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23505" && "constraint" in error && error.constraint === "users_email_unique");
}
