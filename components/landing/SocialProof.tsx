const ITEMS = [
  "Built in Ghana",
  "O+ compatible matching",
  "SMS alerts in under 60s",
  "Verified donation history",
  "Free to join as a donor",
  "Hospital partnerships",
  "Works offline via SMS",
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
