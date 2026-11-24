/**
 * When a Pod gets more slots. Pure rules, no database. Slots are never sold and no plan changes them.
 * A Pod that has used every slot, has `complete` ready people, and has a recently passed practice alert
 * gets SLOT_STEP more. Each further step needs the Pod to fill up and pass again.
 */
export const SLOT_STEP = 10;
/** A passed practice alert counts toward more slots for this many days. */
export const SLOT_PASS_FRESH_DAYS = 90;

export function nextSlotLimit(input: {
  slotLimit: number;
  people: number;
  ready: number;
  complete: number;
  passedRecently: boolean;
}): number {
  const { slotLimit, people, ready, complete, passedRecently } = input;
  return people >= slotLimit && ready >= complete && passedRecently ? slotLimit + SLOT_STEP : slotLimit;
}
