import React from "react";
import { loadFont } from "@remotion/google-fonts/PlusJakartaSans";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const { fontFamily } = loadFont("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });
export const FONT = fontFamily;

// Same tokens as app/globals.css (light theme).
export const C = {
  red: "#DD0000",
  redLight: "#FFF0F0",
  redMid: "#FFBDBD",
  redDark: "#AA0000",
  ink: "#1C1C1E",
  inkMid: "#48484A",
  inkMuted: "#8E8E93",
  inkFaint: "#C7C7CC",
  surface: "#FAF8F6",
  card: "#FFFFFF",
  hairline: "#E5E5EA",
  success: "#166534",
  successSoft: "#F0FBF3",
} as const;

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Fade/slide a thing in from `at` (frames), spring-driven. */
export function useAppear(at = 0) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 200 }, durationInFrames: 18 });
  return { opacity: p, transform: `translateY(${(1 - p) * 24}px)` } as React.CSSProperties;
}

export const Appear: React.FC<{ at?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  at = 0,
  children,
  style,
}) => <div style={{ ...useAppear(at), ...style }}>{children}</div>;

/** Characters of `text` visible at the current frame, typed from `start`. */
export function useTyped(text: string, start: number, charsPerSecond = 16) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.max(0, Math.min(text.length, Math.floor(((frame - start) / fps) * charsPerSecond)));
  return text.slice(0, n);
}

/** 0 to 1 between two frames with easing. */
export function useProgress(from: number, to: number) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

/** True from frame `at` on. */
export function useAfter(at: number) {
  return useCurrentFrame() >= at;
}
