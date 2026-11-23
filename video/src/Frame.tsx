import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, useAppear } from "./theme";

export const PHONE_W = 390;
export const PHONE_H = 844;
const SCALE = 1.62;

/** Phone shell. Children are drawn at 390 x 844 and scaled up. */
export const Phone: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  // Gentle drift so the shot is never dead still.
  const y = interpolate(frame, [0, durationInFrames], [10, -10]);
  return (
    <div
      style={{
        width: PHONE_W * SCALE + 28,
        height: PHONE_H * SCALE + 28,
        borderRadius: 78,
        background: C.ink,
        padding: 14,
        boxShadow: "0 40px 90px rgba(28,28,30,0.28)",
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: PHONE_W * SCALE,
          height: PHONE_H * SCALE,
          borderRadius: 66,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${SCALE})`, transformOrigin: "top left", position: "relative" }}>
          {children}
          <div
            style={{
              position: "absolute",
              top: 10,
              left: "50%",
              marginLeft: -52,
              width: 104,
              height: 28,
              borderRadius: 999,
              background: C.ink,
              zIndex: 50,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export interface CaptionItem {
  from: number;
  to: number;
  text: string;
}

const CaptionLine: React.FC<CaptionItem> = ({ from, to, text }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [from, from + 8, to - 8, to], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (frame < from || frame > to) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        opacity: o,
        transform: `translateY(${(1 - o) * 12}px)`,
        padding: "0 90px",
        fontSize: 46,
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: -1,
        color: C.ink,
      }}
    >
      {text}
    </div>
  );
};

/** One scene: step chip + heading on top, phone in the middle, captions below. */
export const Scene: React.FC<{
  step: string;
  title: string;
  captions: CaptionItem[];
  children: React.ReactNode;
}> = ({ step, title, captions, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sceneOpacity = interpolate(frame, [0, 10, durationInFrames - 10, durationInFrames], [0, 1, 1, 0]);
  const head = useAppear(2);
  return (
    <AbsoluteFill style={{ background: C.surface, fontFamily: FONT, opacity: sceneOpacity }}>
      <div style={{ ...head, position: "absolute", top: 70, left: 0, right: 0, textAlign: "center" }}>
        <div
          style={{
            display: "inline-block",
            padding: "10px 26px",
            borderRadius: 999,
            background: C.redLight,
            color: C.red,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: "uppercase",
          }}
        >
          {step}
        </div>
        <div style={{ marginTop: 22, fontSize: 76, fontWeight: 800, letterSpacing: -2.5, color: C.ink }}>{title}</div>
      </div>

      <div style={{ position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <Phone>{children}</Phone>
      </div>

      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 200 }}>
        {captions.map((c) => (
          <CaptionLine key={c.text} {...c} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
