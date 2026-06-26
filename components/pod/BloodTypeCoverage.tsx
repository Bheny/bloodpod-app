export function BloodTypeCoverage({
  covered,
  gaps,
}: {
  covered: string[];
  gaps: string[];
}) {
  return (
    <div className="bg-white px-4 py-3.5">
      <p className="text-[8px] font-bold uppercase tracking-wide text-ink-muted">
        Blood types covered
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {covered.map((type) => (
          <span
            key={type}
            className="rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
            style={{ backgroundColor: type === "O+" ? "#DD0000" : "#1C1C1E" }}
          >
            {type}
          </span>
        ))}
        {gaps.map((type) => (
          <span
            key={type}
            className="rounded-full border border-dashed border-red-mid bg-red-light px-2.5 py-1 text-[11px] font-bold text-red-mid"
          >
            {type}?
          </span>
        ))}
      </div>
    </div>
  );
}
