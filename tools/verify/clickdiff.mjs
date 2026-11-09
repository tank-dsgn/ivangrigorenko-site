// node tools/verify/clickdiff.mjs <page> <width> — blocks that switch on click: their states and how those differ
import fs from "fs"; import zlib from "zlib";
import { createResolver } from "../figma/resolve.mjs";
const [,, slug, width] = process.argv;
const doc = JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL(`../figma/export/${slug}.json.gz`, import.meta.url))));
const { resolve, resolveVariant } = createResolver(doc);
const nb = doc.nodeById;
const frame = nb[doc.roots[0]].children.map((id) => nb[id]).find((n) => n?.isBreakpointFrame && Math.round(n.size.x) === +width);
const tree = resolve(frame.id);
const f = (v) => (typeof v === "number" ? Math.round(v * 100) / 100 : v);
const clicks = (n, out = [], path = "") => { if (n.visible === false) return out; for (const i of n.interactions || []) if (i.event?.interactionType === "ON_CLICK") for (const a of i.actions || []) if (a.navigationType === "SWAP_STATE") out.push({ at: path + "/" + n.name, to: `${a.transitionNodeID.sessionID}:${a.transitionNodeID.localID}`, a }); for (const c of n.children || []) clicks(c, out, path + "/" + (n.name || "").slice(0, 14)); return out; };
const KEYS = ["size", "relativeTransform", "opacity", "visible", "characters", "hash"];
const brief = (k, v) => k === "size" ? `${f(v?.x)}x${f(v?.y)}` : k === "relativeTransform" ? (v ? `${f(v[0][2])},${f(v[1][2])}` : "") : JSON.stringify(typeof v === "string" ? v.slice(0, 24) : f(v));
function diff(a, b, path, out, d = 0) {
  for (const k of KEYS) { const x = brief(k, a[k]), y = brief(k, b[k]); if (x !== y) out.push(`${path} :: ${k}: ${x} → ${y}`); }
  const fa = JSON.stringify((a.fills || []).map((x) => [x.type, x.color, x.imageRef, x.visible])), fb = JSON.stringify((b.fills || []).map((x) => [x.type, x.color, x.imageRef, x.visible]));
  if (fa !== fb) out.push(`${path} :: different fill`);
  const ka = a.children || [], kb = b.children || [];
  if (ka.length !== kb.length) { out.push(`${path} :: children ${ka.length} → ${kb.length}`); return; }
  for (let i = 0; i < ka.length; i++) { if (ka[i].name !== kb[i].name || ka[i].type !== kb[i].type) { out.push(`${path} :: child ${i}: "${ka[i].name}" → "${kb[i].name}"`); continue; } diff(ka[i], kb[i], `${path}/${(ka[i].name || "").slice(0, 16)}`, out, d + 1); }
}
(function walk(n) {
  if (n.visible === false) return;
  if (n.type === "INSTANCE" && n.mainComponentId) {
    const set = nb[nb[n.mainComponentId]?.componentSetId];
    const ids = new Set(set?.children || []);
    const cs = clicks(n).filter((c) => ids.has(c.to));
    if (cs.length) {
      console.log(`== ${n.name} ${n.id} ${f(n.size.x)}x${f(n.size.y)} set "${set.name}": ${set.children.map((id) => nb[id].name).join(" | ")}`);
      console.log(`   now: ${nb[n.mainComponentId].name}`);
      for (const c of cs) { const { transitionNodeID, ...act } = c.a; console.log(`   click ${c.at.slice(-50)} → ${nb[c.to].name} ${JSON.stringify({ t: act.transitionType, d: act.transitionDuration, e: act.easingType })}`); }
      for (const id of [...new Set(cs.map((c) => c.to))].slice(0, +process.env.V || 1)) {
        const out = []; diff(n, resolveVariant(n, id), "", out);
        console.log(`   → ${nb[id].name}: ${out.length} differences`); console.log(out.slice(0, +process.env.L || 30).map((l) => "      " + l).join("\n"));
      }
      return;
    }
  }
  for (const c of n.children || []) walk(c);
})(tree);
