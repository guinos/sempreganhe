import "server-only";

import { getDb } from "@/db";
import { adminAuditLogs } from "@/db/schema";
import { logger } from "@/lib/logger";

type AuditMetadata = Record<string, string | number | boolean | null>;

export async function recordAdminAudit(input: {
  partnerId: string;
  actorUserId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: AuditMetadata;
}) {
  try {
    await getDb().insert(adminAuditLogs).values({
      partnerId: input.partnerId,
      actorUserId: input.actorUserId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata ?? {},
    });
  } catch (error) {
    logger.error({ code: (error as NodeJS.ErrnoException).code }, "Admin audit log failed");
  }
}
