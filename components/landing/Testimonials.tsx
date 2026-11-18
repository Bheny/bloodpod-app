import { Reveal } from "@/components/landing/Reveal";
import { SAMPLE_TESTIMONIALS, TESTIMONIALS, type Testimonial } from "@/lib/testimonials";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="w-[320px] shrink-0 rounded-card border-[0.5px] border-[#E5E5EA] bg-white p-6 shadow-raised">
      <blockquote className="text-sm leading-[1.7] text-ink-mid">&ldquo;{t.quote}&rdquo;</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-red-light text-xs font-bold text-red">
          {getInitials(t.name)}
        </span>
        <span>
          <span className="block text-sm font-bold text-ink">{t.name}</span>
          <span className="block text-xs text-ink-muted">
            {t.role}
            {t.place ? ` · ${t.place}` : ""}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

function Track({ items, reverse, seconds }: { items: Testimonial[]; reverse?: boolean; seconds: number }) {
  // Repeat enough times that the -50% loop never shows a gap.
  const row = [...items, ...items, ...items];
  return (
    <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={cn(
          "flex w-max animate-marquee gap-5 py-2 group-hover:[animation-play-state:paused] motion-reduce:[animation:none]",
          reverse && "[animation-direction:reverse]",
        )}
        style={{ animationDuration: `${seconds}s` }}
      >
        {[row, row].map((r, i) => (
          <div key={i} className="flex gap-5" aria-hidden={i === 1}>
            {r.map((t, j) => (
              <Card key={`${t.name}-${j}`} t={t} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  const isSample = TESTIMONIALS.length === 0;
  if (isSample && process.env.NODE_ENV === "production") return null;

  const items = isSample ? SAMPLE_TESTIMONIALS : TESTIMONIALS;
  const half = Math.ceil(items.length / 2);
  const rowA = items.slice(0, half);
  const rowB = items.slice(half).length ? items.slice(half) : items;

  return (
    <section className="overflow-hidden px-0 py-24">
      <Reveal className="px-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red">In their words</p>
        <h2 className="mt-4 text-[32px] font-extrabold tracking-[-1px] text-ink lg:text-[40px]">
          What our first Pods say.
        </h2>
        {isSample && (
          <p className="mx-auto mt-4 max-w-[520px] rounded-xl bg-red-light px-4 py-2 text-xs font-semibold text-red">
            Development preview with sample text. Hidden in production until real quotes are added in
            lib/testimonials.ts.
          </p>
        )}
      </Reveal>

      <div className="mt-12 space-y-5">
        <Track items={rowA} seconds={50} />
        <Track items={rowB} reverse seconds={60} />
      </div>
    </section>
  );
}
