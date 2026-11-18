/**
 * Normalises a Ghana mobile number to +233XXXXXXXXX, or returns null.
 * Accepts 024 123 4567, 24 123 4567, 233241234567 and +233 24 123 4567.
 */
export function normalizeGhanaPhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("233")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  // Ghana mobile numbers are 9 digits after the country code and start with 2 or 5.
  if (!/^[25]\d{8}$/.test(digits)) return null;
  return `+233${digits}`;
}

/** Like normalizeGhanaPhone but also accepts landlines (e.g. 030 123 4567), for facilities. */
export function normalizeGhanaAnyNumber(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("233")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  if (!/^[2-5]\d{8}$/.test(digits)) return null;
  return `+233${digits}`;
}
