import "server-only";
import { authSecretSchema, databaseUrlSchema, logLevelSchema, parseEnv } from "./env-schema";

export function getAuthSecret() {
  return parseEnv("AUTH_SECRET", process.env.AUTH_SECRET, authSecretSchema);
}

export function getDatabaseUrl() {
  return parseEnv("DATABASE_URL", process.env.DATABASE_URL, databaseUrlSchema);
}

export function getLogLevel() {
  return parseEnv("LOG_LEVEL", process.env.LOG_LEVEL, logLevelSchema);
}
