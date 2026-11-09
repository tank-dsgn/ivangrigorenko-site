// Snapshots of the original and the copy for comparison: images and text with coordinates.
//
//   node tools/verify/snap.mjs <width> <page> [<page>...]
//   node tools/verify/diff.mjs tools/verify/.snap/orig-pot-ru-1440.json tools/verify/.snap/copy-pot-ru-1440.json 60
//
// The copy must be running on localhost:3000. ONLY=copy retakes the copy only.
// COPY_ORIGIN=https://ivangrigorenko-site.vercel.app checks the deployed site.
// Needs Google Chrome: it is started headless, with its own temporary profile.
import { spawn } from "child_process"; import fs from "fs"; import os from "os"; import path from "path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const [,, widthArg, ...pages] = process.argv;
const width = +widthArg; const height = width < 700 ? 812 : 900;
const only = process.env.ONLY; // orig | copy
const PORT = 9333;
fs.mkdirSync(`${dir}/.snap`, { recursive: true });
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${os.tmpdir()}/ig-verify-chrome`,
  "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--hide-scrollbars", `--window-size=${width},${height}`, "about:blank",
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function ready() { for (let i = 0; i < 100; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) return; } catch {} await sleep(200); } throw new Error("chrome did not come up"); }
async function session(url) {
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else events.push(d); };
  // no command waits longer than 90 seconds: one stuck page must not hang the whole comparison
  const send = (method, params = {}) => Promise.race([
    new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }),
    new Promise((r) => setTimeout(() => r({ timeout: method }), 90000).unref()),
  ]);
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  for (let i = 0; i < 150 && !events.some((e) => e.method === "Page.loadEventFired"); i++) await sleep(100);
  return { send, close: async () => { ws.close(); await fetch(`http://127.0.0.1:${PORT}/json/close/${t.id}`); } };
}
const code = fs.readFileSync(`${dir}/collect.js`, "utf8");
try {
  await ready();
  for (const page of pages) {
    for (const [side, origin, wait] of [["orig", "https://ivangrigorenko.com", 5000], ["copy", process.env.COPY_ORIGIN || "http://localhost:3000", process.env.COPY_ORIGIN ? 4000 : 1500]]) {
      if (only && only !== side) continue;
      const name = `${side}-${page}-${width}`;
      const s = await session(`${origin}/${page === "index" ? "" : page}`);
      await sleep(wait);
      await s.send("Runtime.evaluate", { expression: code });
      const r = await s.send("Runtime.evaluate", { expression: `window.__snap(${JSON.stringify(name)})`, awaitPromise: true, returnByValue: true });
      const val = r.result?.result?.value;
      if (!val) { console.log(name, "ERROR", JSON.stringify(r).slice(0, 300)); } else { fs.writeFileSync(`${dir}/.snap/${name}.json`, val); const d = JSON.parse(val); console.log(name, `w=${d.w} h=${d.h} imgs=${d.imgs.length} texts=${d.texts.length}`); }
      await s.close();
    }
  }
} finally { chrome.kill(); }
