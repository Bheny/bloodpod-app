/** Accepts a raw code, a pasted invite URL, or a token, and returns the identifier to look up. */
export function parseInviteIdentifier(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] ?? "";
  } catch {
    return trimmed;
  }
}
