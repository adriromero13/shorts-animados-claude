// El mundo de «Teseo y el laberinto»: un solo mundo three.js que se coloca por cuadro (función pura de toma + cuadro).
// Lugares: Creta (el laberinto en el origen, la puerta al sur, el mar y el barco), Atenas (x = +300) y la habitación
// del chico (x = -300). Mismo sistema que las plantillas: cielo pintado por elevación, materiales de dos tonos,
// personajes como cartas iluminadas, tinta del mundo.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Pen, bodyFront, Outfit, Expr, FrontOpts, fxStars, INK } from "./toon";
import { Pool, Actor, Fx, Stage, tier, light2D, blob, BODY } from "./troop";
import { NOINK } from "./ink";
import { LIGHTS, LOOK, LightPreset, WorldLook } from "./lights";
import { TONE, CHAR, twoTone, untone } from "./shade";
import { grassHD, cloudHD, stoneHD, planksHD, rep, ctex } from "./paint";
import { TESEO, EGEO, MINOS, ARIADNA, DEDALO, BANDIDO, CHICO, joven, minotauro, MinoOpts } from "./cast";
import { WALLS, WALL_H, HALF, N, C, CURVE, cellPos, RUN, PATH } from "./maze";
import { FPS, SHOTS, camAt, smooth, Light, AX, RX, GATE_Z, DEDALO_AT, teseoU, worldF, gait, V3 } from "./story";

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const lam = (p: THREE.MeshLambertMaterialParameters) => twoTone(new THREE.MeshLambertMaterial(p));
const box = (w: number, h: number, d: number, x: number, y: number, z: number) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);

// ---------------- luces por momento del día ----------------
const TORCH: LightPreset = { ...LIGHTS.golden, lit: [1.75, 0.95, 0.45], shade: [0.05, 0.04, 0.09], lift: [0.03, 0.02, 0.06], term: 0.15,
  charTint: [1.0, 0.8, 0.56], charShade: 0.7, actorShadow: false, fog: "#120c16", fogNear: 3, fogFar: 19, sunCol: "#ffb060", sunI: 3, sky: "#3a2a40", ground: "#1a1018", hemiI: 0.3 };
const NIGHT: LightPreset = { ...LIGHTS.day, lit: [0.78, 0.9, 1.4], shade: [0.16, 0.17, 0.33], lift: [0.04, 0.05, 0.12],
  charTint: [0.78, 0.86, 1.08], charShade: 0.8, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.8, 0.84, 1.0], blob: [0.5, 0.52, 0.7],
  fog: "#141c38", fogNear: 40, fogFar: 120, sunCol: "#a8c0ff", sunI: 2, sky: "#30406a", ground: "#141828", hemiI: 0.4 };
const DAWN: LightPreset = { ...LIGHTS.golden, lit: [1.6, 0.95, 0.7], shade: [0.2, 0.18, 0.36], charTint: [1.0, 0.86, 0.76], fog: "#f2b8a0", fogNear: 60, fogFar: 600 };
const PRESET: Record<Light, LightPreset> = { golden: LIGHTS.golden, day: LIGHTS.day, torch: TORCH, night: NIGHT, dawn: DAWN };
const DARK_SKY: WorldLook = { ...LOOK.golden, sky: { c: ["#24183a", "#1c1530", "#151228", "#100e20", "#0b0a18"], e: [0, 4, 10, 20, 40] }, bounce: [0, 0, 0], sat: 0.9 };
const DAWN_SKY: WorldLook = { ...LOOK.golden, sky: { c: ["#ffd6a0", "#f7b48e", "#e49a9a", "#a88cb8", "#6f80c0"], e: [0, 4, 10, 20, 40] } };
const LOOKS: Record<Light, WorldLook> = { golden: LOOK.golden, day: LOOK.day, torch: DARK_SKY, night: DARK_SKY, dawn: DAWN_SKY };

