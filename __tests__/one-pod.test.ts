import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TIERS } from "@/lib/plan-catalog";

const read = (p: string) => readFileSync(p, "utf8");
/** The code without its comments, so a comment about plans does not trip a rule about plans. */
const code = (p: string) => read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("one Pod per donor", () => {
  it("the limit is one, and no plan or payment decides it", () => {
    const src = code("lib/pod-access.ts");
    expect(src).toMatch(/OWNED_POD_LIMIT = 1/);
    expect(src).not.toMatch(/plan|subscription|premium|paid|paystack/i);
    expect(code("lib/pod-limits.ts")).not.toMatch(/OWNED|ownedPodLimit/);
  });

  it("nothing offers or sells more Pods any more", () => {
    const lines = TIERS.flatMap((t) => t.lines.map((l) => l.text));
    for (const text of lines) expect(text).not.toMatch(/\d+ Pods|Pods of your own|more Pods/i);
    expect(lines.join(" ")).toMatch(/Your own Pod/);
    for (const f of ["components/pod/CreatePodCard.tsx", "app/(app)/upgrade/done/page.tsx", "app/api/pods/new/route.ts"]) {
      expect(read(f), f).not.toMatch(/Pod limit reached|More Pods|own more Pods|upgrade for more|Create another Pod|Start another Pod/);
    }
  });

  it("the create card shows only to someone without a Pod, and so do the dashboard slides", () => {
    expect(read("components/pod/CreatePodCard.tsx")).toMatch(/if \(owned >= limit\) return null/);
    for (const f of ["components/dashboard/home/HomeHero.tsx", "components/dashboard/PodCarousel.tsx"]) {
      expect(read(f), f).toMatch(/const canStart = allowance\.canCreate/);
      expect(read(f), f).toMatch(/\{canStart && \(/);
    }
  });

  it("creating a second Pod is refused, and a double tap cannot make two", () => {
    const route = read("app/api/pods/new/route.ts");
    expect(route).toMatch(/!allowance\.canCreate/);
    expect(route).toMatch(/status: 409/);
    expect(route).toMatch(/P2002/);
    expect(read("app/api/pods/route.ts")).toMatch(/P2002/);
  });

  it("someone who already leads a Pod is not offered a spin-off", () => {
    const src = read("lib/readiness/spinoff.ts");
    expect(src).toMatch(/\.owned > 0\) return \[\]/);
    expect(src).toMatch(/You already lead a Pod/);
  });

  it("the database allows one Pod per owner", () => {
    expect(read("prisma/schema.prisma")).toMatch(/model Pod \{[\s\S]*?@@unique\(\[ownerId\]\)[\s\S]*?\n\}/);
  });
});
