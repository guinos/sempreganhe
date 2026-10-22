import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminSession, listCustomers, createCustomer, CustomerConflictError } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  CustomerConflictError: class extends Error {},
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAdminSession }));
vi.mock("@/lib/customers", () => ({
  listCustomers,
  createCustomer,
  CustomerConflictError,
  customerCreateSchema: { parse: vi.fn((value: Record<string, unknown>) => ({ name: value.name, phone: value.phone })) },
}));

import { GET, POST } from "./route";

const session = { userId: "user-1", partnerId: "partner-1" };

function request(body?: unknown, url = "http://localhost/api/admin/customers") {
  return new Request(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminSession.mockResolvedValue(session);
  listCustomers.mockResolvedValue([]);
  createCustomer.mockResolvedValue({ id: "customer-1" });
});

describe("admin customers collection routes", () => {
  it("lists customers using the session partner and optional search", async () => {
    const response = await GET(request(undefined, "http://localhost/api/admin/customers?search=ana"));

    expect(response.status).toBe(200);
    expect(listCustomers).toHaveBeenCalledWith(session.partnerId, "ana");
  });

  it("creates a customer without accepting partnerId from the payload", async () => {
    const response = await POST(request({ partnerId: "attacker-partner", name: "Ana", phone: "5511999999999" }));

    expect(response.status).toBe(201);
    expect(createCustomer).toHaveBeenCalledWith(session.partnerId, { name: "Ana", phone: "5511999999999" });
  });

  it("returns unauthorized when the session is missing", async () => {
    requireAdminSession.mockRejectedValue(Object.assign(new Error("unauthorized"), { name: "AdminSessionError" }));

    const response = await GET(request());

    expect(response.status).toBe(401);
  });

  it("returns conflict when the phone is already registered", async () => {
    createCustomer.mockRejectedValue(new CustomerConflictError());

    const response = await POST(request({ name: "Ana", phone: "5511999999999" }));

    expect(response.status).toBe(409);
  });
});
