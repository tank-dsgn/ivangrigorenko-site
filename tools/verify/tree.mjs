import fs from "fs";
import { createResolver } from "../figma/resolve.mjs";
const [,, file, width, re, depth = "3"] = process.argv;
const doc = JSON.parse(file.endsWith(".gz") ? (await import("zlib")).gunzipSync(fs.readFileSync(file)).toString() : fs.readFileSync(file));
const { resolve } = createResolver(doc);
const page = doc.nodeById[doc.roots[0]];
const frame = page.children.map((id) => doc.nodeById[id]).find((n) => n?.isBreakpointFrame && Math.round(n.size.x) === +width);
const tree = resolve(frame.id);
const R = new RegExp(re);
const f = (v) => (v == null ? "" : Math.round(v * 100) / 100);
function show(n, d, max) {
  const t = n.relativeTransform;
  console.log(" ".repeat(d * 2) + `${n.type} "${(n.name || "").slice(0, 30)}" ${f(n.size?.x)}x${f(n.size?.y)}${n.layoutSize ? ` (layout ${f(n.layoutSize.x)}x${f(n.layoutSize.y)})` : ""} @${f(t?.[0][2])},${f(t?.[1][2])} ${n.visible === false ? "HIDDEN " : ""}${n.layoutMode || "-"} p=${n.primaryAxisSizingMode || "hug"} c=${n.counterAxisSizingMode || "hug"} gap=${f(n.itemSpacing)} pad=${f(n.paddingTop)},${f(n.paddingRight)},${f(n.paddingBottom)},${f(n.paddingLeft)} align=${n.primaryAxisAlignItems || ""}/${n.counterAxisAlignItems || ""} grow=${n.layoutGrow ?? ""} self=${n.layoutAlign || ""} pos=${n.layoutPositioning || ""} cons=${n.constraints ? n.constraints.horizontal + "/" + n.constraints.vertical : ""}${n.characters ? " «" + n.characters.slice(0, 25) + "» fs=" + f(n.style?.fontSize) + " lh=" + f(n.style?.lineHeightPx) + " ar=" + n.textAutoResize : ""}${n.hash ? " #" + n.hash.slice(0, 8) : ""}${n.uniformScaleFactor ? " scale=" + f(n.uniformScaleFactor) : ""}`);
  if (d < max) for (const c of n.children || []) show(c, d + 1, max);
}
let found = 0;
(function walk(n, parent) {
  if (found >= (+process.env.N || 1)) return;
  if (R.test(n.name || "") || R.test(n.characters || "") || R.test(n.id || "")) { found++; if (parent && process.env.UP) show(parent, 0, 0); show(n, 1, +depth + 1); return; }
  for (const c of n.children || []) walk(c, n);
})(tree, null);
