import { describe, expect, it } from "vitest";
import { buildWhatsAppRedemptionUrl, normalizeWhatsAppPhone } from "./whatsapp-link";

describe("WhatsApp redemption link", () => {
  it("combines country code, DDD and phone", () => {
    expect(normalizeWhatsAppPhone("55", "11 99765-4321")).toBe("5511997654321");
    expect(buildWhatsAppRedemptionUrl("55", "11 99765-4321", "Ganhe um brigadeiro")).toBe("https://wa.me/5511997654321?text=Ol%C3%A1!%20Quero%20meu%20pr%C3%AAmio%20resgatado%3A%20Ganhe%20um%20brigadeiro.");
  });

  it("supports another country without adding Brazil", () => {
    expect(normalizeWhatsAppPhone("351", "912345678")).toBe("351912345678");
  });

  it("returns no link for missing or invalid phone data", () => {
    expect(buildWhatsAppRedemptionUrl("55", "", "prêmio")).toBeNull();
    expect(normalizeWhatsAppPhone("55", "123")).toBeNull();
  });
});
