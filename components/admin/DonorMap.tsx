"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertTriangle, MapPin, Search, X } from "lucide-react";
import type * as LeafletNS from "leaflet";
import type { MapData, MapHospital, MapPlace } from "@/lib/admin/map-types";
import { haversineDistanceKm } from "@/lib/geo";
import { Badge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Leaflet = typeof LeafletNS;
type Mode = "donors" | "readiness" | "blood";
type Selection = { kind: "place" | "hospital"; id: string } | null;

const ALL_TYPES = ["O−", "O+", "A−", "A+", "B−", "B+", "AB−", "AB+"];
const RADII = [5, 10, 20, 30, 50];
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const GHANA_CENTER: [number, number] = [7.95, -1.05];

const GREEN = "#16A34A";
const AMBER = "#F59E0B";
const RED = "#DD0000";
const GREY = "#A1A1AA";

function placeStyle(p: MapPlace, mode: Mode, blood: string) {
  if (mode === "donors") return { value: p.donors, color: RED, hollow: false };
  if (mode === "readiness") {
    const share = p.onboarded ? p.eligible / p.donors : 0;
    return { value: p.donors, color: p.eligible === 0 ? RED : share >= 0.6 ? GREEN : share >= 0.3 ? AMBER : GREY, hollow: false };
  }
  const t = p.blood[blood];
  if (!t || t.total === 0) return { value: 1, color: GREY, hollow: true };
  return { value: Math.max(t.eligible, 1), color: t.eligible > 0 ? GREEN : AMBER, hollow: t.eligible === 0 };
}

type Reach = {
  donors: number;
  eligible: number;
  blood: Record<string, number>;
  missing: string[];
  places: { place: MapPlace; km: number }[];
};

function reachOf(h: MapHospital, places: MapPlace[], radiusKm: number): Reach | null {
  if (h.lat === null || h.lng === null) return null;
  const inside = places
    .map((place) => ({ place, km: haversineDistanceKm(h.lat!, h.lng!, place.lat, place.lng) }))
    .filter((x) => x.km <= radiusKm)
    .sort((a, b) => a.km - b.km);
  const blood: Record<string, number> = {};
  let donors = 0;
  let eligible = 0;
  for (const { place } of inside) {
    donors += place.donors;
    eligible += place.eligible;
    for (const [type, t] of Object.entries(place.blood)) blood[type] = (blood[type] ?? 0) + t.eligible;
  }
  return { donors, eligible, blood, missing: ALL_TYPES.filter((t) => !blood[t]), places: inside };
}

export function DonorMap({ data }: { data: MapData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const libRef = useRef<Leaflet | null>(null);
  const layerRef = useRef<LeafletNS.LayerGroup | null>(null);

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("readiness");
  const [blood, setBlood] = useState("O−");
  const [radius, setRadius] = useState(10);
  const [showReach, setShowReach] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selection, setSelection] = useState<Selection>(null);
  const [query, setQuery] = useState("");

  const placedHospitals = useMemo(() => data.hospitals.filter((h) => h.lat !== null), [data.hospitals]);
  const unplacedHospitals = data.hospitals.length - placedHospitals.length;

  // ---- Create the map once -----------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    (async () => {
      const mod = await import("leaflet");
      const L = (("default" in mod ? mod.default : mod) as unknown) as Leaflet;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: GHANA_CENTER,
        zoom: 7,
        minZoom: 6,
        maxZoom: 14,
        zoomControl: false,
        maxBounds: [
          [3.2, -4.6],
          [12.2, 2.6],
        ],
        maxBoundsViscosity: 0.8,
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      L.tileLayer(TILES, { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);

      libRef.current = L;
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      map.on("click", () => setSelection(null));

      observer = new ResizeObserver(() => map.invalidateSize());
      observer.observe(containerRef.current);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // ---- Draw towns and hospitals whenever anything changes ----------------------
  useEffect(() => {
    const L = libRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !layer) return;
    layer.clearLayers();

    // Hospital reach first so bubbles sit on top.
    if (showReach) {
      for (const h of placedHospitals) {
        L.circle([h.lat!, h.lng!], {
          radius: radius * 1000,
          color: "#1D4ED8",
          weight: 1.5,
          dashArray: "6 6",
          fillColor: "#1D4ED8",
          fillOpacity: 0.05,
          interactive: false,
        }).addTo(layer);
      }
    }

    for (const p of data.places) {
      const s = placeStyle(p, mode, blood);
      const selected = selection?.kind === "place" && selection.id === p.id;
      const marker = L.circleMarker([p.lat, p.lng], {
        radius: Math.min(40, 7 + Math.sqrt(s.value) * 5),
        color: selected ? "#1C1C1E" : s.color,
        weight: selected ? 3 : 2,
        fillColor: s.color,
        fillOpacity: s.hollow ? 0.05 : 0.55,
      }).addTo(layer);

      const detail =
        mode === "blood"
          ? `${p.blood[blood]?.eligible ?? 0} ${blood} can donate`
          : `${p.donors} donor${p.donors === 1 ? "" : "s"} · ${p.eligible} can donate`;
      marker.bindTooltip(`<strong>${escapeHtml(p.name)}</strong><br/>${detail}`, { direction: "top", offset: [0, -4] });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        setSelection({ kind: "place", id: p.id });
      });

      if (showLabels) {
        L.marker([p.lat, p.lng], {
          interactive: false,
          icon: L.divIcon({ className: "bp-map-label", html: escapeHtml(p.name), iconSize: [0, 0], iconAnchor: [0, -(Math.min(40, 7 + Math.sqrt(s.value) * 5) + 2)] }),
        }).addTo(layer);
      }
    }

    for (const h of placedHospitals) {
      const selected = selection?.kind === "hospital" && selection.id === h.id;
      const marker = L.marker([h.lat!, h.lng!], {
        icon: L.divIcon({
          className: "",
          html: `<div class="bp-hospital${selected ? " bp-hospital-on" : ""}">H</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        }),
        zIndexOffset: 1000,
      }).addTo(layer);
      marker.bindTooltip(`<strong>${escapeHtml(h.name)}</strong><br/>${escapeHtml(h.city)}`, { direction: "top", offset: [0, -14] });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        setSelection({ kind: "hospital", id: h.id });
      });
    }
  }, [ready, data.places, placedHospitals, mode, blood, radius, showReach, showLabels, selection]);

  const flyTo = (lat: number, lng: number, zoom = 10) => mapRef.current?.flyTo([lat, lng], zoom, { duration: 0.8 });

  function select(sel: NonNullable<Selection>) {
    setSelection(sel);
    if (sel.kind === "place") {
      const p = data.places.find((x) => x.id === sel.id);
      if (p) flyTo(p.lat, p.lng, Math.max(mapRef.current?.getZoom() ?? 8, 9));
    } else {
      const h = data.hospitals.find((x) => x.id === sel.id);
      if (h?.lat != null && h.lng != null) flyTo(h.lat, h.lng, 10);
    }
  }

  const fitAll = () => {
    const L = libRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const pts = [...data.places.map((p) => [p.lat, p.lng] as [number, number]), ...placedHospitals.map((h) => [h.lat!, h.lng!] as [number, number])];
    if (pts.length === 0) map.setView(GHANA_CENTER, 7);
    else map.fitBounds(L.latLngBounds(pts), { padding: [60, 60], maxZoom: 10 });
    setSelection(null);
  };

  // ---- Derived numbers for the side panel --------------------------------------
  const selectedPlace = selection?.kind === "place" ? (data.places.find((p) => p.id === selection.id) ?? null) : null;
  const selectedHospital = selection?.kind === "hospital" ? (data.hospitals.find((h) => h.id === selection.id) ?? null) : null;
  const hospitalReach = selectedHospital ? reachOf(selectedHospital, data.places, radius) : null;

  const placeHospitals = useMemo(() => {
    if (!selectedPlace) return [];
    return placedHospitals
      .map((h) => ({ h, km: haversineDistanceKm(h.lat!, h.lng!, selectedPlace.lat, selectedPlace.lng) }))
      .filter((x) => x.km <= radius)
      .sort((a, b) => a.km - b.km);
  }, [selectedPlace, placedHospitals, radius]);

  const totals = useMemo(() => {
    const blood: Record<string, number> = {};
    let donors = 0;
    let eligible = 0;
    for (const p of data.places) {
      donors += p.donors;
      eligible += p.eligible;
      for (const [t, v] of Object.entries(p.blood)) blood[t] = (blood[t] ?? 0) + v.eligible;
    }
    return { donors, eligible, gaps: ALL_TYPES.filter((t) => !blood[t]) };
  }, [data.places]);

  const matches = query.trim() ? data.places.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6) : [];

  if (data.total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-white px-6 py-16 text-center">
        <p className="text-body-sm font-bold text-ink">No donors to map yet</p>
        <p className="mx-auto mt-1 max-w-sm text-caption text-ink-muted">Donors appear here by town as they sign up and share their city.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-1 rounded-full bg-white p-1 shadow-raised" role="group" aria-label="Colour the map by">
          {(
            [
              ["readiness", "Readiness"],
              ["donors", "Donors"],
              ["blood", "Blood type"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn("rounded-full px-3 py-1.5 text-caption font-bold transition-colors", mode === id ? "bg-ink text-white" : "text-ink-mid hover:text-ink")}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "blood" && (
          <select
            value={blood}
            onChange={(e) => setBlood(e.target.value)}
            aria-label="Blood type to map"
            className="rounded-xl border border-hairline bg-white px-3 py-2 text-caption font-bold text-ink focus:border-red focus:outline-none"
          >
            {ALL_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}

        <label className="flex items-center gap-2 text-caption font-semibold text-ink-mid">
          Hospital reach
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="rounded-xl border border-hairline bg-white px-2.5 py-1.5 text-caption font-bold text-ink focus:border-red focus:outline-none"
          >
            {RADII.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-caption font-semibold text-ink-mid">
          <input type="checkbox" checked={showReach} onChange={(e) => setShowReach(e.target.checked)} className="size-4 accent-[#dd0000]" />
          Show reach circles
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-caption font-semibold text-ink-mid">
          <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="size-4 accent-[#dd0000]" />
          Town names
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Map */}
        <div className="relative isolate overflow-hidden rounded-2xl border-[0.5px] border-hairline bg-white shadow-raised">
          <div ref={containerRef} className="h-[62vh] min-h-[440px] w-full lg:h-[660px]" role="application" aria-label="Map of donors across Ghana" />

          <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-col gap-2">
            <button
              type="button"
              onClick={fitAll}
              className="pointer-events-auto rounded-full bg-white px-3.5 py-2 text-caption font-bold text-ink shadow-raised transition-colors hover:bg-surface"
            >
              Show all
            </button>
          </div>

          <div className="pointer-events-none absolute bottom-6 left-3 z-[500] rounded-xl bg-white/95 px-3 py-2 text-caption text-ink-mid shadow-raised">
            {mode === "readiness" && (
              <ul className="space-y-1">
                <Dot color={GREEN} label="Most donors can donate now" />
                <Dot color={AMBER} label="Some can" />
                <Dot color={GREY} label="Few can" />
                <Dot color={RED} label="Nobody can right now" />
              </ul>
            )}
            {mode === "donors" && <p>Bigger circle, more donors</p>}
            {mode === "blood" && (
              <ul className="space-y-1">
                <Dot color={GREEN} label={`${blood} can donate`} />
                <Dot color={AMBER} label={`${blood} here, all resting`} />
                <Dot color={GREY} label={`No ${blood} here`} />
              </ul>
            )}
          </div>
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-4">
          <div className="relative rounded-2xl border-[0.5px] border-hairline bg-white p-3 shadow-raised">
            <Search className="pointer-events-none absolute left-6 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a town"
              aria-label="Find a town"
              className="w-full rounded-xl border border-hairline bg-white py-2.5 pl-10 pr-3 text-body-sm text-ink placeholder:text-ink-faint focus:border-red focus:outline-none"
            />
            {matches.length > 0 && (
              <ul className="mt-2 space-y-0.5">
                {matches.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        select({ kind: "place", id: p.id });
                        setQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-body-sm hover:bg-surface"
                    >
                      <span className="font-semibold text-ink">{p.name}</span>
                      <span className="text-caption text-ink-muted">{p.donors} donors</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border-[0.5px] border-hairline bg-white p-4 shadow-raised">
            {selectedPlace ? (
              <PlacePanel
                place={selectedPlace}
                hospitals={placeHospitals}
                radius={radius}
                onClose={() => setSelection(null)}
                onPickHospital={(id) => select({ kind: "hospital", id })}
              />
            ) : selectedHospital ? (
              <HospitalPanel
                hospital={selectedHospital}
                reach={hospitalReach}
                radius={radius}
                onClose={() => setSelection(null)}
                onPickPlace={(id) => select({ kind: "place", id })}
              />
            ) : (
              <div>
                <p className="text-body-sm font-bold text-ink">Click a town or hospital</p>
                <p className="mt-1 text-caption text-ink-muted">Towns show donors by blood type. Hospitals show who they could reach.</p>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-caption">
                  <Stat label="Donors placed" value={totals.donors} />
                  <Stat label="Can donate now" value={totals.eligible} />
                  <Stat label="Towns" value={data.places.length} />
                  <Stat label="Hospitals" value={placedHospitals.length} />
                </dl>

                {totals.gaps.length > 0 && totals.donors > 0 && (
                  <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-light px-3 py-2.5 text-caption text-ink">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red" />
                    <span>
                      <span className="font-bold">Nobody can donate</span> {totals.gaps.join(", ")} anywhere on the map right now.
                    </span>
                  </p>
                )}

                {data.places.length > 0 && (
                  <>
                    <p className="mt-5 text-caption font-bold uppercase tracking-wide text-ink-muted">Biggest towns</p>
                    <ul className="mt-1.5 space-y-0.5">
                      {data.places.slice(0, 6).map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => select({ kind: "place", id: p.id })}
                            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-body-sm hover:bg-surface"
                          >
                            <span className="flex items-center gap-2 font-semibold text-ink">
                              <MapPin className="size-3.5 text-ink-faint" /> {p.name}
                            </span>
                            <span className="text-caption tabular-nums text-ink-muted">{p.donors}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          {(data.unplaced > 0 || unplacedHospitals > 0 || data.truncated) && (
            <div className="space-y-1.5 rounded-2xl border border-dashed border-hairline bg-white/60 px-4 py-3 text-caption text-ink-muted">
              {data.unplaced > 0 && (
                <p>
                  <span className="font-bold text-ink">{data.unplaced}</span> donor{data.unplaced === 1 ? "" : "s"} could not be placed: no city, or a town the map does not know.{" "}
                  <Link href="/admin/users" className="font-semibold text-red hover:underline">
                    See users
                  </Link>
                </p>
              )}
              {unplacedHospitals > 0 && <p>{unplacedHospitals} approved hospital{unplacedHospitals === 1 ? "" : "s"} could not be placed from the city given.</p>}
              {data.truncated && <p>Showing the latest {data.total.toLocaleString()} donors.</p>}
            </div>
          )}

          <p className="px-1 text-caption text-ink-faint">
            Positions are town centres, accurate to a few kilometres. Individual locations are never shown. Reach is measured from the town centre, not the hospital&apos;s street address.
          </p>
        </aside>
      </div>
    </div>
  );
}

// ---- Panels --------------------------------------------------------------------

function PlacePanel({
  place,
  hospitals,
  radius,
  onClose,
  onPickHospital,
}: {
  place: MapPlace;
  hospitals: { h: MapHospital; km: number }[];
  radius: number;
  onClose: () => void;
  onPickHospital: (id: string) => void;
}) {
  const types = ALL_TYPES.map((t) => ({ t, v: place.blood[t] ?? { total: 0, eligible: 0 } }));
  const max = Math.max(1, ...types.map((x) => x.v.total));
  const missing = types.filter((x) => x.v.eligible === 0).map((x) => x.t);

  return (
    <div>
      <PanelHead kicker="Town" title={place.name} onClose={onClose} />
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-caption">
        <Stat label="Donors" value={place.donors} compact />
        <Stat label="Can donate" value={place.eligible} compact />
        <Stat label="Alerts on" value={place.alerts} compact />
      </dl>

      <p className="mt-4 text-caption font-bold uppercase tracking-wide text-ink-muted">Blood types</p>
      <ul className="mt-2 space-y-1.5">
        {types.map(({ t, v }) => (
          <li key={t} className="flex items-center gap-2 text-caption">
            <span className="w-8 shrink-0 font-bold text-ink">{t}</span>
            <span className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface">
              <span className="absolute inset-y-0 left-0 rounded-full bg-hairline" style={{ width: `${(v.total / max) * 100}%` }} />
              <span className="absolute inset-y-0 left-0 rounded-full bg-[#16A34A]" style={{ width: `${(v.eligible / max) * 100}%` }} />
            </span>
            <span className="w-12 shrink-0 text-right tabular-nums text-ink-muted">
              {v.eligible}/{v.total}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[11px] text-ink-faint">Green: can donate now. Grey: all donors of that type.</p>

      {missing.length > 0 && place.donors > 0 && (
        <p className="mt-3 rounded-xl bg-red-light px-3 py-2 text-caption text-ink">
          <span className="font-bold">No one ready for</span> {missing.join(", ")} here.
        </p>
      )}

      {hospitals.length > 0 && (
        <>
          <p className="mt-4 text-caption font-bold uppercase tracking-wide text-ink-muted">Hospitals within {radius} km</p>
          <ul className="mt-1.5 space-y-0.5">
            {hospitals.map(({ h, km }) => (
              <li key={h.id}>
                <button type="button" onClick={() => onPickHospital(h.id)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-body-sm hover:bg-surface">
                  <span className="font-semibold text-ink">{h.name}</span>
                  <span className="text-caption text-ink-muted">{Math.round(km)} km</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {place.people.length > 0 && (
        <>
          <p className="mt-4 text-caption font-bold uppercase tracking-wide text-ink-muted">
            People {place.donors > place.people.length ? `(first ${place.people.length})` : ""}
          </p>
          <ul className="mt-1.5 max-h-56 space-y-0.5 overflow-y-auto pr-1">
            {place.people.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/users/${p.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-body-sm hover:bg-surface">
                  <span className={cn("size-2 shrink-0 rounded-full", p.eligible ? "bg-[#16A34A]" : "bg-ink-faint")} />
                  <span className="min-w-0 flex-1 truncate text-ink">{p.name}</span>
                  {p.blood && <span className="text-caption font-bold text-ink-muted">{p.blood}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function HospitalPanel({
  hospital,
  reach,
  radius,
  onClose,
  onPickPlace,
}: {
  hospital: MapHospital;
  reach: Reach | null;
  radius: number;
  onClose: () => void;
  onPickPlace: (id: string) => void;
}) {
  return (
    <div>
      <PanelHead kicker="Hospital" title={hospital.name} onClose={onClose} />
      <p className="mt-1 text-caption text-ink-muted">{hospital.city}</p>

      {!reach ? (
        <p className="mt-3 text-caption text-ink-muted">This city is not on the map yet, so reach cannot be worked out.</p>
      ) : (
        <>
          <p className="mt-3 text-caption font-semibold text-ink-mid">Within {radius} km</p>
          <dl className="mt-2 grid grid-cols-2 gap-2 text-center text-caption">
            <Stat label="Donors" value={reach.donors} compact />
            <Stat label="Can donate now" value={reach.eligible} compact />
          </dl>

          <p className="mt-4 text-caption font-bold uppercase tracking-wide text-ink-muted">Ready to donate, by type</p>
          <ul className="mt-2 grid grid-cols-4 gap-1.5">
            {ALL_TYPES.map((t) => {
              const n = reach.blood[t] ?? 0;
              return (
                <li key={t} className={cn("rounded-lg px-1 py-2 text-center", n > 0 ? "bg-[#F0FBF3]" : "bg-red-light")}>
                  <p className="text-caption font-extrabold text-ink">{t}</p>
                  <p className={cn("text-body-sm font-bold tabular-nums", n > 0 ? "text-[#166534]" : "text-red")}>{n}</p>
                </li>
              );
            })}
          </ul>

          {reach.missing.length > 0 && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-light px-3 py-2.5 text-caption text-ink">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red" />
              <span>
                <span className="font-bold">Gaps:</span> no one ready for {reach.missing.join(", ")} within {radius} km. Recruit for these.
              </span>
            </p>
          )}

          {reach.places.length > 0 && (
            <>
              <p className="mt-4 text-caption font-bold uppercase tracking-wide text-ink-muted">Towns in reach</p>
              <ul className="mt-1.5 space-y-0.5">
                {reach.places.map(({ place, km }) => (
                  <li key={place.id}>
                    <button type="button" onClick={() => onPickPlace(place.id)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-body-sm hover:bg-surface">
                      <span className="font-semibold text-ink">{place.name}</span>
                      <span className="text-caption text-ink-muted">
                        {place.eligible}/{place.donors} · {Math.round(km)} km
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-3">
            <Badge tone={reach.eligible >= 5 ? "green" : reach.eligible > 0 ? "amber" : "red"}>
              {reach.eligible >= 5 ? "Good reach" : reach.eligible > 0 ? "Thin reach" : "No one ready in reach"}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
}

function PanelHead({ kicker, title, onClose }: { kicker: string; title: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-caption font-bold uppercase tracking-wide text-ink-muted">{kicker}</p>
        <h2 className="truncate text-title font-extrabold tracking-[-0.3px] text-ink">{title}</h2>
      </div>
      <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1 text-ink-faint hover:bg-surface hover:text-ink">
        <X className="size-4" />
      </button>
    </div>
  );
}

function Stat({ label, value, compact }: { label: string; value: number; compact?: boolean }) {
  return (
    <div className={cn("rounded-xl bg-surface px-3", compact ? "py-2 text-center" : "py-2")}>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-title font-extrabold text-ink">{value}</dd>
    </div>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="size-3 rounded-full" style={{ backgroundColor: color }} /> {label}
    </li>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
