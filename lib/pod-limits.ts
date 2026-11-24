/** Every Pod starts with this many slots, owner included. No plan changes it. */
export const FREE_POD_MEMBER_LIMIT = 20;

/** Full when the Pod has used every slot. `slotLimit` is the Pod's own limit; it starts at 20 and can grow. */
export function isPodFull(memberCount: number, slotLimit: number = FREE_POD_MEMBER_LIMIT): boolean {
  return memberCount >= slotLimit;
}
