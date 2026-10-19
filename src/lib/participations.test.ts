import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({ db: {} as Record<string, unknown> }));

vi.mock("server-only", () => ({}));
vi.mock("@/db", () => ({ getDb: () => db }));

import { listParticipations } from "./participations";

describe("participation service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("filters participation queries by the session restaurant", async () => {
    const query = {
      from: vi.fn().mockReturnThis(),
      innerJoin: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([]),
    };
    db.select = vi.fn().mockReturnValue(query);

    await expect(listParticipations("restaurant-1")).resolves.toEqual([]);
    expect(query.where).toHaveBeenCalledOnce();
  });
});
