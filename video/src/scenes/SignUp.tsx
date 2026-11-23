import React from "react";
import { Scene } from "../Frame";
import { Tap, ScreenImg } from "../ui";

// Real screens captured from the app (see capture/capture.mjs).
export const SignUp: React.FC = () => (
  <Scene
    step="Step 1"
    title="Create your account"
    captions={[
      { from: 0, to: 120, text: "Add your name, email and mobile number" },
      { from: 120, to: 240, text: "Choose a password of 8 or more characters" },
      { from: 240, to: 330, text: "Tap Create account. Got an invite? Paste the code." },
    ]}
  >
    <ScreenImg name="signup-empty" />
    <ScreenImg name="signup-filled" from={90} />
    <Tap x={195} y={807} at={250} />
  </Scene>
);
