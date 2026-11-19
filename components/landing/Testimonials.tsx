import { Reveal } from "@/components/landing/Reveal";
import { SAMPLE_TESTIMONIALS, TESTIMONIALS, type Testimonial } from "@/lib/testimonials";
import { getInitials } from "@/lib/formatters";
import { cn } from "@/lib/utils";

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="w-[320px] shrink-0 rounded-card border-[0.5px] border-hairline bg-card p-6 shadow-raised">
      <blockquote className="text-sm leading-[1.7] text-ink-mid">&ldquo;{t.quote}&rdquo;</blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-red-light text-xs font-bold text-red-fg">
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
  // Repeat just enough that one copy is wider than a large screen (about 1600px), so the loop never
  // shows a gap. Repeating more only makes the moving layer huge, which phones struggle to draw.
  const reps = Math.max(1, Math.ceil(1600 / (items.length * 340)));
  const row = Array.from({ length: reps }, () => items).flat();
  return (
    <div className="group relative overflow-hidden">
      {/* Soft edges drawn as overlays. A CSS mask on the moving strip forces the browser to redraw
          the whole thing every frame, which was a likely cause of the stutter. */}
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-surface to-transparent" />
      <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-surface to-transparent" />
      <div
        className={cn(
          "flex w-max animate-marquee py-2 group-hover:[animation-play-state:paused] motion-reduce:[animation:none]",
          reverse && "[animation-direction:reverse]",
        )}
        style={{ animationDuration: `${seconds}s` }}
      >
        {[row, row].map((r, i) => (
          // Spacing is padding inside each copy, not a gap between them, so both copies are exactly
          // the same width and the -50% loop lands precisely on the start with no jump.
          <div key={i} className="flex shrink-0 gap-5 pr-5" aria-hidden={i === 1}>
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
        <p className="text-[11px] font-bold uppercase tracking-[2.5px] text-red-fg">In their words</p>
        <h2 className="mt-4 text-[32px] font-extrabold tracking-[-1px] text-ink lg:text-[40px]">
          What our first Pods say.
        </h2>
        {isSample && (
          <p className="mx-auto mt-4 max-w-[520px] rounded-xl bg-red-light px-4 py-2 text-xs font-semibold text-red-fg">
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
