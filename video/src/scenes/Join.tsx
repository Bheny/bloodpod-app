import React from "react";
import { Scene } from "../Frame";
import { ScreenImg, Tap } from "../ui";

// The real invite page. The Accept button sits at the bottom of the screen.
export const Join: React.FC = () => (
  <Scene
    step="Step 3"
    title="Join a Pod"
    captions={[
      { from: 0, to: 120, text: "A friend sends you their invite link" },
      { from: 120, to: 210, text: "See who invited you and which Pod it is" },
      { from: 210, to: 300, text: "Tap Accept invite. You join in seconds." },
    ]}
  >
    <ScreenImg name="invite-landing" />
    <Tap x={195} y={794} at={240} />
  </Scene>
);
