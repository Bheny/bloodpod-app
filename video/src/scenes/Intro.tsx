import React from "react";
import { AbsoluteFill } from "remotion";
import { Appear, C, FONT } from "../theme";
import { Wordmark } from "../ui";

export const Intro: React.FC = () => (
  <AbsoluteFill style={{ background: C.surface, alignItems: "center", justifyContent: "center", fontFamily: FONT, padding: 90 }}>
    <Appear at={4}>
      <Wordmark size={110} />
    </Appear>
    <Appear at={24} style={{ marginTop: 70, textAlign: "center", fontSize: 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1.08, color: C.ink }}>
      Your Pod.
      <br />
      <span style={{ color: C.red }}>Ready when it matters.</span>
    </Appear>
    <Appear at={50} style={{ marginTop: 60, textAlign: "center", fontSize: 40, fontWeight: 600, color: C.inkMid, lineHeight: 1.35 }}>
      A quick guide: sign up, join a Pod,
      <br />
      build your own, and run a drill.
    </Appear>
  </AbsoluteFill>
);
