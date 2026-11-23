import React from "react";
import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Check } from "lucide-react";
import { C, FONT, useTyped } from "./theme";

// All of these are authored at phone size (390 x 844) and scaled up by <Phone>.

export const LogoMark: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <ellipse cx="12" cy="16" rx="10" ry="11" fill={C.ink} />
    <ellipse cx="20" cy="16" rx="10" ry="11" fill={C.red} />
    <ellipse cx="16" cy="16" rx="4.5" ry="5.5" fill="#fff" />
  </svg>
);

export const Wordmark: React.FC<{ size?: number; color?: string }> = ({ size = 56, color = C.ink }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.3, fontFamily: FONT }}>
    <LogoMark size={size * 1.1} />
    <span style={{ fontSize: size, fontWeight: 800, letterSpacing: -size * 0.03, color }}>BloodPod</span>
  </span>
);

export const Screen: React.FC<{ children: React.ReactNode; bg?: string; pad?: number }> = ({
  children,
  bg = C.card,
  pad = 24,
}) => (
  <div style={{ position: "absolute", inset: 0, background: bg, padding: `56px ${pad}px 24px`, fontFamily: FONT, color: C.ink }}>
    {children}
  </div>
);

export const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: C.red }}>{children}</div>
);

export const H1: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 24 }) => (
  <div style={{ marginTop: 10, fontSize: size, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.15 }}>{children}</div>
);

export const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.5, color: C.inkMuted }}>{children}</div>
);

export const Pill: React.FC<{
  children: React.ReactNode;
  variant?: "red" | "ghost" | "ink";
  pressed?: boolean;
  style?: React.CSSProperties;
}> = ({ children, variant = "red", pressed, style }) => {
  const bg = variant === "red" ? C.red : variant === "ink" ? C.ink : C.surface;
  const fg = variant === "ghost" ? C.ink : "#fff";
  return (
    <div
      style={{
        height: 52,
        borderRadius: 999,
        background: bg,
        color: fg,
        fontSize: 15,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transform: pressed ? "scale(0.97)" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** A text field that types its value starting at `typeAt`. */
export const Field: React.FC<{
  label: string;
  value: string;
  placeholder: string;
  typeAt: number;
  mask?: boolean;
  focusFor?: number;
}> = ({ label, value, placeholder, typeAt, mask, focusFor = 50 }) => {
  const frame = useCurrentFrame();
  const typed = useTyped(value, typeAt);
  const shown = mask ? "•".repeat(typed.length) : typed;
  const active = frame >= typeAt - 4 && frame < typeAt + focusFor;
  const caret = active && Math.floor(frame / 8) % 2 === 0;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.inkMid, marginBottom: 6 }}>{label}</div>
      <div
        style={{
          height: 48,
          borderRadius: 14,
          border: `1.5px solid ${active ? C.red : C.hairline}`,
          background: "#fff",
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        {typed.length === 0 && !active ? (
          <span style={{ color: C.inkFaint, fontWeight: 500 }}>{placeholder}</span>
        ) : (
          <span>
            {shown}
            <span style={{ opacity: caret ? 1 : 0, color: C.red }}>|</span>
          </span>
        )}
      </div>
    </div>
  );
};

export const Avatar: React.FC<{ initials: string; size?: number; tone?: "red" | "ink" | "soft" }> = ({
  initials,
  size = 40,
  tone = "red",
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      flexShrink: 0,
      background: tone === "red" ? C.red : tone === "ink" ? C.ink : C.redLight,
      color: tone === "soft" ? C.red : "#fff",
      fontSize: size * 0.36,
      fontWeight: 800,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {initials}
  </div>
);

export const Tick: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      background: C.redLight,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Check size={size * 0.6} color={C.red} strokeWidth={3} />
  </div>
);

/** A finger tap: ripple centred at (x, y) in phone coordinates, at frame `at`. */
export const Tap: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || t > 24) return null;
  const ring = interpolate(t, [0, 24], [0.4, 1.6]);
  const fade = interpolate(t, [0, 6, 24], [0, 0.55, 0]);
  const dot = interpolate(t, [0, 5, 14], [1.3, 0.9, 0.9], { extrapolateRight: "clamp" });
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 28,
          top: y - 28,
          width: 56,
          height: 56,
          borderRadius: 999,
          border: `3px solid ${C.red}`,
          opacity: fade,
          transform: `scale(${ring})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 11,
          top: y - 11,
          width: 22,
          height: 22,
          borderRadius: 999,
          background: "rgba(28,28,30,0.35)",
          transform: `scale(${dot})`,
          opacity: interpolate(t, [0, 3, 20, 24], [0, 1, 1, 0]),
        }}
      />
    </>
  );
};

/** A real screenshot from `npm run capture`, filling the phone. Fades in from `from`. */
export const ScreenImg: React.FC<{ name: string; from?: number }> = ({ name, from = 0 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <Img
      src={staticFile(`screens/${name}.png`)}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", opacity: o, zIndex: from }}
    />
  );
};

/** Shows `children` from frame `from` on, sliding in. Later panes cover earlier ones. */
export const Pane: React.FC<{ from: number; children: React.ReactNode }> = ({ from, children }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const t = Math.min(1, (frame - from) / 12);
  const e = 1 - Math.pow(1 - t, 3);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: e, transform: `translateX(${(1 - e) * 36}px)`, zIndex: from }}>
      {children}
    </div>
  );
};

/** Bottom-pinned primary action. Its centre is (195, 790) in phone coordinates. */
export const BottomAction: React.FC<{ children: React.ReactNode; variant?: "red" | "ghost" | "ink"; pressedAt?: number }> = ({
  children,
  variant = "red",
  pressedAt,
}) => {
  const frame = useCurrentFrame();
  const pressed = pressedAt !== undefined && frame >= pressedAt && frame < pressedAt + 6;
  return (
    <div style={{ position: "absolute", left: 24, right: 24, bottom: 28 }}>
      <Pill variant={variant} pressed={pressed}>
        {children}
      </Pill>
    </div>
  );
};
export const ACTION_XY = { x: 195, y: 790 } as const;

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: C.card,
      borderRadius: 20,
      border: `1px solid ${C.hairline}`,
      padding: 16,
      ...style,
    }}
  >
    {children}
  </div>
);
