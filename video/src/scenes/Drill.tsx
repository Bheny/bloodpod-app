import React from "react";
import { Scene } from "../Frame";
import { ScreenImg, Tap } from "../ui";

// Real screens from a real drill on a demo Pod: the leader's readiness page, the leader's
// view, a member answering, and the result the app computed (5 of 6 answered, passed).
export const Drill: React.FC = () => (
  <Scene
    step="Step 5"
    title="Run a drill"
    captions={[
      { from: 0, to: 110, text: "Open Pod readiness and tap Run a drill" },
      { from: 110, to: 200, text: "Your Pod gets a practice alert and has 10 minutes to answer" },
      { from: 200, to: 380, text: "Members tap I am here. It is only a drill: nobody needs blood." },
      { from: 380, to: 600, text: "Enough answers in time and your Pod has passed" },
    ]}
  >
    <ScreenImg name="captain" />
    <ScreenImg name="drill-owner-open" from={110} />
    <ScreenImg name="drill-member" from={200} />
    <ScreenImg name="drill-member-done" from={290} />
    <ScreenImg name="drill-result" from={380} />
    <Tap x={195} y={300} at={80} />
    <Tap x={195} y={233} at={265} />
  </Scene>
);
