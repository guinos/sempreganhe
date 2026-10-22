import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminSession, updateCustomer, deleteCustomer, CustomerConflictError, CustomerNotFoundError, CustomerInUseError } = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
  CustomerConflictError: class extends Error {},
  CustomerNotFoundError: class extends Error {},
  CustomerInUseError: class extends Error {},
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ requireAdminSession }));
vi.mock("@/lib/customers", () => ({
  updateCustomer,
  deleteCustomer,
  CustomerConflictError,
  CustomerNotFoundError,
  CustomerInUseError,
  customerUpdateSchema: { parse: vi.fn((value: Record<string, unknown>) => ({ name: value.name, phone: value.phone })) },
}));

import { DELETE, PATCH } from "./route";

const session = { userId: "user-1", partnerId: "partner-1" };
const context = { params: Promise.resolve({ id: "customer-1" }) };

function request(body?: unknown) {
  return new Request("http://localhost/api/admin/customers/customer-1", {
    method: body === undefined ? "DELETE" : "PATCH",
    headers: { "content-type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminSession.mockResolvedValue(session);
  updateCustomer.mockResolvedValue({ id: "customer-1" });
  deleteCustomer.mockResolvedValue(undefined);
});

describe("admin customer item routes", () => {
  it("updates a customer using the session partner", async () => {
    const response = await PATCH(request({ name: "Ana Atualizada" }), context);

    expect(response.status).toBe(200);
    expect(updateCustomer).toHaveBeenCalledWith(session.partnerId, "customer-1", { name: "Ana Atualizada", phone: undefined });
  });

  it("does not delete a customer that has participations", async () => {
    deleteCustomer.mockRejectedValue(new CustomerInUseError());

    const response = await DELETE(request(), context);

    expect(response.status).toBe(409);
  });
});
