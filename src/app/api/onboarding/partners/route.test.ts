import { beforeEach, describe, expect, it, vi } from "vitest";

const { partnerRegistrationSchema, registerPartner, PartnerRegistrationConflictError } = vi.hoisted(() => ({
  partnerRegistrationSchema: { parse: vi.fn((value: unknown) => value) },
  registerPartner: vi.fn(),
  PartnerRegistrationConflictError: class extends Error {},
}));

vi.mock("@/lib/onboarding", () => ({ partnerRegistrationSchema, registerPartner, PartnerRegistrationConflictError }));

import { POST } from "./route";

const request = (body: unknown) => new Request("http://localhost/api/onboarding/partners", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  registerPartner.mockResolvedValue({ partner: { id: "partner-1", name: "Meu negócio", slug: "meu-negocio" }, owner: { id: "owner-1", email: "owner@example.com", role: "owner" } });
});

describe("partner onboarding route", () => {
  it("confirms creation without returning internal records or a password", async () => {
    const response = await POST(request({ partnerName: "Meu negócio", slug: "meu-negocio", ownerName: "Owner", ownerEmail: "owner@example.com", ownerPassword: "password123", whatsappPhone: "", businessType: "" }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true });
  });

  it("returns conflict without revealing whether slug or email exists", async () => {
    registerPartner.mockRejectedValue(new PartnerRegistrationConflictError());

    const response = await POST(request({}));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "Não foi possível concluir o cadastro. Verifique os dados informados." });
  });
});
