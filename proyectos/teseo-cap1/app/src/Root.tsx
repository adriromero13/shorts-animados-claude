import React from "react";
import { Composition } from "remotion";
import { AlexShort } from "./videos/alejandro/Alex";
import { TOTAL, FPS } from "./videos/alejandro/story";
import { Reparto, MinoSombra } from "./videos/teseo/Reparto";
import { TeseoShort } from "./videos/teseo/Teseo";
import { TOTAL as T_TOTAL } from "./videos/teseo/story";
export const Root: React.FC = () => (
  <>
    <Composition id="Alejandro" component={AlexShort} durationInFrames={TOTAL} fps={FPS} width={1080} height={1920} />
    <Composition id="Teseo" component={TeseoShort} durationInFrames={T_TOTAL} fps={30} width={1080} height={1920} />
    <Composition id="Reparto" component={Reparto} durationInFrames={1} fps={30} width={1080} height={1920} />
    <Composition id="MinoSombra" component={MinoSombra} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
