import React from "react";
import { AbsoluteFill } from "remotion";
import { Appear, C, FONT } from "../theme";
import { Tick, Wordmark } from "../ui";

const PROMISES = [
  "Joining, listing and sending an alert are always free",
  "Your name and number are shared only after you say Yes",
  "You are never alerted within 3 months of donating",
];

export const Outro: React.FC = () => (
  <AbsoluteFill style={{ background: C.surface, alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: 90 }}>
    <Appear at={4} style={{ textAlign: "center", fontSize: 96, fontWeight: 800, letterSpacing: -3.5, color: C.ink }}>
      You&apos;re ready.
    </Appear>
    <div style={{ marginTop: 70, display: "flex", flexDirection: "column", gap: 34, width: "100%" }}>
      {PROMISES.map((p, i) => (
        <Appear key={p} at={26 + i * 18} style={{ display: "flex", gap: 28, alignItems: "center", fontSize: 42, fontWeight: 600, lineHeight: 1.3, color: C.inkMid }}>
          <div style={{ transform: "scale(1.9)", transformOrigin: "left center", width: 40 }}>
            <Tick />
          </div>
          <span style={{ marginLeft: 36 }}>{p}</span>
        </Appear>
      ))}
    </div>
    <Appear at={100} style={{ marginTop: 100 }}>
      <Wordmark size={72} />
    </Appear>
  </AbsoluteFill>
);
