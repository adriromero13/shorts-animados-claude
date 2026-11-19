// Línea de tiempo de «Teseo y el laberinto» (74,6 s = 2238 cuadros a 30 fps), sincronizada con palabras.json.
// Lugares: el laberinto de Creta en el origen (puerta al sur, z = +18,7), Atenas en x = +300, la habitación del chico
// en x = -300. La cámara nunca se queda quieta; cada toma nueva entra con un fundido de 6 cuadros.
import { CURVE, CURVE_LEN, uOfCell, RUN, PATH, cellPos, HALF } from "./maze";

export const FPS = 30;
export const TOTAL = 2238;
export type V3 = [number, number, number];
export type Light = "golden" | "day" | "torch" | "night" | "dawn";
export const AX = 300, RX = -300;

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (6 * u - 15) + 10); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

type Key = { f: number; pos: V3; look: V3; fov: number; glide?: boolean };
type Cam = { pos: V3; look: V3; fov: number };
export type ShotDef = { id: number; a: number; b: number; light: Light; sun: [number, number]; keys?: Key[]; cam?: (f: number) => Cam };

// ---- el camino del laberinto ----
const at = (u: number, y: number): V3 => { const p = CURVE.getPointAt(clamp01(u)); return [p.x, y, p.z]; };
const M = 1 / CURVE_LEN; // un metro en unidades de u
export const U_RUN_A = uOfCell(RUN.a), U_RUN_B = uOfCell(RUN.b), U_HOOK0 = uOfCell(Math.max(0, RUN.a - 6));
/** Teseo con la antorcha: de la celda 24 a la 30 del camino, se para en «Espera» (1217) */
export const TESEO_U0 = uOfCell(Math.min(24, PATH.length - 8)), TESEO_U1 = uOfCell(Math.min(30, PATH.length - 5));
export const FREEZE = 1217;
export const teseoU = (f: number) => lerp(TESEO_U0, TESEO_U1, clamp01((Math.min(f, FREEZE) - 1063) / (FREEZE - 1063)));

// ---- personajes fijos ----
export const DEDALO_AT = cellPos(PATH[RUN.b].cx, PATH[RUN.b].cy);
const DCAM = cellPos(PATH[RUN.b - 2].cx, PATH[RUN.b - 2].cy);
export const GATE_Z = HALF;

