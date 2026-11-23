import React from "react";
import { Composition } from "remotion";
import { Tutorial, TOTAL_FRAMES } from "./Tutorial";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => (
  <Composition id="Tutorial" component={Tutorial} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);
