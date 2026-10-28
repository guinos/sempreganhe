export function normalizeWhatsAppPhone(countryCode: string | null | undefined, phone: string | null | undefined): string | null {
  const countryDigits = countryCode?.replace(/\D/g, "") ?? "";
  const phoneDigits = phone?.replace(/\D/g, "") ?? "";
  if (!countryDigits || !phoneDigits) return null;
  const localPhone = phoneDigits.startsWith(countryDigits) && phoneDigits.length > countryDigits.length + 7
    ? phoneDigits.slice(countryDigits.length)
    : phoneDigits;
  const fullPhone = `${countryDigits}${localPhone}`;
  return fullPhone.length >= 8 && fullPhone.length <= 15 ? fullPhone : null;
}

export function buildWhatsAppRedemptionUrl(countryCode: string | null | undefined, phone: string | null | undefined, prizeDescription: string): string | null {
  const normalizedPhone = normalizeWhatsAppPhone(countryCode, phone);
  if (!normalizedPhone) return null;
  const message = encodeURIComponent(`Olá! Quero meu prêmio resgatado: ${prizeDescription}.`);
  return `https://wa.me/${normalizedPhone}?text=${message}`;
}