export const SHOTS: ShotDef[] = [
  // 1. Gancho: corremos por los pasillos; al final, un pasillo recto y el Minotauro al fondo, lejos
  { id: 1, a: 0, b: 191, light: "golden", sun: [25, 40], cam: (f) => {
    const run = lerp(U_HOOK0, U_RUN_A, smoother(f / 168)), p = at(run, 1.7);
    // dirección suavizada: media de las tangentes de los próximos 4 m (no mirar de frente a los muros en las esquinas)
    let dx = 0, dz = 0;
    for (let k = 0; k <= 8; k++) { const t = CURVE.getTangentAt(clamp01(run + k * 0.5 * M)); dx += t.x; dz += t.z; }
    const n = Math.hypot(dx, dz) || 1;
    const ahead: V3 = [p[0] + (dx / n) * 8, 1.6, p[2] + (dz / n) * 8];
    const end = at(U_RUN_B, 2.2), k = smooth((f - 150) / 22);
    const look = lerp3(ahead, end, k);
    const push = smooth((f - 168) / 23) * 1.2 * M;
    return { pos: at(run + push, 1.7), look, fov: lerp(50, 44, k) };
  } },
  // 2. Atenas: Egeo en su trono; Teseo levanta la roca y saca la espada; los bandidos vencidos en el camino
  { id: 2, a: 191, b: 487, light: "day", sun: [70, 46], keys: [
    { f: 191, pos: [AX, 2.0, 1.4], look: [AX, 1.7, -6], fov: 38 },
    { f: 282, pos: [AX, 2.0, -1.4], look: [AX, 1.75, -6], fov: 38 },
    { f: 306, pos: [AX + 4.4, 1.7, 6.6], look: [AX + 6, 1.8, 2], fov: 40, glide: true },
    { f: 398, pos: [AX + 5.4, 1.7, 5.6], look: [AX + 6, 1.9, 2], fov: 40 },
    { f: 424, pos: [AX + 11, 1.5, 9.6], look: [AX + 13.5, 0.4, 6.2], fov: 42, glide: true },
    { f: 487, pos: [AX + 19, 1.5, 9.6], look: [AX + 21.5, 0.4, 6.2], fov: 42 },
  ] },
  // 3. Creta: el barco de velas negras; los catorce jóvenes ante la puerta; Minos arriba
  { id: 3, a: 487, b: 666, light: "golden", sun: [40, 32], keys: [
    { f: 487, pos: [6, 2.6, 50], look: [-12, 2.6, 62], fov: 40 },
    { f: 530, pos: [5, 2.5, 49], look: [-12, 2.4, 62], fov: 40 },
    { f: 568, pos: [1.6, 1.0, GATE_Z + 12.5], look: [0, 1.3, GATE_Z + 5], fov: 40, glide: true },
    { f: 612, pos: [1.3, 1.1, GATE_Z + 11.6], look: [0, 1.35, GATE_Z + 5], fov: 40 },
    { f: 646, pos: [0.8, 3.4, GATE_Z + 12], look: [-4.0, 2.6, GATE_Z + 1.5], fov: 46, glide: true },
    { f: 666, pos: [0.7, 3.6, GATE_Z + 11.4], look: [-4.0, 2.6, GATE_Z + 1.5], fov: 46 },
  ] },
  // 4. El laberinto entero desde arriba, y abajo en picado hasta Dédalo, perdido
  { id: 4, a: 666, b: 851, light: "golden", sun: [-40, 38], keys: [
    { f: 666, pos: [0, 6, GATE_Z + 15], look: [0, 3, GATE_Z - 4], fov: 46 },
    { f: 716, pos: [0, 58, GATE_Z + 26], look: [0, 0, 0], fov: 50, glide: true },
    { f: 772, pos: [-4, 61, GATE_Z + 22], look: [0, 0, -1], fov: 50 },
    { f: 816, pos: [DCAM.x, 2.4, DCAM.z], look: [DEDALO_AT.x, 1.3, DEDALO_AT.z], fov: 40, glide: true },
    { f: 851, pos: [(DCAM.x * 2 + DEDALO_AT.x) / 3, 2.2, (DCAM.z * 2 + DEDALO_AT.z) / 3], look: [DEDALO_AT.x, 1.3, DEDALO_AT.z], fov: 40 },
  ] },
  // 5. Teseo se ofrece; Ariadna le da el ovillo
  { id: 5, a: 851, b: 1063, light: "golden", sun: [50, 32], keys: [
    { f: 851, pos: [0.9, 1.7, GATE_Z - 0.4], look: [0.8, 1.5, GATE_Z + 6.0], fov: 46 },
    { f: 892, pos: [0.8, 1.7, GATE_Z - 0.1], look: [0.7, 1.5, GATE_Z + 5.0], fov: 46 },
    { f: 928, pos: [0.1, 1.55, GATE_Z - 0.3], look: [0.1, 1.3, GATE_Z + 4.1], fov: 46, glide: true },
    { f: 992, pos: [0.15, 1.45, GATE_Z + 0.5], look: [0.15, 1.15, GATE_Z + 4.2], fov: 42, glide: true },
    { f: 1063, pos: [0.15, 1.42, GATE_Z + 0.8], look: [0.15, 1.15, GATE_Z + 4.2], fov: 42 },
  ] },
  // 6. A oscuras: Teseo camina hacia nosotros con la antorcha, el hilo rojo detrás; en «Espera…» todo se congela
  { id: 6, a: 1063, b: 1287, light: "torch", sun: [180, 22], cam: (f) => {
    const u = teseoU(f), creep = smooth((f - FREEZE) / 70) * 0.9 * M;
    const pos = at(u + 3.4 * M - creep, 1.75), look = at(u - 0.4 * M, 1.45);
    const shake = f > 1168 && f < 1214 ? 0.03 * Math.sin(f * 1.9) * Math.sin(((f - 1168) / 46) * Math.PI) : 0;
    return { pos: [pos[0], pos[1] + shake, pos[2]], look, fov: 46 };
  } },
  // 7. «Fíjate: el laberinto eres tú»: la habitación del chico de noche, objeto por objeto
  { id: 7, a: 1287, b: 1597, light: "night", sun: [150, 28], keys: [
    { f: 1287, pos: [RX, 1.65, 3.6], look: [RX + 0.8, 1.35, 0], fov: 44 },
    { f: 1345, pos: [RX + 0.3, 1.6, 3.2], look: [RX + 0.9, 1.35, 0], fov: 44 },
    { f: 1442, pos: [RX + 2.0, 1.25, -1.2], look: [RX + 3.0, 0.85, -2.3], fov: 38, glide: true },
    { f: 1478, pos: [RX + 2.05, 1.22, -1.3], look: [RX + 3.0, 0.85, -2.3], fov: 38 },
    { f: 1496, pos: [RX + 1.9, 1.25, -1.9], look: [RX + 3.0, 1.0, -3.1], fov: 38, glide: true },
    { f: 1518, pos: [RX + 1.95, 1.24, -2.0], look: [RX + 3.0, 1.0, -3.1], fov: 38 },
    { f: 1540, pos: [RX + 1.3, 1.6, 4.2], look: [RX + 0.9, 1.5, 1.8], fov: 38, glide: true },
    { f: 1597, pos: [RX + 1.2, 1.6, 3.8], look: [RX + 0.9, 1.5, 1.8], fov: 38 },
  ] },
  // 8. En el centro, tu Minotauro: enorme y de sombra, cámara baja
  { id: 8, a: 1597, b: 1823, light: "night", sun: [160, 30], keys: [
    { f: 1597, pos: [RX + 0.6, 0.6, 3.6], look: [RX - 0.5, 2.5, -1.6], fov: 48 },
    { f: 1823, pos: [RX + 0.3, 0.55, 1.5], look: [RX - 0.5, 2.6, -1.6], fov: 48 },
  ] },
  // 9. La sombra del chico en la pared se vuelve Teseo con su espada; el chico coge el hilo rojo
  { id: 9, a: 1823, b: 1974, light: "night", sun: [150, 26], keys: [
    { f: 1823, pos: [RX + 1.0, 1.7, 2.2], look: [RX + 1.4, 1.8, -4], fov: 44 },
    { f: 1880, pos: [RX + 1.0, 1.7, 1.8], look: [RX + 1.4, 1.8, -4], fov: 44 },
    { f: 1930, pos: [RX - 0.4, 1.5, 0.2], look: [RX + 0.9, 1.3, -2.9], fov: 42, glide: true },
    { f: 1974, pos: [RX - 0.5, 1.5, -0.1], look: [RX + 0.9, 1.3, -2.9], fov: 42 },
  ] },
  // 10. Mientras huyes, crece; cuando lo miras de frente, vuelve a su tamaño
  { id: 10, a: 1974, b: 2111, light: "night", sun: [160, 30], keys: [
    { f: 1974, pos: [RX - 0.3, 1.4, 4.4], look: [RX - 0.4, 2.0, -1], fov: 44 },
    { f: 2030, pos: [RX - 0.3, 1.4, 4.0], look: [RX - 0.4, 2.0, -1], fov: 44 },
    { f: 2050, pos: [RX - 0.4, 1.6, 2.4], look: [RX - 0.5, 1.6, -1.6], fov: 44, glide: true },
    { f: 2111, pos: [RX - 0.45, 1.3, 0.5], look: [RX - 0.5, 0.8, -1.6], fov: 44 },
  ] },
  // 11. Amanecer: subimos y se ve el laberinto entero, con el hilo rojo que llega al centro
  { id: 11, a: 2111, b: TOTAL, light: "dawn", sun: [-50, 28], keys: [
    { f: 2111, pos: [0, 7, GATE_Z + 12], look: [0, 1, GATE_Z - 8], fov: 48 },
    { f: TOTAL, pos: [0, 72, GATE_Z + 16], look: [0, 0, 0], fov: 50, glide: true },
  ] },
];
export const XFADE = 6;

