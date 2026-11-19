import { Card, CardTitle } from "@/components/ui/Card";

export function BloodTypeCoverage({ covered, gaps }: { covered: string[]; gaps: string[] }) {
  return (
    <Card>
      <CardTitle>Blood types covered</CardTitle>
      <p className="mt-1 text-caption text-ink-muted">
        {gaps.length === 0
          ? "Every blood type is covered."
          : `${covered.length} of ${covered.length + gaps.length} types. Dashed ones have nobody yet.`}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {covered.map((type) => (
          <span
            key={type}
            className="rounded-full bg-panel px-3 py-1.5 text-caption font-bold text-white"
          >
            {type}
          </span>
        ))}
        {gaps.map((type) => (
          <span
            key={type}
            className="rounded-full border border-dashed border-red-mid bg-red-light px-3 py-1.5 text-caption font-bold text-red-fg"
          >
            {type}
          </span>
        ))}
      </div>
    </Card>
  );
}
