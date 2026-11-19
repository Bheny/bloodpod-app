"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "system" | "light" | "dark";

const KEY = "bp_theme";
const OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "system", label: "Auto", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

function read(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }
}

/** Auto follows the device. Light and Dark are remembered in this browser. */
export function ThemeSwitch() {
  // Read after mount so the server and first client render agree.
  const [current, setTheme] = useState<Theme>("system");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only read of a saved choice
    setTheme(read());
  }, []);

  return (
    <div
      role="radiogroup"
      aria-label="Appearance"
      className="grid grid-cols-3 gap-1 rounded-full bg-fill p-1"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const on = current === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              setTheme(id);
              apply(id);
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-full py-2 text-caption font-bold transition-colors",
              on ? "bg-card text-ink shadow-raised" : "text-ink-muted hover:text-ink",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
