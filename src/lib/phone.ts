export class InvalidPhoneError extends Error {
  constructor() {
    super("Invalid phone number");
    this.name = "InvalidPhoneError";
  }
}

export function normalizePhone(phone: string, countryCode = "55"): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) throw new InvalidPhoneError();
  const normalizedCountryCode = countryCode.replace(/\D/g, "") || "55";
  const normalized = digits.startsWith(normalizedCountryCode) || digits.length > 11
    ? digits
    : `${normalizedCountryCode}${digits}`;
  if (normalized.length < 8 || normalized.length > 15) throw new InvalidPhoneError();
  return normalized;
}
