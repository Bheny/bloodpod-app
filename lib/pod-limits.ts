/** Every Pod starts with this many slots, owner included. No plan changes it. */
export const FREE_POD_MEMBER_LIMIT = 20;

/** How many Pods one person can own. Joining other people's Pods is never limited. */
export const FREE_OWNED_POD_LIMIT = 3;
export const PAID_OWNED_POD_LIMIT = 10;

/** Full when the Pod has used every slot. `slotLimit` is the Pod's own limit; it starts at 20 and can grow. */
export function isPodFull(memberCount: number, slotLimit: number = FREE_POD_MEMBER_LIMIT): boolean {
  return memberCount >= slotLimit;
}

export function ownedPodLimit(paid: boolean): number {
  return paid ? PAID_OWNED_POD_LIMIT : FREE_OWNED_POD_LIMIT;
}
