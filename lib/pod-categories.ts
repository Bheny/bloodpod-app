/**
 * How a donor knows each person in their Pod. A category is only ever shown to the Pod's owner and to the
 * person it describes. It never appears in admin counts, leaderboards, posters or alerts, and nothing is
 * decided by it: who is alerted and in what order do not depend on category.
 */
export const POD_CATEGORIES = ["FAMILY", "FRIENDS", "SCHOOL", "CHURCH", "WORK", "NEIGHBOURS", "OTHER"] as const;
export type PodCategoryId = (typeof POD_CATEGORIES)[number];

export const POD_CATEGORY_LABELS: Record<PodCategoryId, string> = {
  FAMILY: "Family",
  FRIENDS: "Friends",
  SCHOOL: "School",
  CHURCH: "Church",
  WORK: "Work",
  NEIGHBOURS: "Neighbours",
  OTHER: "Other",
};

export const isPodCategory = (value: unknown): value is PodCategoryId =>
  typeof value === "string" && (POD_CATEGORIES as readonly string[]).includes(value);

/** Anything that is not a known category becomes OTHER, so a bad value can never be stored. */
export function parsePodCategory(value: unknown): PodCategoryId {
  return typeof value === "string" && (POD_CATEGORIES as readonly string[]).includes(value) ? (value as PodCategoryId) : "OTHER";
}

/** Counts per category, in list order, leaving out empty ones. */
export function countByCategory(items: { category: PodCategoryId }[]): { category: PodCategoryId; label: string; count: number }[] {
  return POD_CATEGORIES.map((category) => ({
    category,
    label: POD_CATEGORY_LABELS[category],
    count: items.filter((i) => i.category === category).length,
  })).filter((c) => c.count > 0);
}
