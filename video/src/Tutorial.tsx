import React from "react";
import { Series } from "remotion";
import { Intro } from "./scenes/Intro";
import { SignUp } from "./scenes/SignUp";
import { Onboarding } from "./scenes/Onboarding";
import { Join } from "./scenes/Join";
import { CreatePod } from "./scenes/CreatePod";
import { Drill } from "./scenes/Drill";
import { Outro } from "./scenes/Outro";

export const SCENES = [
  { id: "intro", frames: 120, C: Intro },
  { id: "signup", frames: 330, C: SignUp },
  { id: "onboarding", frames: 450, C: Onboarding },
  { id: "join", frames: 300, C: Join },
  { id: "create", frames: 390, C: CreatePod },
  { id: "drill", frames: 600, C: Drill },
  { id: "outro", frames: 180, C: Outro },
] as const;

export const TOTAL_FRAMES = SCENES.reduce((n, s) => n + s.frames, 0);

export const Tutorial: React.FC = () => (
  <Series>
    {SCENES.map(({ id, frames, C }) => (
      <Series.Sequence key={id} durationInFrames={frames}>
        <C />
      </Series.Sequence>
    ))}
  </Series>
);
