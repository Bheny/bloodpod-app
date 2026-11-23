import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildMedicalId, splitList, wrapText, type MedicalIdSource } from "@/lib/medical-id";

const full: MedicalIdSource = {
  name: "  Ama Boateng ",
  bloodType: "O_NEG",
  genotype: "AS",
  allergies: "Penicillin, peanuts\nlatex; penicillin",
  chronicConditions: "Sickle cell trait",
  medications: "Folic acid",
  emergencyContactName: "Kojo",
  emergencyContactPhone: "024 123 4567",
};

describe("Medical ID", () => {
  it("shows the essentials and keeps conditions and medications off by default", () => {
    const v = buildMedicalId(full);
    expect(v.name).toBe("Ama Boateng");
    expect(v.bloodType).toBe("O−");
    expect(v.genotype).toBe("AS");
    expect(v.allergies).toEqual(["Penicillin", "peanuts", "latex"]);
    expect(v.conditions).toEqual([]);
    expect(v.medications).toEqual([]);
    expect(v.contact).toEqual({ name: "Kojo", phone: "024 123 4567" });
    expect(v.missing).toEqual([]);
  });

  it("adds conditions and medications only when the person turns them on", () => {
    const v = buildMedicalId(full, { includeConditions: true, includeMedications: true });
    expect(v.conditions).toEqual(["Sickle cell trait"]);
    expect(v.medications).toEqual(["Folic acid"]);
  });

  it("says what is missing, in plain words", () => {
    const v = buildMedicalId({ ...full, bloodType: null, allergies: null, emergencyContactPhone: null });
    expect(v.missing).toEqual(["your blood group", "an emergency contact's phone number", "your allergies, or that you have none"]);
  });

  it("does not print an unknown genotype", () => {
    expect(buildMedicalId({ ...full, genotype: "UNKNOWN" }).genotype).toBeNull();
  });

  it("splits a list on commas, semicolons and new lines, once each", () => {
    expect(splitList(" a ,, b;\n a ")).toEqual(["a", "b"]);
    expect(splitList(null)).toEqual([]);
  });

  it("wraps long text to a width, and never drops a long single word", () => {
    const measure = (s: string) => s.length * 10;
    expect(wrapText("one two three four", 100, measure)).toEqual(["one two", "three four"]);
    expect(wrapText("supercalifragilistic", 50, measure)).toEqual(["supercalifragilistic"]);
  });
});

describe("Medical ID stays private", () => {
  it("the page and the image code never send the data anywhere", () => {
    const files = ["lib/medical-id.ts", "components/medical-id/MedicalIdCard.tsx"];
    for (const f of files) {
      const src = readFileSync(join(process.cwd(), f), "utf8");
      expect(src, f).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|prisma\.|@\/lib\/prisma/);
    }
  });
});
