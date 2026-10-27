import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));

afterEach(() => vi.unstubAllEnvs());

function request(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(`https://example.test${url}`, init);
}

describe("WhatsApp webhook", () => {
  it("answers Meta's verification challenge only with the configured token", async () => {
    vi.stubEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "verify-token");
    vi.stubEnv("WHATSAPP_APP_SECRET", "app-secret");

    expect(GET(request("/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123"))).toMatchObject({ status: 403 });
    expect(GET(request("/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=123"))).toMatchObject({ status: 200 });
  });

  it("accepts only a body signed with the Meta app secret", async () => {
    const body = JSON.stringify({ entry: [] });
    const appSecret = "app-secret";
    const signature = `sha256=${createHmac("sha256", appSecret).update(body).digest("hex")}`;
    vi.stubEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "verify-token");
    vi.stubEnv("WHATSAPP_APP_SECRET", appSecret);

    await expect(POST(request("/api/webhooks/whatsapp", { method: "POST", body, headers: { "x-hub-signature-256": signature } }))).resolves.toMatchObject({ status: 200 });
    await expect(POST(request("/api/webhooks/whatsapp", { method: "POST", body, headers: { "x-hub-signature-256": "sha256=wrong" } }))).resolves.toMatchObject({ status: 403 });
  });
});
