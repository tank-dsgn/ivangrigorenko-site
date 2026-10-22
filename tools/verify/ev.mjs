// node tools/verify/ev.mjs <url> <ширина> <файл.js|выражение> — выполнить код на странице и напечатать результат.
// SHOT=путь.png — заодно сохранить скриншот окна. PDF=путь.pdf — напечатать страницу в PDF (размер из @page).
import { spawn } from "child_process"; import fs from "fs"; import os from "os"; import path from "path";
const dir = path.dirname(new URL(import.meta.url).pathname);
const [,, url, widthArg, exprArg, waitArg] = process.argv;
const width = +widthArg; const height = +process.env.H || (width < 700 ? 812 : 900); const PORT = 9334; // H=1800 — высота окна для длинного скриншота
const expr = fs.existsSync(exprArg) ? fs.readFileSync(exprArg, "utf8") : exprArg;
const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${os.tmpdir()}/ig-verify-chrome2`, "--no-first-run", "--disable-extensions", "--hide-scrollbars", `--window-size=${width},${height}`, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (let i = 0; i < 100; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(200); }
  const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } else events.push(d); };
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url });
  for (let i = 0; i < 150 && !events.some((e) => e.method === "Page.loadEventFired"); i++) await sleep(100);
  await sleep(+(waitArg || 4000));
  // STEPS='[{"scroll":1300},{"move":[300,340]},{"click":[300,340]},{"wait":500}]' — настоящая мышь до выполнения кода
  for (const st of JSON.parse(process.env.STEPS || "[]")) {
    if (st.scroll != null) await send("Runtime.evaluate", { expression: `document.documentElement.style.scrollBehavior="auto";scrollTo(0,${st.scroll})` });
    if (st.move) await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: st.move[0], y: st.move[1], pointerType: "mouse" });
    // down — нажать и не отпускать (проверить :active)
    if (st.down) { await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: st.down[0], y: st.down[1] }); await send("Input.dispatchMouseEvent", { type: "mousePressed", x: st.down[0], y: st.down[1], button: "left", clickCount: 1 }); }
    if (st.click) {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: st.click[0], y: st.click[1], pointerType: "mouse" });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x: st.click[0], y: st.click[1], button: "left", clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: st.click[0], y: st.click[1], button: "left", clickCount: 1 });
    }
    if (st.key) { await send("Input.dispatchKeyEvent", { type: "keyDown", key: st.key, code: st.key, windowsVirtualKeyCode: st.key === "Escape" ? 27 : 13 }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: st.key, code: st.key }); }
    await sleep(st.wait ?? 400);
  }
  const r = await send("Runtime.evaluate", { expression: `(async()=>{${expr}})()`, awaitPromise: true, returnByValue: true });
  const v = r.result?.result?.value;
  console.log(typeof v === "string" ? v : JSON.stringify(v ?? r, null, 1));
  if (process.env.SHOT) { const s = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(process.env.SHOT, Buffer.from(s.result.data, "base64")); }
  if (process.env.PDF) { const p = await send("Page.printToPDF", { preferCSSPageSize: true, printBackground: true }); fs.writeFileSync(process.env.PDF, Buffer.from(p.result.data, "base64")); }
} finally { chrome.kill(); }
