import "server-only";

import { getWhatsAppConfig } from "./env";

export class WhatsAppProviderError extends Error {
  constructor() {
    super("WhatsApp provider request failed");
    this.name = "WhatsAppProviderError";
  }
}

export type RewardConfirmationMessage = {
  recipientPhone: string;
  customerName: string;
  prizeDescription: string;
  redemptionCode: string;
};

export function normalizeWhatsAppPhone(phone: string): string {
  const normalized = phone.replace(/\D/g, "");
  if (normalized.length < 8 || normalized.length > 15) throw new WhatsAppProviderError();
  return normalized;
}

export async function sendRewardConfirmation(input: RewardConfirmationMessage): Promise<string> {
  const config = getWhatsAppConfig();
  const response = await fetch(`https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: normalizeWhatsAppPhone(input.recipientPhone),
      type: "template",
      template: {
        name: config.rewardTemplateName,
        language: { code: config.templateLanguage },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: input.customerName },
              { type: "text", text: input.prizeDescription },
              { type: "text", text: input.redemptionCode },
            ],
          },
        ],
      },
    }),
  });

  if (!response.ok) throw new WhatsAppProviderError();
  const body: unknown = await response.json();
  if (!isProviderResponse(body)) throw new WhatsAppProviderError();
  return body.messages[0].id;
}

function isProviderResponse(value: unknown): value is { messages: [{ id: string }] } {
  if (!value || typeof value !== "object" || !("messages" in value)) return false;
  const messages = (value as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) return false;
  const first = messages[0];
  return Boolean(first && typeof first === "object" && "id" in first && typeof first.id === "string" && first.id.length > 0);
}
