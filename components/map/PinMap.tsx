"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import { cn } from "@/lib/utils";

type Leaflet = typeof LeafletNS;

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  /** Short text shown on the pin itself, e.g. a blood type. */
  label: string;
  /** Hover / tap text. */
  title?: string;
  color?: string;
}

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const GHANA_CENTER: [number, number] = [7.95, -1.05];
const RED = "#DD0000";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A small map for the app: round labelled pins, an optional "you are here" dot, and one
 * selected pin. Tiles come from OpenStreetMap, as on the admin map.
 */
export function PinMap({
  pins,
  me,
  selectedId,
  onSelect,
  className,
}: {
  pins: MapPin[];
  me?: { lat: number; lng: number } | null;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const libRef = useRef<Leaflet | null>(null);
  const layerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  const fittedRef = useRef("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    (async () => {
      const mod = await import("leaflet");
      const L = ("default" in mod ? mod.default : mod) as unknown as Leaflet;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: GHANA_CENTER,
        zoom: 7,
        minZoom: 6,
        maxZoom: 16,
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
      map.on("click", () => onSelectRef.current?.(null));

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

  // Draw pins whenever they or the selection change.
  useEffect(() => {
    const L = libRef.current;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;

    layer.clearLayers();

    if (me) {
      L.marker([me.lat, me.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;border-radius:9999px;background:#2563EB;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
        interactive: false,
        keyboard: false,
      }).addTo(layer);
    }

    for (const pin of pins) {
      const on = pin.id === selectedId;
      const size = on ? 40 : 32;
      const marker = L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${pin.color ?? RED};color:#fff;border:${on ? 3 : 2}px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;font:700 ${on ? 12 : 11}px system-ui,sans-serif">${escapeHtml(pin.label)}</div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
        zIndexOffset: on ? 1000 : 0,
        keyboard: false,
      }).addTo(layer);
      if (pin.title) marker.bindTooltip(escapeHtml(pin.title), { direction: "top", offset: [0, -size / 2] });
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectRef.current?.(pin.id);
      });
    }

    // Frame everything once per result set (not on every selection).
    const signature = pins.map((p) => p.id).join(",") + (me ? "|me" : "");
    if (fittedRef.current !== signature) {
      fittedRef.current = signature;
      const points: [number, number][] = pins.map((p) => [p.lat, p.lng]);
      if (me) points.push([me.lat, me.lng]);
      if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
      else if (points.length === 1) map.setView(points[0], 12);
    }
  }, [ready, pins, me, selectedId]);

  return (
    <div
      ref={containerRef}
      className={cn("isolate z-0 h-80 w-full overflow-hidden rounded-2xl bg-surface lg:h-[28rem]", className)}
      aria-label="Map"
    />
  );
}
