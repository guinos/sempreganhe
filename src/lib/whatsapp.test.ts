import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getWhatsAppConfig } from "./env";
import { normalizeWhatsAppPhone, sendRewardConfirmation, WhatsAppProviderError } from "./whatsapp";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("WhatsApp integration foundation", () => {
  it("requires every protected provider setting without exposing its value", () => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "sensitive-token");
    expect(() => getWhatsAppConfig()).toThrow("WHATSAPP_CLOUD_API_VERSION");
    expect(() => getWhatsAppConfig()).not.toThrow("sensitive-token");
  });

  it("normalizes an international phone number", () => {
    expect(normalizeWhatsAppPhone("+55 (11) 99999-8888")).toBe("5511999998888");
  });

  it("sends a configured utility template and returns the provider message id", async () => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "test-token");
    vi.stubEnv("WHATSAPP_CLOUD_API_VERSION", "v23.0");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "phone-number-id");
    vi.stubEnv("WHATSAPP_REWARD_TEMPLATE_NAME", "reward_confirmation");
    vi.stubEnv("WHATSAPP_TEMPLATE_LANGUAGE", "pt_BR");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ messages: [{ id: "wamid.test" }] }), { status: 200 })));

    await expect(sendRewardConfirmation({ recipientPhone: "+55 11 99999-8888", customerName: "Cliente", prizeDescription: "Brigadeiro", redemptionCode: "ABC123" })).resolves.toBe("wamid.test");
    expect(fetch).toHaveBeenCalledOnce();
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1]).toMatchObject({
      headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" },
    });
  });

  it("does not expose provider response details on failure", async () => {
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "test-token");
    vi.stubEnv("WHATSAPP_CLOUD_API_VERSION", "v23.0");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "phone-number-id");
    vi.stubEnv("WHATSAPP_REWARD_TEMPLATE_NAME", "reward_confirmation");
    vi.stubEnv("WHATSAPP_TEMPLATE_LANGUAGE", "pt_BR");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("provider-secret-detail", { status: 500 })));

    await expect(sendRewardConfirmation({ recipientPhone: "5511999998888", customerName: "Cliente", prizeDescription: "Brigadeiro", redemptionCode: "ABC123" })).rejects.toBeInstanceOf(WhatsAppProviderError);
    await expect(sendRewardConfirmation({ recipientPhone: "invalid", customerName: "Cliente", prizeDescription: "Brigadeiro", redemptionCode: "ABC123" })).rejects.toBeInstanceOf(WhatsAppProviderError);
  });
});
