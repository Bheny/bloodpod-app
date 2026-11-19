"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, FlaskConical, List, Map as MapIcon, MapPin, Navigation, Phone } from "lucide-react";
import { BookingModal } from "@/components/services/BookingModal";
import { PinMap, type MapPin as Pin } from "@/components/map/PinMap";
import { SERVICE_TESTS, testLabel, type ServiceTestId } from "@/lib/service-tests";
import type { ServiceResult, ServicesSearch } from "@/lib/services";
import { ghs } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

function distanceText(km: number | null, origin: ServicesSearch["origin"]) {
  if (km === null) return null;
  const rounded = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return `${origin === "town" ? "About " : ""}${rounded} km away`;
}

export function ServicesFinder({
  selected,
  results,
  origin,
  me,
}: {
  selected: ServiceTestId[];
  results: ServiceResult[];
  origin: ServicesSearch["origin"];
  me: { lat: number; lng: number } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<ServiceTestId[]>(selected);
  const [view, setView] = useState<"list" | "map">("list");
  const [active, setActive] = useState<string | null>(null);
  const [booking, setBooking] = useState<ServiceResult | null>(null);

  function toggle(id: ServiceTestId) {
    const next = picked.includes(id) ? picked.filter((p) => p !== id) : [...picked, id];
    setPicked(next);
    const qs = new URLSearchParams();
    next.forEach((t) => qs.append("test", t));
    startTransition(() => router.replace(qs.size ? `/services?${qs}` : "/services", { scroll: false }));
  }

  const pins = useMemo<Pin[]>(
    () =>
      results.map((r) => ({
        id: r.id,
        lat: r.latitude,
        lng: r.longitude,
        label: String(results.indexOf(r) + 1),
        title: r.name,
        color: r.missing.length === 0 ? "#DD0000" : "#8E8E93",
      })),
    [results],
  );

  const complete = results.filter((r) => r.missing.length === 0).length;

  return (
    <div className="flex flex-col gap-4 px-3.5 pb-8 pt-4 lg:px-0 lg:pt-0">
      <section className="rounded-2xl border-[0.5px] border-hairline bg-card p-4 shadow-raised lg:p-6">
        <h2 className="text-body-sm font-bold text-ink lg:text-title">What do you need checked?</h2>
        <p className="mt-0.5 text-caption text-ink-muted lg:text-body-sm">Pick one or more. We list the nearest labs that offer them.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {SERVICE_TESTS.map((t) => {
            const on = picked.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                aria-pressed={on}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                  on ? "border-red bg-red-light" : "border-hairline bg-card hover:border-red/40",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                    on ? "border-red bg-red text-white" : "border-ink-faint",
                  )}
                >
                  {on && <Check className="size-3.5" />}
                </span>
                <span>
                  <span className="block text-body-sm font-bold text-ink">{t.label}</span>
                  <span className="block text-caption text-ink-muted">{t.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-busy={pending} className={cn("transition-opacity", pending && "opacity-60")}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-label font-semibold text-ink-muted lg:text-body-sm">
            {results.length === 0
              ? "No labs found"
              : picked.length > 1 && complete < results.length
                ? `${complete} lab${complete === 1 ? "" : "s"} offer all ${picked.length}, ${results.length - complete} offer some`
                : `${results.length} lab${results.length === 1 ? "" : "s"}${origin ? ", nearest first" : ""}`}
          </p>
          {results.length > 0 && (
            <div className="flex rounded-full bg-surface p-0.5" role="tablist" aria-label="Results view">
              {(
                [
                  ["list", "List", List],
                  ["map", "Map", MapIcon],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={view === id}
                  onClick={() => setView(id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-label font-bold transition-colors lg:text-body-sm",
                    view === id ? "bg-card text-ink shadow-raised" : "text-ink-muted",
                  )}
                >
                  <Icon className="size-3.5" /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!origin && results.length > 0 && (
          <p className="mt-2 rounded-xl bg-warn-soft p-3 text-caption text-warn-strong">
            Add your city or location in your profile and we&apos;ll sort these by distance from you.
          </p>
        )}

        {view === "map" && results.length > 0 && (
          <div className="mt-3">
            <PinMap pins={pins} me={me} selectedId={active} onSelect={setActive} />
          </div>
        )}

        {results.length === 0 ? (
          <div className="mt-3 rounded-2xl bg-card px-6 py-10 text-center shadow-raised">
            <FlaskConical className="mx-auto size-9 text-ink-faint" />
            <p className="mt-3 text-body-sm font-bold text-ink">
              {picked.length ? "No lab offers that yet" : "No labs listed yet"}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-caption text-ink-muted">
              We only list labs we&apos;ve added ourselves, so the list grows as we do. Try a different test, or check back soon.
            </p>
          </div>
        ) : (
          <ol className="mt-3 flex flex-col gap-3 lg:grid lg:grid-cols-2">
            {results.map((lab, i) => (
              <li key={lab.id}>
                <article
                  onClick={() => setActive(lab.id)}
                  className={cn(
                    "rounded-2xl border-[0.5px] bg-card p-4 shadow-raised lg:p-5",
                    active === lab.id ? "border-red" : "border-hairline",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-panel text-label font-bold text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-bold text-ink lg:text-title">{lab.name}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-caption text-ink-muted">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">{[lab.address, lab.town].filter(Boolean).join(", ")}</span>
                      </p>
                    </div>
                    {distanceText(lab.distanceKm, origin) && (
                      <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-label font-bold text-ink-mid">
                        {distanceText(lab.distanceKm, origin)}
                      </span>
                    )}
                  </div>

                  <ul className="mt-3 flex flex-col gap-1.5">
                    {lab.offered.map((t) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 text-caption">
                        <span className="text-ink">{testLabel(t.id)}</span>
                        <span className="shrink-0 font-bold text-ink-mid">
                          {t.pricePesewas === null ? "Ask for price" : ghs(t.pricePesewas)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {lab.missing.length > 0 && (
                    <p className="mt-2 text-label text-ink-muted">
                      Doesn&apos;t offer: {lab.missing.map(testLabel).join(", ")}
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    {lab.phone && (
                      <a
                        href={`tel:${lab.phone.replace(/[^\d+]/g, "")}`}
                        className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-caption font-bold text-ink-mid"
                      >
                        <Phone className="size-3.5" /> Call
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setBooking(lab)}
                      className="rounded-full bg-red px-4 py-2 text-caption font-bold text-white"
                    >
                      Request a test
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lab.latitude},${lab.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-surface px-4 py-2 text-caption font-bold text-ink-mid"
                    >
                      <Navigation className="size-3.5" /> Directions
                    </a>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}

        {results.length > 0 && (
          <p className="mt-4 text-caption text-ink-muted">
            Prices are set by each lab and can change, so call to confirm before you go.
          </p>
        )}
      </section>

      <BookingModal lab={booking} defaultTests={picked} onClose={() => setBooking(null)} />
    </div>
  );
}
