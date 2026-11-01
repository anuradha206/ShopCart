export const PHONE_VALIDATION_MESSAGE = 'Enter a valid 10-digit Indian mobile number beginning with 6 to 9. You may include +91.';

export function normalizeIndianPhone(value: string): string | null {
  const input = value.trim();
  if (!input || !/^[+\d\s()-]+$/.test(input)) return null;
  const compact = input.replace(/[\s()-]/g, '');
  const local = compact.startsWith('+91') ? compact.slice(3) : compact;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}
