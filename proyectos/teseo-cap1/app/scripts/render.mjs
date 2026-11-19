// uso: node scripts/render.mjs <salida.mp4> <desde> <hasta> [escala] [hilos]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [out, a, b, scale = "1", conc = "3"] = process.argv.slice(2);
const chromiumOptions = { gl: process.env.GL ?? "swangle" };
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const inputProps = { mute: true };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id: "Teseo", chromiumOptions, inputProps, browserExecutable });
const t0 = Date.now();
let last = 0;
await renderMedia({ composition, serveUrl, codec: "h264", crf: 16, outputLocation: out, frameRange: [Number(a), Number(b)], scale: Number(scale),
  concurrency: Number(conc), chromiumOptions, inputProps, browserExecutable, timeoutInMilliseconds: 300000, muted: true,
  onProgress: ({ renderedFrames }) => { if (renderedFrames - last >= 30) { last = renderedFrames; console.log(`${renderedFrames} cuadros, ${((Date.now() - t0) / 1000).toFixed(0)} s`); } } });
console.log("listo", ((Date.now() - t0) / 1000).toFixed(0), "s");
