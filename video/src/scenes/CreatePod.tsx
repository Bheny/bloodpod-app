import React from "react";
import { Scene } from "../Frame";
import { ScreenImg, Tap } from "../ui";

// Real screens: the invite page, then the Pods list once members have joined.
export const CreatePod: React.FC = () => (
  <Scene
    step="Step 4"
    title="Build your Pod"
    captions={[
      { from: 0, to: 200, text: "Share your invite link or code. A Pod is 10 to 20 people you trust." },
      { from: 200, to: 390, text: "As people join, your Pod fills up and shows who can donate now" },
    ]}
  >
    <ScreenImg name="pod-invite" />
    <ScreenImg name="pod" from={200} />
    <Tap x={195} y={490} at={130} />
  </Scene>
);
