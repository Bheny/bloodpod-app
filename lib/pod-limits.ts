export const FREE_POD_MEMBER_LIMIT = 20;

/** How many Pods one person can own. Joining other people's Pods is never limited. */
export const FREE_OWNED_POD_LIMIT = 3;
export const PAID_OWNED_POD_LIMIT = 10;

/** Every Pod caps at FREE_POD_MEMBER_LIMIT total members (owner included). No plan changes this. */
export function isPodFull(memberCount: number): boolean {
  return memberCount >= FREE_POD_MEMBER_LIMIT;
}

export function ownedPodLimit(paid: boolean): number {
  return paid ? PAID_OWNED_POD_LIMIT : FREE_OWNED_POD_LIMIT;
}
