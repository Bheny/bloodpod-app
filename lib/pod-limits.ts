import type { Plan } from "@prisma/client";

export const FREE_POD_MEMBER_LIMIT = 20;

/** Free pods cap at FREE_POD_MEMBER_LIMIT total members (owner included). Pod Pro is unlimited. */
export function isPodFull(memberCount: number, ownerPlan: Plan): boolean {
  return ownerPlan !== "PREMIUM" && memberCount >= FREE_POD_MEMBER_LIMIT;
}
