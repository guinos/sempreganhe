import type { Promotion } from "@/db/schema";

export function isPromotionAvailable(promotion: Promotion, now: Date): boolean {
  return promotion.status === "active" && now >= promotion.startsAt && now <= promotion.endsAt;
}
