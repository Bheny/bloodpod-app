/** People to invite (besides you) before a Pod counts as started. */
export const INVITE_GOAL = 3;

export function hasOpenNextSteps({ hasPush, memberCount }: { hasPush: boolean; memberCount: number }) {
  return !hasPush || memberCount - 1 < INVITE_GOAL;
}
