// node tools/verify/behaviors.mjs <страница> <ширина фрейма> — какие узлы видимого дерева несут поведение
import fs from "fs"; import zlib from "zlib";
import { createResolver } from "../figma/resolve.mjs";
const [,, slug, width] = process.argv;
const doc = JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL(`../figma/export/${slug}.json.gz`, import.meta.url))));
const { resolve } = createResolver(doc);
const page = doc.nodeById[doc.roots[0]];
const frame = page.children.map((id) => doc.nodeById[id]).find((n) => n?.isBreakpointFrame && Math.round(n.size.x) === +width);
const tree = resolve(frame.id);
const rows = [];
(function walk(n, path, y) {
  if (n.visible === false) return;
  const b = n.behaviors;
  if (b) {
    const kinds = Object.entries(b).filter(([k, v]) => (Array.isArray(v) ? v.length : v)).map(([k, v]) => k === "appear" ? `appear(dy=${v.enterState?.transform?.m12},s=${v.enterState?.transform?.m00},op=${v.enterState?.opacity},${v.enterTransition?.easingType},${v.enterTransition?.transitionDuration}s,delay=${v.enterTransition?.delay},once=${v.playsOnce},trig=${v.trigger})` : k === "scrollParallax" ? `parallax(${v.speed},${v.axis},page=${v.relativeToPage})` : `code(${v.map((c) => JSON.stringify(c.assignments)).join()})`);
    if (kinds.length) rows.push(`${path.slice(-2).join(" > ")} > ${n.type} "${(n.name || "").slice(0, 28)}" ${Math.round(n.size?.x)}x${Math.round(n.size?.y)}${n.hash ? " #" + n.hash.slice(0, 8) : ""} :: ${kinds.join(" ")}`);
  }
  for (const c of n.children || []) walk(c, [...path, (n.name || "").slice(0, 18)]);
})(tree, []);
console.log(rows.length); console.log(rows.join("\n"));
