export function BloodTypeCoverage({
  covered,
  gaps,
}: {
  covered: string[];
  gaps: string[];
}) {
  return (
    <div className="bg-white px-4 py-3.5 lg:px-6 lg:py-4">
      <p className="text-label font-bold uppercase tracking-wide text-ink-muted">
        Blood types covered
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5 lg:mt-2.5 lg:gap-2">
        {covered.map((type) => (
          <span
            key={type}
            className="rounded-full px-2.5 py-1 text-label font-bold text-white lg:px-3 lg:py-1.5 lg:text-body-sm"
            style={{ backgroundColor: type === "O+" ? "#DD0000" : "#1C1C1E" }}
          >
            {type}
          </span>
        ))}
        {gaps.map((type) => (
          <span
            key={type}
            className="rounded-full border border-dashed border-red-mid bg-red-light px-2.5 py-1 text-label font-bold text-red-mid lg:px-3 lg:py-1.5 lg:text-body-sm"
          >
            {type}?
          </span>
        ))}
      </div>
    </div>
  );
}
