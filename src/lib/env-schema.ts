import { z } from "zod";

export const databaseUrlSchema = z.string().refine((value) => {
  try {
    const url = new URL(value);
    return ["postgres:", "postgresql:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
});

export const logLevelSchema = z.enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"]).default("info");

export const authSecretSchema = z.string().min(32);

export const whatsappApiVersionSchema = z.string().regex(/^v\d+\.\d+$/);
export const whatsappPhoneNumberIdSchema = z.string().min(1).max(100);
export const whatsappAccessTokenSchema = z.string().min(1);
export const whatsappTemplateNameSchema = z.string().regex(/^[a-z0-9_]+$/);
export const whatsappTemplateLanguageSchema = z.string().regex(/^[a-z]{2}_[A-Z]{2}$/);
export const whatsappWebhookVerifyTokenSchema = z.string().min(1);
export const whatsappAppSecretSchema = z.string().min(1);

export function parseEnv<T>(key: string, value: unknown, schema: z.ZodType<T>): T {
  const result = schema.safeParse(value);
  // Zod issues can include input values; expose only the variable name.
  if (!result.success) throw new Error(`Invalid or missing environment variable: ${key}`);
  return result.data;
}
