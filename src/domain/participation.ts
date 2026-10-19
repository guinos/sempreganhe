import type { Participation } from "@/db/schema";

export function completeParticipation(
  participation: Participation,
  input: { customerId: string; completedAt: Date },
): Participation {
  if (participation.status !== "pending_registration" && participation.status !== "redeemed") {
    throw new Error(`Unknown participation status: ${String(participation.status)}`);
  }

  if (participation.status === "redeemed") {
    return { ...participation };
  }

  if (!input.customerId.trim()) {
    throw new Error("customerId must not be empty");
  }

  return {
    ...participation,
    customerId: input.customerId,
    privacyAcceptedAt: input.completedAt,
    registeredAt: input.completedAt,
    status: "redeemed",
  };
}
