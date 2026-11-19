// Reparto de «Teseo y el laberinto»: trajes para bodyFront (toon.ts) y el Minotauro, dibujado aparte
// (cuerpo de bodyFront + cabeza de toro encima). Diseño en el lienzo de 600 x 1000 (suelas en y = 975).
import { Pen, Outfit, FrontOpts, bodyFront, INK, SKINS, mul, shade, mix } from "./toon";

type P2 = [number, number];
const SANDAL = "#8a5a32";

export const TESEO: Outfit = { jacket: "#f1e6c8", pants: SKINS[1], boots: SANDAL, hat: "hair", hair: "#5a3420", cape: "#c0353a", skin: SKINS[1], buttons: "#c98f3e" };
export const EGEO: Outfit = { jacket: "#3b5fa8", pants: SKINS[0], boots: SANDAL, hat: "crown", beard: "#dcd6cb", cape: "#5b2a86", skin: SKINS[0], buttons: "#e8c45a", build: "stout" };
export const MINOS: Outfit = { jacket: "#7a1f3d", pants: SKINS[2], boots: "#3a2a20", hat: "crown", beard: "#1a1410", cape: "#d9a441", skin: SKINS[2], buttons: "#e8c45a", build: "stout" };
export const ARIADNA: Outfit = { jacket: "#2f8f8a", pants: SKINS[0], boots: SANDAL, hat: "hair", hair: "#2a1d16", dress: "#2f8f8a", skin: SKINS[0] };
export const DEDALO: Outfit = { jacket: "#8a6a3a", pants: SKINS[2], boots: SANDAL, hat: "hair", hair: "#e8e4dc", beard: "#e8e4dc", skin: SKINS[2], build: "stout" };
export const BANDIDO: Outfit = { jacket: "#6b5a3a", pants: "#4a3a2a", boots: "#3a2a20", hat: "hair", hair: "#1d140e", beard: "#1d140e", skin: SKINS[3] };
/** el chico de hoy: sudadera, vaqueros, zapatillas */
export const CHICO: Outfit = { jacket: "#4b5fa0", pants: "#2c3550", boots: "#f4f1ea", hat: "hair", hair: "#2a1d16", skin: SKINS[1] };

const JOV_TUNIC = ["#e8dcc0", "#c25a3a", "#d9a441", "#5a8fc2", "#efe3c8", "#7a9a4a", "#c25a7a"];
const JOV_HAIR = ["#2a1d16", "#5a3420", "#1d140e", "#8a5a32", "#2a1d16", "#4a3426", "#1d140e"];
/** los catorce jóvenes: siete chicos y siete chicas */
export const joven = (v: number): Outfit => {
  const girl = v % 2 === 1, c = JOV_TUNIC[v % 7];
  return { jacket: c, pants: SKINS[v % 4], boots: SANDAL, hat: "hair", hair: JOV_HAIR[(v * 3) % 7], skin: SKINS[(v + 1) % 4], ...(girl ? { dress: c } : {}) };
};

// ---------------- el Minotauro ----------------
const BULL = "#6a3f2a", BULL_SH = "#3e2318", HORN = "#efe3c8", SNOUT = "#c99a86";
export type MinoOpts = FrontOpts & { /** 0 = toro de carne y hueso, 1 = hecho de sombra */ shadow?: number; eyes?: number };

/** cabeza de toro sobre la cabeza humana (centro ~300, 309): hocico ancho, cuernos curvos, orejas de lado */
const bullHead = (p: Pen, col: string, dark: string, horn: string, snout: string, eyeGlow: number, light: number) => {
  const u = 2.36, ow = 5 * u, cx = 300, cy = 300;
  // cuernos (detrás de la cabeza)
  for (const s of [-1, 1]) {
    const pts: P2[] = [];
    for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([cx + s * (70 + 150 * t), cy - 30 - 140 * Math.sin(t * 1.9) + 40 * t * t]); }
    for (let i = 14; i >= 0; i--) { const t = i / 14, w = 52 * (1 - t) + 6; pts.push([cx + s * (70 + 150 * t) - s * w * 0.3, cy - 30 - 140 * Math.sin(t * 1.9) + 40 * t * t + w]); }
    p.poly(pts, horn, ow * 0.8);
  }
  // orejas
  for (const s of [-1, 1]) p.ell(cx + s * 128, cy - 6, 44, 20, col, ow * 0.8, 0, 360, s * 0.35);
  // cráneo
  const sk: P2[] = [];
  for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2, r = 1 + 0.08 * Math.cos(2 * a); sk.push([cx + 112 * r * Math.cos(a), cy - 10 + 118 * Math.sin(a) * (Math.sin(a) > 0 ? 1.05 : 0.95)]); }
  p.shadedFill(sk, col, dark, light, 120);
  p.poly(sk, null, ow);
  // hocico
  p.ell(cx, cy + 82, 96, 58, snout, ow);
  p.dot(cx - 36, cy + 82, 13, mix(snout, INK, 0.7));
  p.dot(cx + 36, cy + 82, 13, mix(snout, INK, 0.7));
  p.arc(cx, cy + 118, 30, 10, 20, 160, 2.2 * u, mix(snout, INK, 0.6));
  // anillo de la nariz
  p.arc(cx, cy + 128, 18, 18, 10, 170, 3 * u, "#d9a441");
  // cejas y ojos
  for (const s of [-1, 1]) {
    p.stroke([[cx + s * 30, cy - 34], [cx + s * 76, cy - 52]], 6 * u, INK);
    if (eyeGlow > 0) { p.ell(cx + s * 52, cy - 20, 15, 11, "#ffd23f", 0); p.dot(cx + s * 52, cy - 20, 5, "#fff6c8"); }
    else p.dot(cx + s * 52, cy - 18, 9, INK);
  }
};

export const minotauro = (p: Pen, o: MinoOpts) => {
  const s = Math.max(0, Math.min(1, o.shadow ?? 0)), light = o.light ?? -2.1;
  const SH = "#1b1424";
  const col = mix(BULL, SH, s), dark = mix(BULL_SH, "#0b0810", s), horn = mix(HORN, "#2d2438", s), snout = mix(SNOUT, "#2a2032", s);
  const body: Outfit = { jacket: col, pants: mix(BULL_SH, SH, s), boots: mix("#2a1a12", "#0b0810", s), skin: col, build: "stout", buttons: col };
  bodyFront(p, body, { mode: "stand", expr: "stern", ...o, light });
  bullHead(p, col, dark, horn, snout, o.eyes ?? s, light);
};

export { shade, mul };
