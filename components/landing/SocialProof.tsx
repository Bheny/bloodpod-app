const ITEMS = [
  "Built in Ghana",
  "Matched by blood type",
  "Alerts straight to your phone",
  "No app store needed",
  "Free for donors, always",
  "Never pay to be listed",
  "Private by default",
];

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((item, i) => (
        <span key={i} className="flex items-center whitespace-nowrap text-[13px] font-medium text-ink-muted">
          {item}
          <span className="mx-4 text-red">·</span>
        </span>
      ))}
    </div>
  );
}

export function SocialProof() {
  return (
    <section className="overflow-hidden bg-surface py-7">
      <div className="flex w-max animate-marquee">
        <Row />
        <Row />
      </div>
    </section>
  );
}
