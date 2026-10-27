import "server-only";
import {
  authSecretSchema,
  databaseUrlSchema,
  logLevelSchema,
  parseEnv,
  whatsappAccessTokenSchema,
  whatsappApiVersionSchema,
  whatsappPhoneNumberIdSchema,
  whatsappTemplateLanguageSchema,
  whatsappTemplateNameSchema,
  whatsappWebhookVerifyTokenSchema,
  whatsappAppSecretSchema,
} from "./env-schema";

export function getAuthSecret() {
  return parseEnv("AUTH_SECRET", process.env.AUTH_SECRET, authSecretSchema);
}

export function getDatabaseUrl() {
  return parseEnv("DATABASE_URL", process.env.DATABASE_URL, databaseUrlSchema);
}

export function getLogLevel() {
  return parseEnv("LOG_LEVEL", process.env.LOG_LEVEL, logLevelSchema);
}

export type WhatsAppConfig = {
  accessToken: string;
  apiVersion: string;
  phoneNumberId: string;
  rewardTemplateName: string;
  templateLanguage: string;
};

export function getWhatsAppConfig(): WhatsAppConfig {
  return {
    accessToken: parseEnv("WHATSAPP_ACCESS_TOKEN", process.env.WHATSAPP_ACCESS_TOKEN, whatsappAccessTokenSchema),
    apiVersion: parseEnv("WHATSAPP_CLOUD_API_VERSION", process.env.WHATSAPP_CLOUD_API_VERSION, whatsappApiVersionSchema),
    phoneNumberId: parseEnv("WHATSAPP_PHONE_NUMBER_ID", process.env.WHATSAPP_PHONE_NUMBER_ID, whatsappPhoneNumberIdSchema),
    rewardTemplateName: parseEnv("WHATSAPP_REWARD_TEMPLATE_NAME", process.env.WHATSAPP_REWARD_TEMPLATE_NAME, whatsappTemplateNameSchema),
    templateLanguage: parseEnv("WHATSAPP_TEMPLATE_LANGUAGE", process.env.WHATSAPP_TEMPLATE_LANGUAGE, whatsappTemplateLanguageSchema),
  };
}

export function getWhatsAppWebhookConfig() {
  return {
    verifyToken: parseEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN, whatsappWebhookVerifyTokenSchema),
    appSecret: parseEnv("WHATSAPP_APP_SECRET", process.env.WHATSAPP_APP_SECRET, whatsappAppSecretSchema),
  };
}
