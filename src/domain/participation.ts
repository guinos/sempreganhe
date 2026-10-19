import type { Participation } from "@/db/schema";

export function completeParticipation(
  participation: Participation,
  input: { customerId: string; completedAt: Date },
): Participation {
  if (participation.status !== "pending_registration" && participation.status !== "pending_confirmation" && participation.status !== "redeemed") {
    throw new Error(`Unknown participation status: ${String(participation.status)}`);
  }

  if (participation.status === "pending_confirmation" || participation.status === "redeemed") {
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
    status: "pending_confirmation",
  };
}

export function confirmParticipation(participation: Participation, confirmedAt: Date): Participation {
  if (participation.status === "redeemed") return { ...participation };
  if (participation.status !== "pending_confirmation") {
    throw new Error(`Cannot confirm participation with status: ${String(participation.status)}`);
  }
  return { ...participation, status: "redeemed", updatedAt: confirmedAt };
}

export function rejectParticipation(participation: Participation, rejectedAt: Date): Participation {
  if (participation.status === "rejected") return { ...participation };
  if (participation.status !== "pending_confirmation") {
    throw new Error(`Cannot reject participation with status: ${String(participation.status)}`);
  }
  return { ...participation, status: "rejected", updatedAt: rejectedAt };
}
