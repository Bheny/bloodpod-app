import type { BloodType, Genotype } from "@prisma/client";
import { BLOOD_TYPE_LABELS } from "@/lib/blood-type";

/**
 * Medical ID: the few facts someone helping you in an emergency needs, laid out for a lock screen.
 * It is your own data, shown only to you. Nothing here is shared with a Pod, a hospital or anyone else:
 * you save it as an image and choose where it goes.
 */

export interface MedicalIdSource {
  name: string | null;
  bloodType: BloodType | null;
  genotype: Genotype | null;
  allergies: string | null;
  chronicConditions: string | null;
  medications: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export interface MedicalIdOptions {
  /** Conditions and medications are off unless the person turns them on: it is their health data. */
  includeConditions: boolean;
  includeMedications: boolean;
}

export const DEFAULT_OPTIONS: MedicalIdOptions = { includeConditions: false, includeMedications: false };

export interface MedicalIdView {
  name: string | null;
  bloodType: string | null;
  genotype: string | null;
  allergies: string[];
  conditions: string[];
  medications: string[];
  contact: { name: string | null; phone: string | null } | null;
  /** What the person should still add, in plain words. */
  missing: string[];
}

/** "Penicillin, peanuts\nlatex" becomes three items. Empty parts and repeats are dropped. */
export function splitList(text: string | null | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of (text ?? "").split(/[,;\n]+/)) {
    const item = raw.trim().replace(/\s+/g, " ");
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function buildMedicalId(src: MedicalIdSource, options: MedicalIdOptions = DEFAULT_OPTIONS): MedicalIdView {
  const allergies = splitList(src.allergies);
  const contactName = src.emergencyContactName?.trim() || null;
  const contactPhone = src.emergencyContactPhone?.trim() || null;
  const contact = contactName || contactPhone ? { name: contactName, phone: contactPhone } : null;

  const missing: string[] = [];
  if (!src.bloodType) missing.push("your blood group");
  if (!contactPhone) missing.push("an emergency contact's phone number");
  if (allergies.length === 0 && !src.allergies?.trim()) missing.push("your allergies, or that you have none");

  return {
    name: src.name?.trim() || null,
    bloodType: src.bloodType ? BLOOD_TYPE_LABELS[src.bloodType] : null,
    // Unknown is the same as not saying, so it is not printed.
    genotype: src.genotype && src.genotype !== "UNKNOWN" ? src.genotype : null,
    allergies,
    conditions: options.includeConditions ? splitList(src.chronicConditions) : [],
    medications: options.includeMedications ? splitList(src.medications) : [],
    contact,
    missing,
  };
}

/** Breaks text into lines no wider than `maxWidth`, for drawing on a canvas. `measure` returns pixel width. */
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (measure(next) <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}
