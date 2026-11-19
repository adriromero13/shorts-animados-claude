// Hoja de personajes (una sola imagen 1080x1920) para revisar el diseño antes del 3D.
import React, { useEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { Pen, bodyFront, Outfit, FrontOpts } from "./toon";
import { TESEO, EGEO, MINOS, ARIADNA, DEDALO, BANDIDO, CHICO, joven, minotauro } from "./cast";

const L = -2.1;
type Slot = { name: string; draw: (p: Pen) => void };
const fig = (o: Outfit, opts: FrontOpts = {}) => (p: Pen) => bodyFront(p, o, { mode: "stand", light: L, seed: 3, ...opts });
const SLOTS: Slot[] = [
  { name: "Teseo", draw: fig(TESEO, { expr: "stern", prop: ["sword", 0.2] }) },
  { name: "Egeo", draw: fig(EGEO, { expr: "neutral", seed: 5 }) },
  { name: "Ariadna", draw: fig(ARIADNA, { expr: "smile", seed: 2 }) },
  { name: "Minos", draw: fig(MINOS, { expr: "stern", seed: 6 }) },
  { name: "Dédalo", draw: fig(DEDALO, { expr: "nervous", seed: 4 }) },
  { name: "Bandido", draw: fig(BANDIDO, { expr: "dazed", seed: 1 }) },
  { name: "Jóvenes", draw: (p) => { p.g.save(); p.g.translate(-120, 60); p.g.scale(0.85, 0.85); bodyFront(p, joven(0), { mode: "stand", expr: "nervous", light: L, seed: 2 }); p.g.restore(); p.g.save(); p.g.translate(170, 60); p.g.scale(0.85, 0.85); bodyFront(p, joven(1), { mode: "stand", expr: "shock", light: L, seed: 6 }); p.g.restore(); } },
  { name: "El chico (hoy)", draw: fig(CHICO, { expr: "nervous", seed: 7 }) },
  { name: "Minotauro", draw: (p) => minotauro(p, { light: L, seed: 4 }) },
];
export const Reparto: React.FC<{ extra?: boolean }> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("reparto"));
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#f3ead8"; g.fillRect(0, 0, 1080, 1920);
    SLOTS.forEach((s, i) => {
      const c = i % 3, r = Math.floor(i / 3), x = c * 360, y = 120 + r * 600;
      g.save(); g.translate(x + 15, y); g.scale(0.55, 0.55); s.draw(new Pen(g)); g.restore();
      g.fillStyle = "#241726"; g.font = "bold 40px sans-serif"; g.textAlign = "center"; g.fillText(s.name, x + 180, y + 585);
    });
    g.font = "bold 54px sans-serif"; g.fillText("Teseo y el laberinto — reparto", 540, 80);
    continueRender(h);
  }, [h]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
export const MinoSombra: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [h] = useState(() => delayRender("mino"));
  useEffect(() => {
    const g = ref.current!.getContext("2d")!;
    g.fillStyle = "#1f2a4a"; g.fillRect(0, 0, 1080, 1920);
    [0, 0.5, 1].forEach((s, i) => { g.save(); g.translate(i * 360 + 15, 500); g.scale(0.55, 0.55); minotauro(new Pen(g), { light: L, seed: 4, shadow: s }); g.restore(); });
    continueRender(h);
  }, [h]);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
