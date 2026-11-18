// Invites a visitor has opened before they have an account. Kept in the browser and
// joined one by one at the end of onboarding, so opening a second invite never loses the first.

const KEY = "pending_invites_v1";
const LEGACY_KEY = "pending_invite_token";
const MAX = 10;

function readList(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    const items = Array.isArray(list) ? list.filter((v): v is string => typeof v === "string") : [];
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy && !items.includes(legacy)) items.push(legacy);
    return items;
  } catch {
    return [];
  }
}

export function readPendingInvites(): string[] {
  return readList();
}

export function addPendingInvite(identifier: string) {
  const id = identifier.trim();
  if (!id) return;
  try {
    const next = [...readList().filter((v) => v !== id), id].slice(-MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // storage can be blocked; the invite link still works once they are signed in
  }
}

export function clearPendingInvites() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
}
