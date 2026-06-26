import { BloodType } from "@prisma/client";

export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A_POS: "A+",
  A_NEG: "A−",
  B_POS: "B+",
  B_NEG: "B−",
  O_POS: "O+",
  O_NEG: "O−",
  AB_POS: "AB+",
  AB_NEG: "AB−",
};

export function isBloodType(value: string): value is BloodType {
  return (Object.values(BloodType) as string[]).includes(value);
}
