/** Czech Republic phone normalization — shared by client forms and server lead validation. */

export const CZ_COUNTRY_CODE = "420";

/**
 * Czech mobile (ČTÚ public mobile network ranges):
 * - 601–608, 610–614 (3-digit NDC + 6 subscriber digits)
 * - 702–719 (3-digit NDC + 6 subscriber digits)
 * - 72x, 73x, 77x (2-digit NDC + 7 subscriber digits)
 * - 7900–7999 (4-digit NDC + 5 subscriber digits)
 */
const CZ_MOBILE_NATIONAL_RE =
  /^(?:60[1-8]\d{6}|61[0-4]\d{6}|70[2-9]\d{6}|71[0-9]\d{6}|72\d{7}|73\d{7}|77\d{7}|79(?:0\d|1\d|2\d|3\d|4\d|5\d|6\d|7\d|9\d)\d{5})$/;

export const CZ_MOBILE_RE = CZ_MOBILE_NATIONAL_RE;

export const CZ_PHONE_RE = CZ_MOBILE_RE;

export const CZ_PHONE_E164_RE = /^\+420(?:60[1-8]\d{6}|61[0-4]\d{6}|70[2-9]\d{6}|71[0-9]\d{6}|72\d{7}|73\d{7}|77\d{7}|79(?:0\d|1\d|2\d|3\d|4\d|5\d|6\d|7\d|9\d)\d{5})$/;

export const CZ_PHONE_ERROR_CS =
  "Zadejte platné české mobilní číslo (např. 601 234 567).";

function stripCountryAndTrunk(raw: string): string {
  if (raw.startsWith(CZ_COUNTRY_CODE)) return raw.slice(3);
  if (raw.startsWith("0")) return raw.slice(1);
  return raw;
}

export function normalizePhoneCSDigits(input: string): string {
  let raw = input.replace(/\D/g, "");
  raw = stripCountryAndTrunk(raw);
  if (raw.length > 9) raw = raw.slice(0, 9);
  return raw;
}

function extractNationalDigits(input: string): string {
  return stripCountryAndTrunk(input.replace(/\D/g, ""));
}

export function phoneNationalCS(e164OrRaw: string): string {
  return extractNationalDigits(e164OrRaw);
}

export function isValidPhoneCSDigits(digits: string): boolean {
  return CZ_MOBILE_NATIONAL_RE.test(digits);
}

export function formatPhoneE164CS(digits: string): string {
  return `+420${digits}`;
}

export function formatPhoneCSDisplay(digits: string): string {
  const d = normalizePhoneCSDigits(digits);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)}`;
}

export function parsePhoneCS(input: string): { digits: string; e164: string } | null {
  const digits = normalizePhoneCSDigits(input);
  if (!isValidPhoneCSDigits(digits)) return null;
  return { digits, e164: formatPhoneE164CS(digits) };
}