export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1];
  if (s.cam) return s.cam(f);
  const k = s.keys!;
  if (f <= k[0].f) return { pos: k[0].pos, look: k[0].look, fov: k[0].fov };
  for (let i = 1; i < k.length; i++) if (f <= k[i].f) {
    const u = (f - k[i - 1].f) / (k[i].f - k[i - 1].f), t = k[i].glide ? smoother(u) : u;
    return { pos: lerp3(k[i - 1].pos, k[i].pos, t), look: lerp3(k[i - 1].look, k[i].look, t), fov: lerp(k[i - 1].fov, k[i].fov, t) };
  }
  const l = k[k.length - 1];
  return { pos: l.pos, look: l.look, fov: l.fov };
};

/** una o dos capas: la toma nueva entra con un fundido de XFADE cuadros sobre la anterior */
export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (let i = SHOTS.length - 1; i > 0; i--) {
    const a = SHOTS[i].a;
    if (f >= a + XFADE) return [{ id: i + 1, alpha: 1 }];
    if (f >= a) return [{ id: i, alpha: 1 }, { id: i + 1, alpha: (f - a + 1) / (XFADE + 1) }];
  }
  return [{ id: 1, alpha: 1 }];
};

/** profundidad de campo: cInf = desenfoque en el infinito (px a 1080p); aéreas sin desenfoque */
export const dofAt = (id: number, f: number): { cInf: number; focus?: V3 } => {
  if (id === 1) return { cInf: 6 };
  if (id === 4) return f < 700 ? { cInf: 6 } : f < 790 ? { cInf: 0 } : { cInf: 12 };
  if (id === 11) return { cInf: lerp(8, 0, smooth((f - 2111) / 40)) };
  if (id === 3) return f < 545 ? { cInf: 4 } : { cInf: 12 };
  return { cInf: 12 };
};

/** reloj del mundo: en «Espera…» el mundo se congela (la cámara sigue avanzando) */
export const worldF = (f: number) => (f >= FREEZE && f < 1287 ? FREEZE : f);
export const gait = (t: number, hz: number) => Math.floor(((((t * hz) % 1) + 1) % 1) * 8) / 8;
