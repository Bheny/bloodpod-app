import React from "react";
import { Scene } from "../Frame";
import { ScreenImg, Tap } from "../ui";

// Real screens captured from the app (capture/capture-flows.mjs). Continue sits at (195, 793).
export const Onboarding: React.FC = () => (
  <Scene
    step="Step 2"
    title="Set up your profile"
    captions={[
      { from: 0, to: 110, text: "Pick your blood type. Hospitals match on it." },
      { from: 110, to: 220, text: "Say roughly when you last donated" },
      { from: 220, to: 330, text: "Add your city so alerts stay close to you" },
      { from: 330, to: 450, text: "You're in. Next, add people you trust." },
    ]}
  >
    <ScreenImg name="onb-bloodtype" />
    <ScreenImg name="onb-lastdonated" from={110} />
    <ScreenImg name="onb-location-city" from={220} />
    <ScreenImg name="onb-youre-in" from={330} />
    <Tap x={195} y={793} at={95} />
    <Tap x={195} y={793} at={205} />
    <Tap x={195} y={793} at={315} />
    <Tap x={195} y={793} at={425} />
  </Scene>
);
