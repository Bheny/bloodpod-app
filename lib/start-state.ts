// Answers collected on /start, before an account exists. They live only in the
// visitor's browser until the onboarding page imports them after sign-up.

const KEY = "bp_start_v1";

export type StartState = {
  bloodType: string | null; // Prisma BloodType value, e.g. "O_NEG"
  neverDonated: boolean;
  lastDonated: string | null; // YYYY-MM-DD
  city: string | null;
  latitude?: number;
  longitude?: number;
};

export const EMPTY_START: StartState = {
  bloodType: null,
  neverDonated: false,
  lastDonated: null,
  city: null,
};

export function readStartState(): StartState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StartState>;
    return { ...EMPTY_START, ...parsed };
  } catch {
    return null;
  }
}

export function writeStartState(state: StartState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage can be blocked (private mode); the flow still works in memory
  }
}

export function clearStartState() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

/** True once /start has enough to be worth importing. */
export function isStartComplete(s: StartState | null): s is StartState {
  return !!s && !!s.bloodType && (s.neverDonated || !!s.lastDonated) && !!s.city;
}
