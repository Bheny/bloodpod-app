"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";
import { GLOSSARY, type TermId } from "@/lib/glossary";
import { cn } from "@/lib/utils";

const WIDTH = 280;
const GAP = 8;
const EDGE = 12;

/**
 * A small ⓘ that explains a term. Tap to open, tap anywhere else or press Escape to close, so it works on a
 * phone, where there is no hover. The bubble is drawn on the page itself, not inside the card around the
 * button, so a card that clips its content cannot cut it off.
 */
export function InfoTip({ term, className, label }: { term: TermId; className?: string; label?: string }) {
  const entry = GLOSSARY[term];
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; arrow: number; above: boolean } | null>(null);

  const place = useCallback(() => {
    const b = button.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const width = Math.min(WIDTH, window.innerWidth - EDGE * 2);
    const left = Math.max(EDGE, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - EDGE));
    const height = bubble.current?.offsetHeight ?? 120;
    // Open downwards unless there is no room, then upwards.
    const above = r.bottom + GAP + height > window.innerHeight - EDGE && r.top - GAP - height > EDGE;
    const top = above ? r.top - GAP - height : r.bottom + GAP;
    setPos({ left, top, above, arrow: Math.max(14, Math.min(r.left + r.width / 2 - left, width - 14)) });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!bubble.current?.contains(t) && !button.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={(e) => {
          // The ⓘ often sits inside a link or a card that is itself tappable.
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={label ?? `What does ${entry.title.toLowerCase()} mean?`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className={cn(
          "relative inline-flex size-5 shrink-0 items-center justify-center rounded-full align-middle text-ink-faint transition-colors hover:text-ink-mid focus-visible:text-ink-mid",
          // A bigger tap area than the icon, without making the icon bigger.
          "before:absolute before:-inset-2 before:content-['']",
          open && "text-red-fg",
          className,
        )}
      >
        <Info className="size-4" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={bubble}
            id={id}
            role="tooltip"
            style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, width: Math.min(WIDTH, window.innerWidth - EDGE * 2) }}
            className="fixed z-[70] rounded-2xl border-[0.5px] border-hairline bg-card p-3.5 text-left shadow-floating"
          >
            <p className="text-body-sm font-bold text-ink">{entry.title}</p>
            <p className="mt-1 text-caption leading-relaxed text-ink-mid">{entry.body}</p>
            {pos && (
              <span
                aria-hidden="true"
                style={{ left: pos.arrow - 6 }}
                className={cn(
                  "absolute size-3 rotate-45 border-hairline bg-card",
                  pos.above ? "-bottom-1.5 border-b-[0.5px] border-r-[0.5px]" : "-top-1.5 border-l-[0.5px] border-t-[0.5px]",
                )}
              />
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
