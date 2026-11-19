"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";
import { Crosshair, Maximize2, Minus, Plus, Search, Shuffle, X } from "lucide-react";
import type { GraphData, GraphLink, GraphNode } from "@/lib/admin/graph-types";
import { Badge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type SimNode = GraphNode & SimulationNodeDatum & { r: number };
type SimLink = { source: SimNode; target: SimNode; kind: GraphLink["kind"] };
type ColorBy = "blood" | "status";
type StatusFilter = "all" | "eligible" | "resting" | "isolated" | "alertsOff";

const BLOOD_COLORS: Record<string, string> = {
  "O−": "#B91C1C",
  "O+": "#EF4444",
  "A−": "#EA580C",
  "A+": "#F59E0B",
  "B−": "#0D9488",
  "B+": "#16A34A",
  "AB−": "#7C3AED",
  "AB+": "#2563EB",
};
const NO_BLOOD = "#A1A1AA";
const INK = "#1C1C1E";
const HOSPITAL = "#1D4ED8";

const STATUS_COLORS = { eligible: "#16A34A", resting: "#F59E0B", pending: "#A1A1AA" };

function userColor(n: SimNode, by: ColorBy) {
  if (by === "blood") return n.blood ? (BLOOD_COLORS[n.blood] ?? NO_BLOOD) : NO_BLOOD;
  if (!n.onboarded) return STATUS_COLORS.pending;
  return n.eligible ? STATUS_COLORS.eligible : STATUS_COLORS.resting;
}

function radius(n: GraphNode) {
  if (n.kind === "pod") return 9 + Math.sqrt(n.size ?? 1) * 3.4;
  if (n.kind === "hospital") return 15;
  return 5.5;
}

export function NetworkGraph({ data }: { data: GraphData }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [colorBy, setColorBy] = useState<ColorBy>("blood");
  const [showInvites, setShowInvites] = useState(true);
  const [showHospitals, setShowHospitals] = useState(false);
  const [showEmptyPods, setShowEmptyPods] = useState(false);
  const [hideNames, setHideNames] = useState(false);
  const [search, setSearch] = useState("");
  const [blood, setBlood] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [width, setWidth] = useState(800);

  // ---- Which nodes and links are on screen -------------------------------------
  const visible = useMemo(() => {
    const emptyPods = new Set(data.nodes.filter((n) => n.kind === "pod" && (n.size ?? 1) <= 1).map((n) => n.id));
    const nodes = data.nodes.filter((n) => {
      if (n.kind === "hospital") return showHospitals;
      if (n.kind === "pod") return showEmptyPods || !emptyPods.has(n.id);
      return true;
    });
    const ids = new Set(nodes.map((n) => n.id));
    const links = data.links.filter((l) => {
      if (l.kind === "invite" && !showInvites) return false;
      if (l.kind === "catchment" && !showHospitals) return false;
      return ids.has(l.source) && ids.has(l.target);
    });
    return { nodes, links };
  }, [data, showInvites, showHospitals, showEmptyPods]);

  // People in a Pod that has someone else in it (independent of the layer toggles).
  const hasCompany = useMemo(() => {
    const big = new Set(data.nodes.filter((n) => n.kind === "pod" && (n.size ?? 1) > 1).map((n) => n.id));
    const set = new Set<string>();
    for (const l of data.links) {
      if ((l.kind === "owner" || l.kind === "member") && big.has(l.target)) set.add(l.source);
    }
    return set;
  }, [data]);

  const adjacency = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const l of visible.links) {
      (map.get(l.source) ?? map.set(l.source, new Set()).get(l.source)!).add(l.target);
      (map.get(l.target) ?? map.set(l.target, new Set()).get(l.target)!).add(l.source);
    }
    return map;
  }, [visible]);

  const nodeById = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data]);

  // ---- Filters: who is "lit up" ------------------------------------------------
  const filterActive = search.trim() !== "" || blood !== "" || status !== "all";

  const lit = useMemo(() => {
    if (!filterActive) return null;
    const q = search.trim().toLowerCase();
    const matchedUsers = new Set<string>();
    for (const n of visible.nodes) {
      if (n.kind !== "user") continue;
      if (q && !n.label.toLowerCase().includes(q) && !(n.city ?? "").toLowerCase().includes(q)) continue;
      if (blood && n.blood !== blood) continue;
      if (status === "eligible" && !(n.onboarded && n.eligible)) continue;
      if (status === "resting" && n.eligible) continue;
      if (status === "isolated" && hasCompany.has(n.id)) continue;
      if (status === "alertsOff" && n.alerts) continue;
      matchedUsers.add(n.id);
    }
    // Pods and hospitals stay lit when they touch a matching person.
    const set = new Set(matchedUsers);
    for (const n of visible.nodes) {
      if (n.kind === "user") continue;
      if (q && n.label.toLowerCase().includes(q)) set.add(n.id);
      else for (const nb of adjacency.get(n.id) ?? []) if (matchedUsers.has(nb)) set.add(n.id);
    }
    return { set, users: matchedUsers };
  }, [filterActive, search, blood, status, visible, adjacency, hasCompany]);

  // ---- Mutable drawing state (read by the render loop without re-creating it) ----
  const sim = useRef<Simulation<SimNode, undefined> | null>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const transform = useRef({ x: 0, y: 0, k: 1 });
  const size = useRef({ w: 800, h: 560, dpr: 1 });
  const dirty = useRef(true);
  const view = useRef({ colorBy, hideNames, selectedId, hoverId: hover?.id ?? null, lit, adjacency });

  useEffect(() => {
    view.current = { colorBy, hideNames, selectedId, hoverId: hover?.id ?? null, lit, adjacency };
    dirty.current = true;
  }, [colorBy, hideNames, selectedId, hover, lit, adjacency]);

  const fit = useCallback(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const n of nodes) {
      const x = n.x ?? 0,
        y = n.y ?? 0;
      minX = Math.min(minX, x - n.r);
      maxX = Math.max(maxX, x + n.r);
      minY = Math.min(minY, y - n.r);
      maxY = Math.max(maxY, y + n.r);
    }
    const { w, h } = size.current;
    const pad = 60;
    const k = Math.min(2.2, Math.max(0.15, Math.min((w - pad * 2) / (maxX - minX || 1), (h - pad * 2) / (maxY - minY || 1))));
    transform.current = { k, x: w / 2 - ((minX + maxX) / 2) * k, y: h / 2 - ((minY + maxY) / 2) * k };
    dirty.current = true;
  }, []);

  // ---- Build / rebuild the simulation when the visible graph changes -------------
  useEffect(() => {
    const previous = new Map(nodesRef.current.map((n) => [n.id, n]));
    const nodes: SimNode[] = visible.nodes.map((n) => {
      const old = previous.get(n.id);
      return {
        ...n,
        r: radius(n),
        x: old?.x ?? (Math.random() - 0.5) * 220,
        y: old?.y ?? (Math.random() - 0.5) * 220,
      };
    });
    const index = new Map(nodes.map((n) => [n.id, n]));
    const links: SimLink[] = visible.links.map((l) => ({
      source: index.get(l.source)!,
      target: index.get(l.target)!,
      kind: l.kind,
    }));

    nodesRef.current = nodes;
    linksRef.current = links;
    sim.current?.stop();

    const simulation = forceSimulation<SimNode>(nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(links)
          .distance((l) => (l.kind === "owner" || l.kind === "member" ? 36 : l.kind === "invite" ? 70 : 170))
          .strength((l) => (l.kind === "member" ? 0.9 : l.kind === "owner" ? 1 : l.kind === "invite" ? 0.12 : 0.015)),
      )
      .force(
        "charge",
        forceManyBody<SimNode>()
          .strength((n) => (n.kind === "pod" ? -240 : n.kind === "hospital" ? -320 : -34))
          .distanceMax(420),
      )
      .force("collide", forceCollide<SimNode>().radius((n) => n.r + 2.5))
      .force("x", forceX<SimNode>(0).strength(0.045))
      .force("y", forceY<SimNode>(0).strength(0.045))
      .alphaDecay(0.028)
      .on("tick", () => {
        dirty.current = true;
      });

    sim.current = simulation;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      simulation.stop();
      simulation.tick(300);
      fit();
    } else {
      // Frame the picture once it has mostly settled.
      const timer = setTimeout(fit, 700);
      return () => {
        clearTimeout(timer);
        simulation.stop();
      };
    }
    return () => {
      simulation.stop();
    };
  }, [visible, fit]);

  // ---- Canvas sizing -----------------------------------------------------------
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      size.current = { w, h, dpr };
      setWidth(w);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      dirty.current = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // ---- Render loop -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!dirty.current) return;
      dirty.current = false;

      const { w, h, dpr } = size.current;
      const { x, y, k } = transform.current;
      const v = view.current;
      const nodes = nodesRef.current;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.translate(x, y);
      ctx.scale(k, k);

      // Who is in focus: a selection (and its neighbours), a hover, or a filter.
      const focusId = v.selectedId ?? v.hoverId;
      const focus = focusId ? new Set([focusId, ...(v.adjacency.get(focusId) ?? [])]) : null;
      const alphaFor = (id: string) => {
        if (focus && !focus.has(id)) return 0.1;
        if (v.lit && !v.lit.set.has(id)) return 0.1;
        return 1;
      };

      // Links first, grouped by kind so each style is set once.
      const links = linksRef.current;
      for (const kind of ["catchment", "member", "owner", "invite"] as const) {
        ctx.beginPath();
        for (const l of links) {
          if (l.kind !== kind) continue;
          const dim = Math.min(alphaFor(l.source.id), alphaFor(l.target.id));
          if (dim < 1) continue;
          ctx.moveTo(l.source.x ?? 0, l.source.y ?? 0);
          ctx.lineTo(l.target.x ?? 0, l.target.y ?? 0);
        }
        ctx.lineWidth = (kind === "owner" ? 2 : kind === "invite" ? 1.8 : 1.2) / Math.max(0.6, k);
        ctx.strokeStyle =
          kind === "catchment" ? "rgba(29,78,216,0.28)" : kind === "invite" ? "rgba(221,0,0,0.75)" : kind === "owner" ? "rgba(28,28,30,0.55)" : "rgba(160,160,170,0.7)";
        ctx.setLineDash(kind === "catchment" ? [4 / k, 4 / k] : []);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Dimmed links, drawn faintly so the shape of the network stays readable.
      if (focus || v.lit) {
        ctx.beginPath();
        for (const l of links) {
          if (Math.min(alphaFor(l.source.id), alphaFor(l.target.id)) >= 1) continue;
          ctx.moveTo(l.source.x ?? 0, l.source.y ?? 0);
          ctx.lineTo(l.target.x ?? 0, l.target.y ?? 0);
        }
        ctx.lineWidth = 1 / Math.max(0.6, k);
        ctx.strokeStyle = "rgba(160,160,170,0.12)";
        ctx.stroke();
      }

      // Arrowheads on invite links: inviter to the person they brought in.
      if (k > 0.5) {
        ctx.fillStyle = "rgba(221,0,0,0.85)";
        for (const l of links) {
          if (l.kind !== "invite" || Math.min(alphaFor(l.source.id), alphaFor(l.target.id)) < 1) continue;
          const sx = l.source.x ?? 0,
            sy = l.source.y ?? 0,
            tx = l.target.x ?? 0,
            ty = l.target.y ?? 0;
          const a = Math.atan2(ty - sy, tx - sx);
          const px = tx - Math.cos(a) * (l.target.r + 2);
          const py = ty - Math.sin(a) * (l.target.r + 2);
          const s = 5 / Math.max(0.7, k);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px - Math.cos(a - 0.45) * s * 1.6, py - Math.sin(a - 0.45) * s * 1.6);
          ctx.lineTo(px - Math.cos(a + 0.45) * s * 1.6, py - Math.sin(a + 0.45) * s * 1.6);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Nodes: hospitals, then Pods, then people on top.
      const order = { hospital: 0, pod: 1, user: 2 } as const;
      const sorted = [...nodes].sort((a, b) => order[a.kind] - order[b.kind]);

      for (const n of sorted) {
        const nx = n.x ?? 0,
          ny = n.y ?? 0;
        ctx.globalAlpha = alphaFor(n.id);

        if (n.kind === "hospital") {
          ctx.fillStyle = HOSPITAL;
          ctx.beginPath();
          ctx.roundRect(nx - n.r, ny - n.r, n.r * 2, n.r * 2, 5);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "700 13px Inter, system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("H", nx, ny + 0.5);
        } else if (n.kind === "pod") {
          ctx.fillStyle = INK;
          ctx.beginPath();
          ctx.arc(nx, ny, n.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = `700 ${Math.max(9, n.r * 0.7)}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(n.size ?? ""), nx, ny + 0.5);
        } else {
          ctx.fillStyle = userColor(n, v.colorBy);
          ctx.beginPath();
          ctx.arc(nx, ny, n.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 1.2 / k;
          ctx.strokeStyle = "#fff";
          ctx.stroke();
        }

        if (n.id === v.selectedId || n.id === v.hoverId) {
          ctx.globalAlpha = 1;
          ctx.lineWidth = 2.5 / k;
          ctx.strokeStyle = "#DD0000";
          ctx.beginPath();
          ctx.arc(nx, ny, n.r + 3 / k, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Labels: Pods and hospitals always, people once zoomed in or when in focus.
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const fontSize = 11 / Math.max(0.8, Math.min(k, 1.6));
      ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      for (const n of sorted) {
        const a = alphaFor(n.id);
        if (a < 1) continue;
        const inFocus = n.id === v.selectedId || n.id === v.hoverId || (focus?.has(n.id) ?? false) || (v.lit?.users.has(n.id) ?? false);
        const show = n.kind !== "user" ? k > 0.45 : k > 1.5 || inFocus;
        if (!show) continue;
        const text = v.hideNames ? (n.kind === "user" ? (n.blood ?? "Donor") : n.kind === "pod" ? "Pod" : "Hospital") : n.label;
        ctx.fillStyle = "#1C1C1E";
        ctx.fillText(text.length > 24 ? `${text.slice(0, 23)}…` : text, n.x ?? 0, (n.y ?? 0) + n.r + 3);
      }
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ---- Pointer interaction -----------------------------------------------------
  const toWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const { x, y, k } = transform.current;
    return { x: (clientX - rect.left - x) / k, y: (clientY - rect.top - y) / k, sx: clientX - rect.left, sy: clientY - rect.top };
  };

  const findNode = (wx: number, wy: number): SimNode | null => {
    const k = transform.current.k;
    const found = sim.current?.find(wx, wy, 14 / k + 8) ?? undefined;
    return found && Math.hypot((found.x ?? 0) - wx, (found.y ?? 0) - wy) <= found.r + 5 / k ? found : null;
  };

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    mode: "none" | "pan" | "node" | "pinch";
    node?: SimNode;
    startX: number;
    startY: number;
    moved: boolean;
    pinchDist?: number;
  }>({ mode: "none", startX: 0, startY: 0, moved: false });

  const zoomAt = useCallback((sx: number, sy: number, factor: number) => {
    const t = transform.current;
    const k = Math.min(6, Math.max(0.12, t.k * factor));
    const real = k / t.k;
    transform.current = { k, x: sx - (sx - t.x) * real, y: sy - (sy - t.y) * real };
    dirty.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0015));
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setHover(null);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      g.mode = "pinch";
      g.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      return;
    }

    const w = toWorld(e.clientX, e.clientY);
    const hit = findNode(w.x, w.y);
    g.startX = e.clientX;
    g.startY = e.clientY;
    g.moved = false;
    if (hit) {
      g.mode = "node";
      g.node = hit;
      hit.fx = hit.x;
      hit.fy = hit.y;
      sim.current?.alphaTarget(0.25).restart();
    } else {
      g.mode = "pan";
      g.node = undefined;
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gesture.current;
    const prev = pointers.current.get(e.pointerId);
    if (prev) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (g.mode === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = canvasRef.current!.getBoundingClientRect();
      if (g.pinchDist) zoomAt((a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top, dist / g.pinchDist);
      g.pinchDist = dist;
      return;
    }

    if (g.mode === "node" && g.node) {
      if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 4) g.moved = true;
      const w = toWorld(e.clientX, e.clientY);
      g.node.fx = w.x;
      g.node.fy = w.y;
      return;
    }

    if (g.mode === "pan" && prev) {
      if (Math.hypot(e.clientX - g.startX, e.clientY - g.startY) > 4) g.moved = true;
      transform.current.x += e.clientX - prev.x;
      transform.current.y += e.clientY - prev.y;
      dirty.current = true;
      return;
    }

    // Plain hover
    if (e.pointerType === "mouse") {
      const w = toWorld(e.clientX, e.clientY);
      const hit = findNode(w.x, w.y);
      setHover((cur) => (hit ? (cur?.id === hit.id ? { ...cur, x: w.sx, y: w.sy } : { id: hit.id, x: w.sx, y: w.sy }) : cur ? null : cur));
      canvasRef.current!.style.cursor = hit ? "pointer" : "grab";
    }
  };

  const endGesture = (e: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    const g = gesture.current;

    if (g.mode === "node" && g.node) {
      const node = g.node;
      node.fx = null;
      node.fy = null;
      sim.current?.alphaTarget(0);
      if (!g.moved) setSelectedId((cur) => (cur === node.id ? null : node.id));
    } else if (g.mode === "pan" && !g.moved) {
      setSelectedId(null);
    }

    if (pointers.current.size === 0) g.mode = "none";
    else if (pointers.current.size === 1) g.mode = "pan";
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const w = toWorld(e.clientX, e.clientY);
    const hit = findNode(w.x, w.y);
    if (hit?.href) router.push(hit.href);
  };

  // ---- Details panel -----------------------------------------------------------
  const selected = selectedId ? (nodeById.get(selectedId) ?? null) : null;
  const hoverNode = hover ? (nodeById.get(hover.id) ?? null) : null;

  const connections = useMemo(() => {
    if (!selected) return null;
    const ids = [...(adjacency.get(selected.id) ?? [])];
    const nodes = ids.map((id) => nodeById.get(id)).filter((n): n is GraphNode => !!n);
    const invitedBy: GraphNode[] = [];
    const invited: GraphNode[] = [];
    for (const l of visible.links) {
      if (l.kind !== "invite") continue;
      if (l.target === selected.id) {
        const n = nodeById.get(l.source);
        if (n) invitedBy.push(n);
      }
      if (l.source === selected.id) {
        const n = nodeById.get(l.target);
        if (n) invited.push(n);
      }
    }
    return {
      pods: nodes.filter((n) => n.kind === "pod"),
      people: nodes.filter((n) => n.kind === "user"),
      hospitals: nodes.filter((n) => n.kind === "hospital"),
      invitedBy,
      invited,
    };
  }, [selected, adjacency, nodeById, visible]);

  const focusOn = (id: string) => {
    setSelectedId(id);
    const n = nodesRef.current.find((x) => x.id === id);
    if (n) {
      const { w, h } = size.current;
      const k = Math.max(transform.current.k, 1.6);
      transform.current = { k, x: w / 2 - (n.x ?? 0) * k, y: h / 2 - (n.y ?? 0) * k };
      dirty.current = true;
    }
  };

  const actions = useRef({ zoomIn: () => {}, zoomOut: () => {}, fit: () => {}, reheat: () => {} });
  useEffect(() => {
    actions.current = {
      zoomIn: () => zoomAt(size.current.w / 2, size.current.h / 2, 1.4),
      zoomOut: () => zoomAt(size.current.w / 2, size.current.h / 2, 1 / 1.4),
      fit,
      reheat: () => {
        for (const n of nodesRef.current) {
          n.x = (Math.random() - 0.5) * 260;
          n.y = (Math.random() - 0.5) * 260;
        }
        sim.current?.alpha(1).restart();
        setTimeout(fit, 900);
      },
    };
  }, [zoomAt, fit]);

  const legend =
    colorBy === "blood"
      ? Object.entries(BLOOD_COLORS).map(([label, color]) => ({ label, color }))
      : [
          { label: "Can donate", color: STATUS_COLORS.eligible },
          { label: "Resting", color: STATUS_COLORS.resting },
          { label: "Not onboarded", color: STATUS_COLORS.pending },
        ];

  const matches = lit ? lit.users.size : null;

  if (data.nodes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-hairline bg-card px-6 py-16 text-center">
        <p className="text-body-sm font-bold text-ink">No network yet</p>
        <p className="mx-auto mt-1 max-w-sm text-caption text-ink-muted">
          People and Pods appear here as donors sign up and invite each other.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a person, Pod or city"
            aria-label="Search the network"
            className="w-full rounded-xl border border-hairline bg-card py-2.5 pl-10 pr-9 text-body-sm text-ink placeholder:text-ink-faint focus:border-red focus:outline-none focus:ring-3 focus:ring-red/8"
          />
          {search && (
            <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink">
              <X className="size-4" />
            </button>
          )}
        </div>
        <select
          value={blood}
          onChange={(e) => setBlood(e.target.value)}
          aria-label="Blood type"
          className="rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-body-sm text-ink focus:border-red focus:outline-none"
        >
          <option value="">All blood types</option>
          {Object.keys(BLOOD_COLORS).map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Status"
          className="rounded-xl border border-hairline bg-card px-3.5 py-2.5 text-body-sm text-ink focus:border-red focus:outline-none"
        >
          <option value="all">Everyone</option>
          <option value="eligible">Can donate now</option>
          <option value="resting">Resting</option>
          <option value="isolated">Not in a Pod with anyone</option>
          <option value="alertsOff">Alerts off</option>
        </select>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-caption">
        <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-raised" role="group" aria-label="Colour people by">
          {(["blood", "status"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorBy(c)}
              className={cn("rounded-full px-3 py-1.5 font-bold transition-colors", colorBy === c ? "bg-panel text-white" : "text-ink-mid hover:text-ink")}
            >
              {c === "blood" ? "Blood type" : "Readiness"}
            </button>
          ))}
        </div>

        {(
          [
            ["Invite chains", showInvites, setShowInvites],
            ["Hospital reach", showHospitals, setShowHospitals],
            ["Empty Pods", showEmptyPods, setShowEmptyPods],
            ["Hide names", hideNames, setHideNames],
          ] as const
        ).map(([label, on, set]) => (
          <label key={label} className="flex cursor-pointer items-center gap-2 font-semibold text-ink-mid">
            <input type="checkbox" checked={on} onChange={(e) => set(e.target.checked)} className="size-4 accent-[#dd0000]" />
            {label}
          </label>
        ))}

        {matches !== null && (
          <span className="font-semibold text-ink">
            {matches} {matches === 1 ? "person matches" : "people match"}
          </span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* The graph */}
        <div className="relative overflow-hidden rounded-2xl border-[0.5px] border-hairline bg-card shadow-raised">
          <div ref={wrapRef} className="h-[62vh] min-h-[440px] w-full lg:h-[640px]">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`Network graph: ${data.stats.people} people in ${data.stats.pods} Pods. Use the search and filters, or the Users page, for a text view.`}
              className="block touch-none cursor-grab"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endGesture}
              onPointerCancel={endGesture}
              onPointerLeave={() => setHover(null)}
              onDoubleClick={onDoubleClick}
            />
          </div>

          {hover && hoverNode && (
            <div
              className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 -translate-y-full rounded-lg bg-panel px-3 py-2 text-caption text-white shadow-raised"
              style={{ left: Math.min(Math.max(hover.x, 90), width - 90), top: Math.max(hover.y - 14, 8) }}
            >
              <p className="font-bold">{hideNames ? (hoverNode.kind === "user" ? (hoverNode.blood ?? "Donor") : hoverNode.kind === "pod" ? "Pod" : "Hospital") : hoverNode.label}</p>
              <p className="text-white/70">
                {hoverNode.kind === "user"
                  ? [hoverNode.blood, hideNames ? null : hoverNode.city].filter(Boolean).join(" · ") || "No details yet"
                  : hoverNode.kind === "pod"
                    ? `${hoverNode.size} ${hoverNode.size === 1 ? "person" : "people"}`
                    : hoverNode.city}
              </p>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute right-3 top-3 flex flex-col gap-1.5">
            {(
              [
                [Plus, "Zoom in", "zoomIn"],
                [Minus, "Zoom out", "zoomOut"],
                [Maximize2, "Fit everything", "fit"],
                [Shuffle, "Re-run layout", "reheat"],
              ] as const
            ).map(([Icon, label, action]) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                title={label}
                onClick={() => actions.current[action]()}
                className="flex size-9 items-center justify-center rounded-lg bg-card text-ink-mid shadow-raised transition-colors hover:text-ink"
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>

          <p className="pointer-events-none absolute bottom-3 left-4 hidden text-caption text-ink-muted sm:block">
            Drag to move · scroll to zoom · click to follow connections · double-click to open
          </p>
          {data.truncated && (
            <p className="absolute bottom-3 right-4 rounded-full bg-warn-soft px-3 py-1 text-caption font-semibold text-warn-strong">
              Showing the latest {data.stats.people.toLocaleString()} people
            </p>
          )}
        </div>

        {/* Side panel */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border-[0.5px] border-hairline bg-card p-4 shadow-raised">
            <p className="text-caption font-bold uppercase tracking-wide text-ink-muted">Key</p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-caption text-ink-mid">
              {legend.map((l) => (
                <li key={l.label} className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full" style={{ backgroundColor: l.color }} /> {l.label}
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1.5 border-t-[0.5px] border-hairline pt-3 text-caption text-ink-mid">
              <li className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-panel text-[10px] font-bold text-white">4</span> A Pod, sized by its people
              </li>
              <li className="flex items-center gap-2">
                <span className="h-0.5 w-5 bg-red" /> Invited by (arrow points at who joined)
              </li>
              <li className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded bg-[#1D4ED8] text-[10px] font-bold text-white">H</span> A hospital
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border-[0.5px] border-hairline bg-card p-4 shadow-raised">
            {!selected || !connections ? (
              <div>
                <p className="text-body-sm font-bold text-ink">Follow the connections</p>
                <p className="mt-1 text-caption text-ink-muted">
                  Click a person or a Pod. Everything linked to it stays lit and the rest fades back.
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-caption">
                  {(
                    [
                      ["People", data.stats.people, null],
                      ["Pods", data.stats.pods, null],
                      ["Bridges", data.stats.bridges, "In 2+ Pods"],
                      ["Alone", data.stats.isolated, "No Pod with others"],
                      ["Invites", data.stats.invites, "tracked"],
                      ["Hospitals", data.stats.hospitals, null],
                    ] as const
                  ).map(([label, value, hint]) => (
                    <div key={label} className="rounded-xl bg-surface px-3 py-2">
                      <dt className="text-ink-muted">{label}</dt>
                      <dd className="text-title font-extrabold text-ink">{value}</dd>
                      {hint && <p className="text-[11px] text-ink-faint">{hint}</p>}
                    </div>
                  ))}
                </dl>
                {data.stats.isolated > 0 && (
                  <button type="button" onClick={() => setStatus("isolated")} className="mt-3 text-caption font-bold text-red-fg hover:underline">
                    Show people who are alone
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-caption font-bold uppercase tracking-wide text-ink-muted">
                      {selected.kind === "user" ? "Person" : selected.kind === "pod" ? "Pod" : "Hospital"}
                    </p>
                    <h2 className="truncate text-title font-extrabold tracking-[-0.3px] text-ink">
                      {hideNames ? (selected.kind === "user" ? (selected.blood ?? "Donor") : selected.kind === "pod" ? "Pod" : "Hospital") : selected.label}
                    </h2>
                  </div>
                  <button type="button" aria-label="Clear selection" onClick={() => setSelectedId(null)} className="rounded-full p-1 text-ink-faint hover:bg-surface hover:text-ink">
                    <X className="size-4" />
                  </button>
                </div>

                {selected.kind === "user" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.blood && <Badge tone="red">{selected.blood}</Badge>}
                    {!selected.onboarded ? <Badge tone="amber">Onboarding</Badge> : selected.eligible ? <Badge tone="green">Can donate</Badge> : <Badge>Resting</Badge>}
                    <Badge tone={selected.alerts ? "green" : "gray"}>{selected.alerts ? "Alerts on" : "Alerts off"}</Badge>
                    {selected.city && !hideNames && <Badge>{selected.city}</Badge>}
                  </div>
                )}
                {selected.kind === "pod" && <p className="mt-2 text-body-sm text-ink-mid">{selected.size} {selected.size === 1 ? "person" : "people"}</p>}
                {selected.kind === "hospital" && <p className="mt-2 text-body-sm text-ink-mid">{selected.city}</p>}

                <div className="mt-4 max-h-[320px] space-y-4 overflow-y-auto pr-1">
                  {connections.invitedBy.length > 0 && (
                    <Group title="Brought in by" nodes={connections.invitedBy} hideNames={hideNames} onPick={focusOn} />
                  )}
                  {connections.invited.length > 0 && <Group title="Brought in" nodes={connections.invited} hideNames={hideNames} onPick={focusOn} />}
                  {connections.pods.length > 0 && <Group title="Pods" nodes={connections.pods} hideNames={hideNames} onPick={focusOn} />}
                  {selected.kind === "pod" && connections.people.length > 0 && (
                    <Group title="People" nodes={connections.people} hideNames={hideNames} onPick={focusOn} />
                  )}
                  {selected.kind === "hospital" && (
                    <p className="text-caption text-ink-muted">{connections.people.length} donors in {selected.city}.</p>
                  )}
                  {selected.kind === "user" && connections.pods.length > 1 && (
                    <p className="rounded-lg bg-surface px-3 py-2 text-caption text-ink-mid">
                      <Crosshair className="mr-1 inline size-3.5" /> A bridge: connects {connections.pods.length} Pods.
                    </p>
                  )}
                </div>

                {selected.href && selected.kind === "user" && (
                  <Link href={selected.href} className="mt-4 block rounded-full bg-panel py-2.5 text-center text-body-sm font-bold text-white">
                    Open profile
                  </Link>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Group({
  title,
  nodes,
  hideNames,
  onPick,
}: {
  title: string;
  nodes: GraphNode[];
  hideNames: boolean;
  onPick: (id: string) => void;
}) {
  return (
    <div>
      <p className="text-caption font-bold uppercase tracking-wide text-ink-muted">
        {title} <span className="text-ink-faint">{nodes.length}</span>
      </p>
      <ul className="mt-1.5 space-y-0.5">
        {nodes.slice(0, 40).map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onPick(n.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-body-sm text-ink transition-colors hover:bg-surface"
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: n.kind === "pod" ? INK : n.kind === "hospital" ? HOSPITAL : (n.blood && BLOOD_COLORS[n.blood]) || NO_BLOOD }} />
              <span className="min-w-0 flex-1 truncate">{hideNames ? (n.kind === "user" ? (n.blood ?? "Donor") : n.kind === "pod" ? "Pod" : "Hospital") : n.label}</span>
              {n.kind === "user" && n.blood && <span className="text-caption text-ink-muted">{n.blood}</span>}
            </button>
          </li>
        ))}
        {nodes.length > 40 && <li className="px-2 py-1 text-caption text-ink-muted">and {nodes.length - 40} more</li>}
      </ul>
    </div>
  );
}
