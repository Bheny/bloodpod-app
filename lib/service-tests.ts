/** Tests a lab can offer. Ids are what's stored on the lab, so don't rename them. */
export const SERVICE_TESTS = [
  { id: "blood-group", label: "Blood group (ABO + Rh)", blurb: "Find out your blood type." },
  { id: "genotype", label: "Genotype / sickle cell status", blurb: "AA, AS, SS, AC and so on." },
  { id: "hep-hiv", label: "Hepatitis B and HIV screening", blurb: "The usual checks before donating." },
  { id: "haemoglobin", label: "Haemoglobin / anaemia check", blurb: "Shows if you're fit to donate." },
] as const;

export type ServiceTestId = (typeof SERVICE_TESTS)[number]["id"];

const TEST_IDS = new Set<string>(SERVICE_TESTS.map((t) => t.id));
export const isServiceTestId = (v: string): v is ServiceTestId => TEST_IDS.has(v);
export const testLabel = (id: string) => SERVICE_TESTS.find((t) => t.id === id)?.label ?? id;

export interface LabTest {
  id: ServiceTestId;
  pricePesewas: number | null;
}

/** Reads the stored JSON defensively: anything malformed is dropped. */
export function parseLabTests(raw: unknown): LabTest[] {
  if (!Array.isArray(raw)) return [];
  const out: LabTest[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const { id, pricePesewas } = item as { id?: unknown; pricePesewas?: unknown };
    if (typeof id !== "string" || !isServiceTestId(id)) continue;
    out.push({ id, pricePesewas: typeof pricePesewas === "number" && pricePesewas >= 0 ? pricePesewas : null });
  }
  return out;
}
