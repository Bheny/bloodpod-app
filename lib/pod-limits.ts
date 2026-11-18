export const FREE_POD_MEMBER_LIMIT = 20;

/** Every Pod caps at FREE_POD_MEMBER_LIMIT total members (owner included). No plan changes this. */
export function isPodFull(memberCount: number): boolean {
  return memberCount >= FREE_POD_MEMBER_LIMIT;
}