// ---------------- dibujos planos (efectos) ----------------
const flame = (p: Pen, v: number, cx: number, by: number, s: number) => {
  const j = [0, 1, 2].map((k) => Math.sin(v * 2.1 + k * 1.7) * 0.18);
  p.poly([[cx - 26 * s, by], [cx - 30 * s, by - 50 * s], [cx - 8 * s, by - (110 + 30 * j[0]) * s], [cx + 6 * s, by - 60 * s], [cx + 18 * s, by - (95 + 30 * j[1]) * s], [cx + 30 * s, by - 40 * s], [cx + 26 * s, by]], "#ff7a1a", 0);
  p.poly([[cx - 14 * s, by], [cx - 14 * s, by - 40 * s], [cx, by - (75 + 25 * j[2]) * s], [cx + 14 * s, by - 38 * s], [cx + 14 * s, by]], "#ffd84a", 0);
};
const torchDraw = (v: number) => (p: Pen) => { // 128 x 256: palo + llama
  p.band([[64, 250], [64, 120]], "#5a3a22", 9, 2);
  p.band([[64, 132], [64, 112]], "#3a2a20", 16, 2);
  flame(p, v, 64, 116, 0.95);
};
const glowDraw = (col: string) => (p: Pen) => {
  const g = p.g, gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, `rgba(${col},0.55)`); gr.addColorStop(0.35, `rgba(${col},0.22)`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
};
const rockDraw = (p: Pen) => { // 256 x 256
  const pts: [number, number][] = [];
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, r = 100 + 16 * Math.sin(i * 2.7); pts.push([128 + r * Math.cos(a), 140 + r * 0.72 * Math.sin(a)]); }
  p.shadedFill(pts, "#9a9188", "#615a58", -2.1, 110);
  p.poly(pts, null, 7);
  p.stroke([[80, 120], [110, 150], [100, 185]], 4, "#4a4448");
};
const swordDraw = (p: Pen) => { // 256 x 64, tumbada
  p.poly([[20, 32], [190, 24], [214, 32], [190, 40]], "#dfe6ee", 4);
  p.band([[190, 12], [190, 52]], "#d9a441", 8, 2);
  p.band([[196, 32], [244, 32]], "#5a3a22", 9, 2);
};
const ballDraw = (p: Pen) => { // 128 x 128, ovillo rojo
  p.ell(64, 64, 46, 46, "#d8232a", 6);
  for (const k of [-1, 0, 1]) p.arc(64, 64, 34, 18 + 10 * k, 200, 340, 3, "#8e1218");
  p.stroke([[100, 92], [126, 120]], 4, "#d8232a");
};
const screenDraw = (kind: "phone" | "laptop") => (p: Pen) => { // 256 x 256, pantalla que brilla
  const g = p.g;
  if (kind === "phone") {
    g.fillStyle = "#1a1c28"; g.beginPath(); g.roundRect(70, 10, 116, 236, 18); g.fill();
    g.fillStyle = "#8fb8ff"; g.fillRect(80, 30, 96, 196);
    g.fillStyle = "#0e1838"; g.font = "bold 42px sans-serif"; g.textAlign = "center"; g.fillText("3:00", 128, 110);
    g.font = "18px sans-serif"; g.fillText("12 notificaciones", 128, 150);
  } else {
    g.fillStyle = "#1a1c28"; g.fillRect(8, 30, 240, 160);
    g.fillStyle = "#c8384a"; g.fillRect(18, 40, 220, 140);
    g.fillStyle = "#ffffff"; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText("Siguiente capítulo", 128, 100);
    g.font = "bold 46px sans-serif"; g.fillText("5", 128, 154);
  }
};
const bubbleDraw = (p: Pen) => { // 512 x 256
  const g = p.g;
  g.fillStyle = "#ffffff"; g.strokeStyle = INK; g.lineWidth = 8;
  g.beginPath(); g.ellipse(256, 110, 230, 92, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(170, 190); g.lineTo(140, 250); g.lineTo(220, 196); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = "#ffffff"; g.fillRect(160, 180, 70, 22);
  g.fillStyle = INK; g.font = "bold 72px sans-serif"; g.textAlign = "center"; g.fillText("Estoy bien", 256, 136);
};
const wordDraw = (txt: string, col: string) => (p: Pen) => { // 1024 x 256: una palabra flotando
  const g = p.g;
  g.font = "bold 120px sans-serif"; const fs = Math.min(120, (120 * 940) / g.measureText(txt).width); g.font = `bold ${fs}px sans-serif`; g.textAlign = "center"; g.lineJoin = "round";
  g.lineWidth = 22; g.strokeStyle = "#0b0a18"; g.strokeText(txt, 512, 170);
  g.fillStyle = col; g.fillText(txt, 512, 170);
};
const silhouette = (o: Outfit, opts: FrontOpts): Outfit => {
  const S = "#141226";
  return { ...o, jacket: S, pants: S, boots: S, skin: S, hair: S, cape: o.cape ? S : undefined, beard: undefined, buttons: S, dress: o.dress ? S : undefined };
};
const shadowDraw = (k: number) => (p: Pen) => { // 600 x 1000: la sombra del chico que se vuelve Teseo
  const g = p.g;
  g.globalAlpha = 0.85 * (1 - k); bodyFront(p, silhouette(CHICO, {}), { mode: "stand", expr: "neutral", seed: 7 });
  g.globalAlpha = 0.85 * k; bodyFront(p, silhouette(TESEO, {}), { mode: "stand", expr: "stern", seed: 3, prop: ["sword", 0] });
  g.globalAlpha = 1;
};

// ---------------- cielo ----------------
const SKY_VS = "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const SKY_FS = `uniform vec3 c0, c1, c2, c3, c4; uniform vec4 e; varying vec3 vP;
  void main(){ float el = asin(clamp(normalize(vP).y, -1.0, 1.0));
    vec3 c = mix(c0, c1, smoothstep(0.0, e.x, el)); c = mix(c, c2, smoothstep(e.x, e.y, el));
    c = mix(c, c3, smoothstep(e.y, e.z, el)); c = mix(c, c4, smoothstep(e.z, e.w, el)); gl_FragColor = vec4(c, 1.0); }`;

type Wall = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; ry: number; soft: boolean };

export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private hemi: THREE.HemisphereLight; private sun: THREE.DirectionalLight;
  private skyMat: THREE.ShaderMaterial; private sky: THREE.Mesh;
  private fog = new THREE.Fog("#bccbec", 120, 1500);
  private clouds: THREE.Mesh[] = [];
  private thread: THREE.Mesh; private threadBig: THREE.Mesh; private threadSegs = 900; private threadRad = 6;
  private sunCache = new Map<number, THREE.Vector3>();
  private frustum = new THREE.Frustum(); private m4 = new THREE.Matrix4(); private sph = new THREE.Sphere(); private v = new THREE.Vector3();

  constructor() {
    const R = this.root;
    this.skyMat = new THREE.ShaderMaterial({
      uniforms: { c0: { value: new THREE.Color() }, c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() },
        c3: { value: new THREE.Color() }, c4: { value: new THREE.Color() }, e: { value: new THREE.Vector4() } },
      vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, fog: false,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(2400, 48, 24), this.skyMat);
    this.sky.renderOrder = -1; this.sky.frustumCulled = false; this.sky.layers.set(NOINK);
    R.add(this.sky);
    this.hemi = new THREE.HemisphereLight("#cfe6ff", "#6c5c8c", 1.1);
    this.sun = new THREE.DirectionalLight("#fff0d6", 2.6);
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048);
    R.add(this.hemi, this.sun, this.sun.target);
    const add = (g: THREE.BufferGeometry, m: THREE.Material, cast = true) => { const o = new THREE.Mesh(g, m); o.castShadow = cast; o.receiveShadow = true; R.add(o); return o; };

    // nubes
    const cm = [0, 1, 2, 3].map((k) => cloudHD(k));
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + hh(i, 20), d = 700 + hh(i, 21) * 600;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: cm[i % 4], transparent: true, depthWrite: false, fog: false }));
      const w = 160 + hh(i, 23) * 140;
      m.position.set(Math.cos(a) * d, 120 + hh(i, 22) * 260, Math.sin(a) * d); m.scale.set(w, w / 2, 1); m.layers.set(NOINK); this.clouds.push(m); R.add(m);
    }

    // ===== CRETA =====
    const dirt = ctex("creteDirt", 512, 512, (g, r) => {
      g.fillStyle = "#c9a878"; g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) { g.fillStyle = r() < 0.5 ? "rgba(140,110,72,0.35)" : "rgba(222,198,152,0.35)"; g.beginPath(); g.ellipse(r() * 512, r() * 512, 2 + r() * 8, 1 + r() * 4, 0, 0, 6.3); g.fill(); }
    });
    add(new THREE.PlaneGeometry(260, 180).rotateX(-Math.PI / 2).translate(0, 0, -34), lam({ map: rep(dirt, 40, 28) }), false);
    // el suelo del laberinto: losas
    add(new THREE.PlaneGeometry(2 * HALF + 1, 2 * HALF + 1).rotateX(-Math.PI / 2).translate(0, 0.012, 0), lam({ map: rep(stoneHD("floorStone", ["#b7aa98", "#ad9f8c", "#c0b3a1", "#a69885"], "#7d705f"), 9, 9) }), false);
    // los muros: piedra clara y vieja, con musgo abajo
    const wallTex = stoneHD("mazeStone", ["#d6c6aa", "#ccbb9e", "#dfd0b5", "#c2b193"], "#8f7f66");
    add(mergeGeometries(WALLS.map(([x, z, sx, sz]) => box(sx, WALL_H, sz, x, WALL_H / 2, z))), lam({ map: rep(wallTex, 1, 1) }));
    add(mergeGeometries(WALLS.map(([x, z, sx, sz]) => box(sx + 0.08, 0.18, sz + 0.08, x, WALL_H + 0.09, z))), lam({ color: "#a89880" }));
    // la puerta: columnas minoicas rojas (más anchas arriba), capiteles negros, dintel y cuernos de consagración
    const ex = cellPos(5, N - 1).x, gz = GATE_Z + 0.5;
    const red = lam({ color: "#b8342a" }), blk = lam({ color: "#2a2228" }), ochre = lam({ color: "#d9a441" }), wallW = lam({ color: "#e8dcc4" });
    for (const s of [-1, 1]) {
      add(new THREE.CylinderGeometry(0.42, 0.3, 4.6, 20).translate(ex + s * 2.1, 2.3, gz), red);
      add(new THREE.CylinderGeometry(0.62, 0.62, 0.36, 20).translate(ex + s * 2.1, 4.78, gz), blk);
      add(box(1.4, 0.3, 1.4, ex + s * 2.1, 5.1, gz), ochre);
    }
    add(box(6.2, 0.9, 1.6, ex, 5.7, gz), wallW);
    add(box(6.4, 0.22, 1.7, ex, 6.25, gz), red);
    for (const s of [-1, 1]) {
      add(new THREE.ConeGeometry(0.42, 1.4, 4).translate(0, 0.7, 0).rotateZ(-s * 0.35).translate(ex + s * 1.2, 6.35, gz), wallW);
      add(new THREE.ConeGeometry(0.42, 1.4, 4).translate(0, 0.7, 0).rotateZ(-s * 0.35).translate(ex + s * 2.6, 6.35, gz), wallW);
    }
    // fachada alta del palacio a ambos lados de la puerta, con friso rojo
    for (const s of [-1, 1]) {
      add(box(16, 6.6, 1.4, ex + s * 10.6, 3.3, gz), wallW);
      add(box(16.2, 0.5, 1.5, ex + s * 10.6, 4.6, gz), red);
      for (let k = 0; k < 4; k++) add(box(1.1, 1.6, 0.1, ex + s * (5 + k * 3.4), 2.4, gz + 0.72), blk);
    }
    // el estrado de Minos con escalones
    add(box(3.4, 1.4, 2.6, -5.4, 0.7, GATE_Z + 2.4), lam({ color: "#d8cab0" }));
    for (let k = 0; k < 3; k++) add(box(3.4, 0.47 * (k + 1), 0.45, -5.4, 0.235 * (k + 1), GATE_Z + 4.1 - k * 0.45), lam({ color: "#cdbfa4" }));
    // el mar y el barco de velas negras
    add(new THREE.PlaneGeometry(900, 500).rotateX(-Math.PI / 2).translate(0, -0.25, 306), lam({ color: "#2e6fa6" }), false);
    add(new THREE.PlaneGeometry(260, 2).rotateX(-Math.PI / 2).translate(0, -0.1, 56.5), lam({ color: "#e9dcbc" }), false);
    {
      const sx = -13, sz = 64, hull = lam({ color: "#7a4a2a" }), wood = lam({ color: "#5a3420" });
      add(box(2.6, 1.3, 9, sx, 0.5, sz), hull);
      add(new THREE.ConeGeometry(1.35, 2.6, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4).translate(sx, 0.6, sz + 5.6), hull);
      add(new THREE.ConeGeometry(1.35, 2.6, 4).rotateX(-Math.PI / 2).rotateZ(Math.PI / 4).translate(sx, 0.6, sz - 5.6), hull);
      add(new THREE.CylinderGeometry(0.12, 0.14, 8, 10).translate(sx, 4.8, sz), wood);
      add(new THREE.CylinderGeometry(0.08, 0.08, 5.6, 8).rotateX(Math.PI / 2).translate(sx, 7.6, sz), wood);
      const sail = new THREE.PlaneGeometry(5.4, 4.6, 8, 4), sp = sail.attributes.position;
      for (let i = 0; i < sp.count; i++) sp.setZ(i, 0.35 * Math.cos((sp.getX(i) / 2.7) * Math.PI / 2));
      sail.computeVertexNormals();
      add(sail.rotateY(Math.PI / 2).translate(sx + 0.3, 5.3, sz), lam({ color: "#1e1820", side: THREE.DoubleSide }));
      for (let k = 0; k < 7; k++) add(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 6).rotateZ(1.1).translate(sx + 1.8, 0.2, sz - 3.6 + k * 1.2), wood);
    }
    // colinas
    const hillM = lam({ map: rep(grassHD(), 30, 10), color: "#c8b890" });
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * Math.PI * 2 + hh(k, 7), d = 160 + hh(k, 8) * 80;
      if (Math.sin(a) > 0.2) continue;
      const h = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), hillM);
      h.position.set(Math.cos(a) * d, -2, Math.sin(a) * d - 30); h.scale.set(60 + hh(k, 9) * 50, 18 + hh(k, 10) * 22, 40 + hh(k, 11) * 30);
      h.receiveShadow = true; R.add(h);
    }

    // ===== ATENAS =====
    add(new THREE.PlaneGeometry(240, 240).rotateX(-Math.PI / 2).translate(AX, 0.005, 0), lam({ map: rep(grassHD(), 60, 60) }), false);
    add(new THREE.PlaneGeometry(40, 3.2).rotateX(-Math.PI / 2).translate(AX + 20, 0.02, 6.2), lam({ map: rep(dirt, 8, 1) }), false);
    {
      const marble = lam({ color: "#efe8da" }), marble2 = lam({ color: "#e2d9c6" }), tz = -15;
      add(box(26, 1.2, 13, AX, 0.6, tz), marble2);
      add(box(24, 0.4, 11.4, AX, 1.4, tz), marble);
      for (let k = 0; k < 8; k++) add(new THREE.CylinderGeometry(0.5, 0.58, 6, 18).translate(AX - 10.5 + k * 3, 4.6, tz + 5), marble);
      add(box(24.6, 1.1, 11.8, AX, 8.15, tz), marble2);
      const ped = new THREE.Shape([new THREE.Vector2(-12.3, 0), new THREE.Vector2(12.3, 0), new THREE.Vector2(0, 2.8)]);
      add(new THREE.ExtrudeGeometry(ped, { depth: 11.8, bevelEnabled: false }).translate(AX, 8.7, tz - 5.9), lam({ color: "#d9cfbc" }));
      add(box(24.6, 0.35, 0.2, AX, 8.0, tz + 5.95), lam({ color: "#3b5fa8" }));
      // el trono de Egeo sobre un estrado, delante del templo
      add(box(4.4, 0.9, 3.2, AX, 0.45, -6.6), marble2);
      add(box(1.6, 0.5, 1.2, AX, 1.15, -6.6), lam({ color: "#c98f3e" }));
      add(box(1.6, 2.6, 0.3, AX, 2.2, -7.2), lam({ color: "#c98f3e" }));
      add(box(1.9, 0.3, 0.4, AX, 3.55, -7.2), lam({ color: "#e8c45a" }));
      // olivos
      for (let k = 0; k < 9; k++) {
        const x = AX - 30 + k * 7.5 + hh(k, 40) * 3, z = -26 - hh(k, 41) * 14;
        add(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8).translate(x, 1.1, z), lam({ color: "#6a5034" }));
        add(new THREE.IcosahedronGeometry(1.8, 1).scale(1.2, 0.8, 1.1).translate(x, 3, z), lam({ color: "#7d8f5a" }));
      }
      for (let k = 0; k < 10; k++) { // colinas detrás
        const a = Math.PI + (k / 10) * Math.PI, d = 120 + hh(k, 42) * 60;
        const h = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), lam({ map: rep(grassHD(), 20, 8), color: "#b8c890" }));
        h.position.set(AX + Math.cos(a) * d, -2, Math.sin(a) * d); h.scale.set(50 + hh(k, 43) * 40, 16 + hh(k, 44) * 16, 30 + hh(k, 45) * 20); R.add(h);
      }
    }

    // ===== LA HABITACIÓN (de noche) =====
    {
      const W = 8, D = 8, H = 3.8, wall = lam({ color: "#aeb8d0", side: THREE.DoubleSide }), wall2 = lam({ color: "#9aa6c4", side: THREE.DoubleSide });
      add(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2).translate(RX, 0.01, 0), lam({ map: rep(planksHD(), 2, 2), color: "#c8a888" }), false);
      add(new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2).translate(RX, H, 0), wall2, false);
      add(new THREE.PlaneGeometry(W, H).translate(RX, H / 2, -D / 2), wall, false);
      add(new THREE.PlaneGeometry(W, H).rotateY(Math.PI).translate(RX, H / 2, D / 2 + 1.2), wall, false);
      add(new THREE.PlaneGeometry(D + 2.4, H).rotateY(Math.PI / 2).translate(RX - W / 2, H / 2, 0.6), wall2, false);
      add(new THREE.PlaneGeometry(D + 2.4, H).rotateY(-Math.PI / 2).translate(RX + W / 2, H / 2, 0.6), wall2, false);
      add(new THREE.PlaneGeometry(W, 0.14).translate(RX, 0.07, -D / 2 + 0.01), lam({ color: "#e8e8f0" }), false);
      // ventana con luna
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), new THREE.MeshBasicMaterial({ color: "#2c4c94" }));
      win.position.set(RX - 1.6, 2.1, -D / 2 + 0.02); R.add(win);
      const moon = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ color: "#f4f0d8" }));
      moon.position.set(RX - 1.1, 2.5, -D / 2 + 0.03); moon.layers.set(NOINK); R.add(moon);
      add(box(1.9, 0.08, 0.1, RX - 1.6, 1.32, -D / 2 + 0.05), lam({ color: "#e8e8f0" }));
      add(box(0.08, 1.5, 0.08, RX - 1.6, 2.1, -D / 2 + 0.05), lam({ color: "#e8e8f0" }));
      // cama
      add(box(2.2, 0.4, 1.4, RX - 2.7, 0.2, -1.6), lam({ color: "#6a4a3a" }));
      add(box(2.1, 0.22, 1.32, RX - 2.7, 0.51, -1.6), lam({ color: "#e8ecf4" }));
      add(box(1.4, 0.14, 1.36, RX - 2.4, 0.66, -1.6), lam({ color: "#d65a4a" }));
      add(box(0.45, 0.16, 0.9, RX - 3.5, 0.68, -1.6), lam({ color: "#f4f4f8" }));
      add(box(0.12, 1.1, 1.4, RX - 3.85, 0.55, -1.6), lam({ color: "#6a4a3a" }));
      // escritorio con el móvil y el portátil
      add(box(1.0, 0.06, 2.2, RX + 3.35, 0.76, -2.7), lam({ color: "#8a6a4a" }));
      for (const [dx, dz] of [[-0.42, -1.0], [0.42, -1.0], [-0.42, 1.0], [0.42, 1.0]]) add(box(0.06, 0.74, 0.06, RX + 3.35 + dx, 0.37, -2.7 + dz), lam({ color: "#6a4a3a" }));
      add(box(0.09, 0.012, 0.17, RX + 3.1, 0.796, -2.2), lam({ color: "#1a1c28" }));
      add(box(0.5, 0.02, 0.36, RX + 3.25, 0.8, -3.1), lam({ color: "#5a5e6a" }));
      // estantería y póster
      add(box(0.36, 1.8, 1.2, RX + 3.8, 0.9, 1.6), lam({ color: "#7a5a3a" }));
      for (let k = 0; k < 9; k++) add(box(0.26, 0.3, 0.07, RX + 3.75, 0.35 + Math.floor(k / 3) * 0.55, 1.15 + (k % 3) * 0.3 + hh(k, 50) * 0.05), lam({ color: ["#c0353a", "#3b5fa8", "#d9a441", "#2f8f8a"][k % 4] }));
      add(new THREE.PlaneGeometry(1.0, 1.4).translate(RX + 2.4, 2.2, -D / 2 + 0.02), lam({ color: "#d9a441" }), false);
      add(new THREE.PlaneGeometry(0.4, 0.4).translate(RX + 2.4, 2.35, -D / 2 + 0.03), lam({ color: "#b8342a" }), false);
    }

    // ===== el hilo rojo de Ariadna, a lo largo del camino =====
    const tube = new THREE.TubeGeometry(CURVE, this.threadSegs, 0.055, this.threadRad, false);
    tube.translate(0.35, 0.08, 0);
    this.thread = new THREE.Mesh(tube, new THREE.MeshBasicMaterial({ color: "#e0222c" }));
    this.thread.layers.set(NOINK); this.thread.visible = false; R.add(this.thread);
    this.threadBig = new THREE.Mesh(new THREE.TubeGeometry(CURVE, 600, 0.22, 6, false).translate(0.35, 0.25, 0), new THREE.MeshBasicMaterial({ color: "#ff2a34" }));
    this.threadBig.layers.set(NOINK); this.threadBig.visible = false; R.add(this.threadBig);
  }

  /** sol fijo por toma, relativo a la dirección media de la cámara: az 0 = de frente (contraluz), +90 = derecha */
  private shotSun(id: number) {
    let v = this.sunCache.get(id);
    if (v) return v;
    const s = SHOTS[id - 1];
    let fx = 0, fz = 0;
    for (let f = s.a; f < s.b; f += 3) { const c = camAt(id, f), x = c.look[0] - c.pos[0], z = c.look[2] - c.pos[2], n = Math.hypot(x, z) || 1; fx += x / n; fz += z / n; }
    const n = Math.hypot(fx, fz) || 1; fx /= n; fz /= n;
    const az = THREE.MathUtils.degToRad(s.sun[0]), el = THREE.MathUtils.degToRad(s.sun[1]);
    const hx = fx * Math.cos(az) - fz * Math.sin(az), hz = fz * Math.cos(az) + fx * Math.sin(az);
    v = new THREE.Vector3(hx * Math.cos(el), Math.sin(el), hz * Math.cos(el)).normalize();
    this.sunCache.set(id, v);
    return v;
  }
  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(id: number, f0: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const f = worldF(f0), t = f / FPS, S = SHOTS[id - 1], L = PRESET[S.light], K = LOOKS[S.light];
    const c = camAt(id, f0);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look);
    cam.fov = c.fov; cam.near = c.pos[1] > 30 ? 1 : 0.1; cam.far = 5000; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = V(...c.look), dist = cam.position.distanceTo(focus), sunDir = this.shotSun(id);
    // luces
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = THREE.MathUtils.clamp(dist * 1.15 + 9, 14, 60);
    this.sun.position.copy(focus).addScaledVector(sunDir, 300); this.sun.target.position.copy(focus);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 200; sc.far = 420; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = L.normalBias * (Rr / 12);
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(...K.bounce);
    TONE.uSat.value = K.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    const su = this.skyMat.uniforms;
    K.sky.c.forEach((h, i) => untone(h, su["c" + i].value));
    const e = K.sky.e.map((deg) => THREE.MathUtils.degToRad(deg));
    su.e.value.set(e[1], e[2], e[3], e[4]);
    this.sky.position.copy(cam.position);
    untone(L.fog, this.fog.color);
    const up = smooth((c.pos[1] - 8) / 40);
    this.fog.near = THREE.MathUtils.lerp(L.fogNear, 150, S.light === "torch" ? 0 : up); this.fog.far = THREE.MathUtils.lerp(L.fogFar, 900, S.light === "torch" ? 0 : up);
    scene.fog = this.fog; scene.background = null;
    for (const m of this.clouds) { m.quaternion.copy(cam.quaternion); m.visible = S.light !== "torch" && S.light !== "night"; }

    // el hilo: va detrás de Teseo en la toma 6, entero al amanecer
    const segK = (u: number) => Math.max(0, Math.floor(u * this.threadSegs)) * this.threadRad * 6;
    this.thread.visible = id === 6 || (id === 11 && c.pos[1] < 20);
    this.threadBig.visible = id === 11 && c.pos[1] >= 20;
    if (id === 6) this.thread.geometry.setDrawRange(0, segK(teseoU(f)));
    else this.thread.geometry.setDrawRange(0, Infinity);

    // ---- reparto ----
    const right = V(0, 0, 0).setFromMatrixColumn(cam.matrixWorld, 0);
    const light = light2D(sunDir, right);
    const st: Stage = { places: [], fx: [] };
    const walls: Wall[] = [];
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
    const lidAt = (i: number) => {
      let s = Math.round(-60 * hh(i, 9));
      for (let n = 0; s <= f && n < 80; n++) { const k = f - s; if (k >= 0 && k < 4) return [0.5, 1, 1, 0.5][k]; s += Math.round(15 + 54 * hh(i * 31 + n, 13)); }
      return 0;
    };
    const visible = (x: number, y: number, z: number, r: number) => this.frustum.intersectsSphere(this.sph.set(this.v.set(x, y, z), r));
    /** una carta de personaje: dibujo 600 x 1000, escala s (1 = 2,16 m) */
    const card = (key: string, draw: (p: Pen, o2: { light: number; blink: number }) => void, x: number, y: number, z: number, i: number, s = 1, contact = true) => {
      if (!visible(x, y + 1.1 * s, z, 3.5 * s)) return;
      const d = cam.position.distanceTo(this.v.set(x, y + 1.2 * s, z)) / s, [w, h, k] = tier(d), near = d < 16;
      const o2 = { light, blink: near ? lidAt(i) : 0 };
      st.places.push({ key: `${key}|${light}|${o2.blink}`, x, y, z, size: [w, h, k], scale: s, draw: (p) => draw(p, o2) });
      if (contact && d * s < 60 && S.light !== "torch") blob(st, sunDir, x, y, z, s);
    };
    const person = (who: string, o: Outfit, x: number, y: number, z: number, opts: FrontOpts, i: number, s = 1) =>
      card(`${who}|${JSON.stringify(opts)}`, (p, o2) => bodyFront(p, o, { seed: (i * 5 + 3) % 7 + 1, ...opts, ...o2 }), x, y, z, i, s);
    const mino = (x: number, z: number, s: number, opts: MinoOpts, i = 99) =>
      card(`mino|${JSON.stringify(opts)}`, (p, o2) => minotauro(p, { seed: 4, ...opts, light: o2.light, blink: o2.blink }), x, 0, z, i, s);
    const fxCard = (key: string, cw: number, ch: number, draw: (p: Pen) => void, x: number, y: number, z: number, w: number, h: number, soft = false) =>
      st.fx.push({ key, cw, ch, draw, x, y, z, w, h, soft });

    if (id === 1) {
      // el Minotauro, en sombra, al fondo del pasillo recto
      const p = cellPos(PATH[RUN.b].cx, PATH[RUN.b].cy);
      mino(p.x, p.z, 1.3, { shadow: 0.75, eyes: 1, expr: "stern" });
    }
    if (id === 2) {
      person("egeo", EGEO, AX, 0.9, -6.3, { mode: "sit", expr: f > 253 ? "neutral" : "stern", facing: 0, look: 0 }, 1);
      // Teseo y la roca
      const lift = smooth((f - 305) / 24) * (1 - smooth((f - 352) / 14)), toss = smooth((f - 352) / 14);
      const sword = f >= 379;
      const tOpts: FrontOpts = { mode: "stand", expr: f < 352 ? (f > 300 ? "pained" : "stern") : sword ? "grin" : "stern", prop: sword ? ["sword", 1 - smooth((f - 379) / 10)] : null, raise: 0 };
      person("teseo", TESEO, AX + 6, 0, 2, tOpts, 2);
      const rx = AX + 6 + toss * 2.6, ry = 0.05 + lift * 2.0 + toss * (1 - toss) * 1.6 - toss * 0.05;
      fxCard("rock", 256, 256, rockDraw, rx, ry + 0.55, 2.15, 1.25, 1.25);
      if (f < 379) st.fx.push({ key: "sword", cw: 256, ch: 64, draw: swordDraw, x: AX + 6.1, y: 0.03, z: 2.5, w: 1.0, h: 0.25, flat: true, rot: 0.3 });
      // bandidos vencidos en el camino, con estrellitas
      for (let k = 0; k < 5; k++) {
        const x = AX + 12 + k * 3.6 + hh(k, 30) * 1.2, z = 5.6 + hh(k, 31) * 1.4;
        st.fx.push({ key: `bandit|${k % 3}`, cw: 300, ch: 500, draw: (p) => { p.g.scale(0.5, 0.5); bodyFront(p, { ...BANDIDO, jacket: ["#6b5a3a", "#5a4a6a", "#7a4a3a"][k % 3] }, { mode: "fall", expr: "dazed", light: -2.1, seed: k + 1 }); }, x, y: 0.03, z, w: 1.3, h: 2.16, flat: true, rot: hh(k, 32) * 6.28 });
        const v = Math.floor((f / 3 + k * 2) % 8) / 8;
        fxCard(`stars|${v}`, 420, 210, (p) => fxStars(p, v), x, 0.75, z, 1.0, 0.5);
      }
    }
    if (id === 3 || id === 5) {
      // los catorce jóvenes ante la puerta
      for (let k = 0; k < 14; k++) {
        const row = Math.floor(k / 7), x = -3.3 + (k % 7) * 1.1 + row * 0.5 + (hh(k, 3) - 0.5) * 0.25, z = GATE_Z + 5.0 + row * 1.25 + (hh(k, 4) - 0.5) * 0.25;
        if (id === 5 && k === 3) continue; // Teseo ocupa su lugar
        const ex: Expr = id === 3 ? (k % 3 === 0 ? "shock" : "nervous") : f > 870 ? "shock" : "nervous";
        person(`jov${k}`, joven(k), x, 0, z, { mode: "stand", expr: ex, facing: 0 }, 10 + k, 0.92);
      }
      person("minos", MINOS, -5.4, 1.4, GATE_Z + 2.4, { mode: "stand", expr: "stern", facing: 0 }, 3, 1.05);
    }
    if (id === 4) {
      const scratch = Math.sin(t * 5) > 0;
      person("dedalo", DEDALO, DEDALO_AT.x, 0, DEDALO_AT.z, { mode: "stand", expr: f > 800 ? "dazed" : "nervous", headTilt: scratch ? 6 : -6, look: scratch ? 1 : -1 }, 4);
      if (f > 790) { const v = Math.floor((f / 3) % 8) / 8; fxCard(`stars|${v}`, 420, 210, (p) => fxStars(p, v), DEDALO_AT.x, 2.45, DEDALO_AT.z, 0.9, 0.45); }
    }
    if (id === 5) {
      const step = smooth((f - 852) / 24);
      const tz = GATE_Z + 6.25 - step * 2.15, tx = 1.0 - step * 0.3;
      person("teseo", TESEO, tx, 0, tz, { mode: step > 0 && step < 1 ? "stroll" : "stand", phase: gait(t, 1.6), expr: f > 930 ? "smile" : "stern", facing: 0 }, 2);
      const ar = smooth((f - 880) / 30), az = GATE_Z + 4.0, axp = -0.55;
      if (ar > 0) person("ariadna", ARIADNA, axp - (1 - ar) * 2.5, 0, az, { mode: ar < 1 ? "stroll" : "stand", phase: gait(t, 1.6), expr: "smile", facing: 0 }, 5);
      // el ovillo pasa de la mano de Ariadna a la de Teseo
      if (f > 900) { const g = smooth((f - 960) / 30); fxCard("ball", 128, 128, ballDraw, axp + 0.4 + g * (tx - 0.4 - axp - 0.4), 1.02, az + 0.15 + g * 0.3, 0.26, 0.26); }
    }
    if (id === 6) {
      const u = teseoU(f), p = CURVE.getPointAt(u), q = CURVE.getPointAt(Math.min(1, u + 0.002));
      const walking = f < 1217;
      person("teseoT", TESEO, p.x, 0, p.z, { mode: walking ? "stroll" : "stand", phase: walking ? gait(t, 1.4) : 0, expr: f > 1160 ? "nervous" : "stern", facing: 0 }, 2);
      void q;
      const tr = right.clone().multiplyScalar(0.42), v = Math.floor(f / 2) % 6;
      fxCard(`torch|${v}`, 128, 256, torchDraw(v), p.x + tr.x, 1.55, p.z + tr.z, 0.42, 0.84);
      fxCard("glow", 256, 256, glowDraw("255,170,80"), p.x + tr.x, 1.85, p.z + tr.z, 3.2, 3.2, true);
      if (f > 1174) { // algo enorme respira detrás de él
        const b = CURVE.getPointAt(Math.max(0, u - 0.05));
        mino(b.x, b.z, 1.45, { shadow: 1, eyes: 1, expr: "stern" });
      }
    }
    if (id >= 7 && id <= 10) {
      // la habitación: el chico, las pantallas, el Minotauro de sombra
      if (id === 7) {
        person("chico", CHICO, RX + 0.9, 0, 1.8, { mode: "stand", expr: f > 1535 ? "smile_closed" : "nervous", facing: 0 }, 6);
        if (f >= 1540) fxCard("bubble", 512, 256, bubbleDraw, RX + 0.95, 2.15, 1.8, 0.9, 0.45);
      }
      fxCard("phone", 256, 256, screenDraw("phone"), RX + 3.05, 0.95, -2.2, 0.32, 0.32);
      fxCard("laptop", 256, 256, screenDraw("laptop"), RX + 3.2, 1.0, -3.1, 0.55, 0.55);
      if (id === 8 || id === 9) mino(RX - 0.5, -1.6, 1.6, { shadow: 1, eyes: 1, expr: "stern" });
      if (id === 8) {
        const pop = (a: number) => Math.min(1, Math.max(0, (f - a) / 6));
        const words: [string, number, number, number, number][] = [["miedo", 1671, -0.5, 1.95, -0.4], ["culpa", 1701, -0.5, 1.6, -0.4], ["conversación pendiente", 1728, -0.5, 1.25, -0.4]];
        for (const [w, a, dx, y, z] of words) {
          const k = pop(a);
          if (k > 0) fxCard(`word|${w}`, 1024, 256, wordDraw(w, "#ffd23f"), RX + dx, y, z, 1.0 * k, 0.25 * k, true);
        }
      }
      if (id === 9) {
        person("chico9", CHICO, RX + 0.7, 0, -2.6, { mode: "stand", expr: f > 1900 ? "stern" : "nervous", facing: 0 }, 6);
        const k = smooth((f - 1862) / 18);
        walls.push({ key: `shadow|${Math.round(k * 12)}`, draw: shadowDraw(Math.round(k * 12) / 12), x: RX + 1.75, y: 0.02, z: -3.97, w: 600 * 0.0034, h: 1000 * 0.0034, ry: 0, soft: true });
        if (f > 1935) fxCard("ball", 128, 128, ballDraw, RX + 1.05, 1.0, -2.5, 0.24, 0.24);
      }
      if (id === 10) {
        const run = smooth((f - 1980) / 50);
        if (f < 2040) person("chicoR", CHICO, RX - 0.3, 0, 0.4 + run * 2.6, { mode: "march", phase: gait(t, 2.4), expr: "shock", facing: 0 }, 6);
        const grow = 1.6 + 0.8 * smooth((f - 1990) / 40), shrink = smooth((f - 2057) / 40);
        const s = grow * (1 - shrink) + 0.55 * shrink;
        mino(RX - 0.5, -1.6, s, { shadow: 1 - 0.75 * shrink, eyes: 1 - shrink, expr: shrink > 0.5 ? "nervous" : "stern" });
      }
    }
    if (id === 11) {
      // al centro llega el hilo; Teseo, pequeño, en la cámara del Minotauro
      const p = cellPos(5, 5);
      person("teseoF", TESEO, p.x + 0.6, 0, p.z + 0.5, { mode: "stand", expr: "smile", facing: 0, prop: ["sword", 0] }, 2);
    }

    // ---- colocar cartas ----
    let ai = 0;
    for (const p of st.places) {
      const a = this.actor(ai++), [w, h, k] = p.size, s = p.scale ?? 1;
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.geometry = BODY;
      a.mesh.visible = true; a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0);
      a.mesh.scale.set(s, s, s);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    for (const p of st.fx) {
      if (!visible(p.x, p.y, p.z, Math.max(p.w, p.h))) continue;
      const e = this.fx(fi++);
      e.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e.use(!!p.soft); e.mesh.visible = true; e.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e.mesh.rotation.order = "YXZ"; e.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0); if (p.soft) e.mesh.quaternion.copy(cam.quaternion); }
      e.mesh.scale.set(p.w, p.h, 1);
    }
    for (const wl of walls) { // planos pegados a una pared (sombra en la pared)
      const e = this.fx(fi++);
      e.r = this.pool.req(wl.key, 600, 1000, 1, wl.draw);
      e.use(wl.soft); e.mesh.visible = true; e.mesh.rotation.set(0, wl.ry, 0);
      e.mesh.position.set(wl.x, wl.y + wl.h / 2, wl.z); e.mesh.scale.set(wl.w, wl.h, 1);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (let i = 0; i < ai; i++) this.actors[i].bind();
    for (let i = 0; i < fi; i++) this.fxs[i].bind();
    return focus;
  }
}
export type { V3 };
