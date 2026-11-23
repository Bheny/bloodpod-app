/**
 * What a new member says matters to them, asked at the start of sign-up. Stored as the ids, never the
 * labels, so the wording can change without breaking old answers.
 */
export const INTENTS = [
  {
    id: "know_type",
    label: "Knowing my blood group, genotype and rhesus factor",
    tool: "Your blood type and medical details, kept on your Blood Card",
  },
  {
    id: "be_ready",
    label: "Being ready for the day I need blood",
    tool: "A circle of people who answer when blood is needed",
  },
  {
    id: "trusted_people",
    label: "Having people I trust who will show up",
    tool: "A Pod for the people you trust, up to 20 of them",
  },
  {
    id: "donate_again",
    label: "Keeping track of when I can donate again",
    tool: "Your donation dates, and when you can give again",
  },
  {
    id: "find_blood",
    label: "Finding blood quickly for someone I love",
    tool: "Donors near you that you can ask for help",
  },
  {
    id: "help_others",
    label: "Helping other people by giving blood",
    tool: "A place to be called on when your type is needed",
  },
] as const;

/** Chosen on its own; it replaces any other answers. */
export const INTENT_UNSURE = "unsure";

export const INTENT_IDS: string[] = [...INTENTS.map((i) => i.id), INTENT_UNSURE];

/** What we start with when someone has not said (or said they are not sure). */
const DEFAULT_TOOLS = ["be_ready", "know_type", "trusted_people"];

/** Up to three tools that match what they picked, in the order they picked them. */
export function toolsFor(chosen: string[] | undefined): string[] {
  const ids = (chosen ?? []).filter((id) => INTENTS.some((i) => i.id === id));
  const use = ids.length > 0 ? ids : DEFAULT_TOOLS;
  return use.slice(0, 3).map((id) => INTENTS.find((i) => i.id === id)!.tool);
}
