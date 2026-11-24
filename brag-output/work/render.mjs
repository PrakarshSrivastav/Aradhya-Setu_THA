// Draws the composition frame by frame in headless Edge (Chrome DevTools Protocol).
//   node render.mjs stills 1.2 4.5 ...   -> work/stills/t-<time>.png
//   node render.mjs frames               -> work/frames/0000.jpg ... (30 fps)
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9333;
const FPS = 30;
const DURATION = 22.5;
const [mode, ...args] = process.argv.slice(2);

const profile = resolve(here, "edge-profile");
const browser = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--window-size=1920,1080", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--no-first-run", "--no-default-browser-check", "--disable-extensions", "about:blank",
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 100 && !target; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    target = list.find((t) => t.type === "page");
  } catch { /* not up yet */ }
  if (!target) await sleep(150);
}
if (!target) throw new Error("Edge did not start");

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let nextId = 1;
const pending = new Map();
const listeners = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve: ok, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : ok(msg.result);
  } else if (msg.method) listeners.forEach((l) => l(msg));
};
const send = (method, params = {}) => new Promise((ok, reject) => {
  const id = nextId++;
  pending.set(id, { resolve: ok, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || "page error");
  return r.result.value;
};

await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
const loaded = new Promise((r) => listeners.push((m) => m.method === "Page.loadEventFired" && r()));
await send("Page.navigate", { url: pathToFileURL(resolve(here, "composition/index.html")).href });
await loaded;
const fontsOk = await evaluate(`document.fonts.ready.then(() => document.fonts.check('600 20px Geist') && document.fonts.check('500 14px "Geist Mono"'))`);
if (!fontsOk) throw new Error("Geist fonts did not load");

const shot = async (t, format) => {
  await evaluate(`renderAt(${t}); new Promise(r => requestAnimationFrame(() => r(1)))`);
  const { data } = await send("Page.captureScreenshot", {
    format, ...(format === "jpeg" ? { quality: 95 } : {}),
    clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 },
  });
  return Buffer.from(data, "base64");
};

try {
  if (mode === "stills") {
    const dir = resolve(here, "stills");
    mkdirSync(dir, { recursive: true });
    for (const a of args) writeFileSync(resolve(dir, `t-${a}.png`), await shot(Number(a), "png"));
    console.log(`wrote ${args.length} stills`);
  } else if (mode === "frames") {
    const dir = resolve(here, "frames");
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const total = Math.round(DURATION * FPS);
    const started = Date.now();
    for (let i = 0; i < total; i++) {
      writeFileSync(resolve(dir, `${String(i).padStart(4, "0")}.jpg`), await shot(i / FPS, "jpeg"));
      if (i % 75 === 0) console.log(`frame ${i}/${total}`);
    }
    console.log(`wrote ${total} frames in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  } else {
    throw new Error("usage: render.mjs stills <t...> | frames");
  }
} finally {
  ws.close();
  browser.kill();
}
