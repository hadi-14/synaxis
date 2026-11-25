/**
 * Pakistani phone numbers. Accepts 03XX-XXXXXXX, +92 3XX XXXXXXX, 923XXXXXXXXX, 0092…
 * Mobile numbers only for WhatsApp; landlines allowed for alt/guardian via `isPkPhone`.
 */
const digits = (s: string) => s.replace(/[^\d+]/g, "");

export function normalizePkMobile(input: string): string | null {
  let d = digits(input);
  if (d.startsWith("+")) d = d.slice(1);
  if (d.startsWith("0092")) d = d.slice(2);
  if (d.startsWith("92") && d.length === 12) d = d.slice(2);
  if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return /^3\d{9}$/.test(d) ? `+92${d}` : null;
}

export function isPkPhone(input: string): boolean {
  if (normalizePkMobile(input)) return true;
  let d = digits(input).replace(/^\+/, "");
  if (d.startsWith("92")) d = "0" + d.slice(2);
  return /^0\d{9,10}$/.test(d); // landline e.g. 021-XXXXXXXX
}

export const formatPkMobile = (e164: string) =>
  e164.replace(/^\+92(\d{3})(\d{7})$/, "+92 $1 $2");

/** wa.me wants digits only, country code first. */
export const waNumber = (e164OrDigits: string) => e164OrDigits.replace(/\D/g, "");
