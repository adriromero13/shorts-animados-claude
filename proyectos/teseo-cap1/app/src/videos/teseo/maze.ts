// El laberinto de Creta: rejilla de N x N celdas, generado con un recorrido en profundidad con semilla fija
// (siempre sale el mismo). Entrada al sur (z positivo), cámara de 3 x 3 celdas abierta en el centro.
// Celda (cx, cy): x = (cx - (N-1)/2) * C, z = (cy - (N-1)/2) * C; cy crece hacia el sur (+z).
import * as THREE from "three";

export const N = 11, C = 3.4, WALL_H = 3.6, WALL_T = 0.45;
export const HALF = (N * C) / 2; // 18.7: la muralla exterior
export const ENTRY = { cx: 5, cy: N - 1 }, CENTER = { cx: 5, cy: 5 };
export const cellPos = (cx: number, cy: number) => ({ x: (cx - (N - 1) / 2) * C, z: (cy - (N - 1) / 2) * C });

const rng = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

/** h[y][x]: muro al norte de la celda (x, y), y = 0..N. v[y][x]: muro al oeste de la celda (x, y), x = 0..N. */
export const MAZE = (() => {
  const h = Array.from({ length: N + 1 }, () => Array(N).fill(true));
  const v = Array.from({ length: N }, () => Array(N + 1).fill(true));
  const seen = Array.from({ length: N }, () => Array(N).fill(false));
  const r = rng(20261119);
  const inCenter = (x: number, y: number) => Math.abs(x - CENTER.cx) <= 1 && Math.abs(y - CENTER.cy) <= 1;
  // la cámara central se abre y se marca como vista; se entra a ella por una sola puerta (norte)
  for (let y = CENTER.cy - 1; y <= CENTER.cy + 1; y++) for (let x = CENTER.cx - 1; x <= CENTER.cx + 1; x++) {
    seen[y][x] = true;
    if (y > CENTER.cy - 1) h[y][x] = false;
    if (x > CENTER.cx - 1) v[y][x] = false;
  }
  const stack: [number, number][] = [[ENTRY.cx, ENTRY.cy]];
  seen[ENTRY.cy][ENTRY.cx] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = ([[0, -1], [1, 0], [0, 1], [-1, 0]] as const).map(([dx, dy]) => [x + dx, y + dy, dx, dy] as const)
      .filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < N && ny < N && !seen[ny][nx]);
    if (!nb.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nb[Math.floor(r() * nb.length) % nb.length];
    if (dy === -1) h[y][x] = false; else if (dy === 1) h[y + 1][x] = false;
    else if (dx === -1) v[y][x] = false; else v[y][x + 1] = false;
    seen[ny][nx] = true; stack.push([nx, ny]);
  }
  h[N][ENTRY.cx] = false;                      // la puerta
  h[CENTER.cy - 1][CENTER.cx] = false;         // la entrada a la cámara del Minotauro, por el norte
  void inCenter;
  return { h, v };
})();

const open = (x: number, y: number, dx: number, dy: number) => {
  if (dy === -1) return !MAZE.h[y][x];
  if (dy === 1) return !MAZE.h[y + 1][x];
  if (dx === -1) return !MAZE.v[y][x];
  return !MAZE.v[y][x + 1];
};

/** camino más corto de la entrada al centro (celdas) */
export const PATH = (() => {
  const prev = new Map<string, string>(), q: [number, number][] = [[ENTRY.cx, ENTRY.cy]], k = (x: number, y: number) => `${x},${y}`;
  prev.set(k(ENTRY.cx, ENTRY.cy), "");
  while (q.length) {
    const [x, y] = q.shift()!;
    if (x === CENTER.cx && y === CENTER.cy) break;
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N || prev.has(k(nx, ny)) || !open(x, y, dx, dy)) continue;
      prev.set(k(nx, ny), k(x, y)); q.push([nx, ny]);
    }
  }
  const out: { cx: number; cy: number }[] = [];
  for (let c = k(CENTER.cx, CENTER.cy); c; c = prev.get(c)!) { const [x, y] = c.split(",").map(Number); out.unshift({ cx: x, cy: y }); }
  return out;
})();

/** puntos del camino en el mundo: desde fuera de la puerta hasta el centro, esquinas redondeadas */
const pts = [new THREE.Vector3(cellPos(ENTRY.cx, ENTRY.cy).x, 0, HALF + 6), ...PATH.map((c) => { const p = cellPos(c.cx, c.cy); return new THREE.Vector3(p.x, 0, p.z); })];
export const CURVE = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.3);
export const CURVE_LEN = CURVE.getLength();
/** parámetro u (0..1, por longitud) del punto del camino más cercano a la celda i del PATH */
export const uOfCell = (i: number) => {
  let len = 0;
  for (let j = 0; j <= i; j++) len += pts[j + 1].distanceTo(pts[j]);
  return Math.min(1, len / pts.reduce((a, p, j) => (j ? a + p.distanceTo(pts[j - 1]) : 0), 0));
};

/** el tramo recto más largo del camino (para el gancho: la cámara llega a su principio y ve al Minotauro al fondo) */
export const RUN = (() => {
  let best = { a: 0, b: 1 };
  for (let a = 0; a < PATH.length - 1; a++) {
    const dx = PATH[a + 1].cx - PATH[a].cx, dy = PATH[a + 1].cy - PATH[a].cy;
    let b = a + 1;
    while (b + 1 < PATH.length && PATH[b + 1].cx - PATH[b].cx === dx && PATH[b + 1].cy - PATH[b].cy === dy) b++;
    if (b - a > best.b - best.a && b < PATH.length - 3) best = { a, b };
  }
  return best;
})();

/** todos los segmentos de muro como cajas [x, z, largo en x, largo en z] */
export const WALLS = (() => {
  const out: [number, number, number, number][] = [];
  for (let y = 0; y <= N; y++) for (let x = 0; x < N; x++) if (MAZE.h[y][x]) {
    const p = cellPos(x, y); out.push([p.x, p.z - C / 2, C + WALL_T, WALL_T]);
  }
  for (let y = 0; y < N; y++) for (let x = 0; x <= N; x++) if (MAZE.v[y][x]) {
    const p = cellPos(x, y); out.push([p.x - C / 2, p.z, WALL_T, C + WALL_T]);
  }
  return out;
})();
