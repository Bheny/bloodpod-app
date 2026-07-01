import type { BloodType } from "@prisma/client";

// Whole blood / red-cell donation compatibility - who each blood type can safely give to.
const CAN_DONATE_TO: Record<BloodType, BloodType[]> = {
  O_NEG: ["O_NEG", "O_POS", "A_NEG", "A_POS", "B_NEG", "B_POS", "AB_NEG", "AB_POS"],
  O_POS: ["O_POS", "A_POS", "B_POS", "AB_POS"],
  A_NEG: ["A_NEG", "A_POS", "AB_NEG", "AB_POS"],
  A_POS: ["A_POS", "AB_POS"],
  B_NEG: ["B_NEG", "B_POS", "AB_NEG", "AB_POS"],
  B_POS: ["B_POS", "AB_POS"],
  AB_NEG: ["AB_NEG", "AB_POS"],
  AB_POS: ["AB_POS"],
};

/** Can someone with `donorType` blood safely donate to someone with `recipientType` blood? */
export function canDonateTo(donorType: BloodType, recipientType: BloodType): boolean {
  return CAN_DONATE_TO[donorType].includes(recipientType);
}
