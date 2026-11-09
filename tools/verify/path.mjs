// node tools/verify/path.mjs <page> <frame width> <regexp> [how many ancestors] — the path to a node in the expanded tree
import fs from "fs"; import zlib from "zlib";
import { createResolver } from "../figma/resolve.mjs";
const [,, slug, width, re, up = "7"] = process.argv;
const doc = JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL(`../figma/export/${slug}.json.gz`, import.meta.url))));
const { resolve } = createResolver(doc);
const page = doc.nodeById[doc.roots[0]];
const frame = page.children.map((id) => doc.nodeById[id]).find((n) => n?.isBreakpointFrame && Math.round(n.size.x) === +width);
const tree = resolve(frame.id);
const R = new RegExp(re); const f = (v) => (v == null ? "" : Math.round(v * 100) / 100);
const line = (n) => `${n.type} "${(n.name || "").slice(0, 22)}" id=${n.id} ${f(n.size?.x)}x${f(n.size?.y)}${n.layoutSize ? `(L ${f(n.layoutSize.x)}x${f(n.layoutSize.y)})` : ""} @${f(n.relativeTransform?.[0][2])},${f(n.relativeTransform?.[1][2])} ${n.visible === false ? "HIDDEN " : ""}${n.layoutMode || "-"} p=${n.primaryAxisSizingMode || "hug"} c=${n.counterAxisSizingMode || "hug"} gap=${f(n.itemSpacing)} pad=${f(n.paddingTop)},${f(n.paddingRight)},${f(n.paddingBottom)},${f(n.paddingLeft)} al=${n.primaryAxisAlignItems || ""}/${n.counterAxisAlignItems || ""} grow=${n.layoutGrow ?? ""} self=${n.layoutAlign || ""} pos=${n.layoutPositioning || ""} cons=${n.constraints ? n.constraints.horizontal + "/" + n.constraints.vertical : ""} wrap=${n.layoutWrap || ""}${n.characters ? ` «${n.characters.slice(0, 22)}» fs=${f(n.style?.fontSize)} ar=${n.textAutoResize} ${n.style?.fontFamily}:${n.style?.fontStyle}` : ""}${n.hash ? " #" + n.hash.slice(0, 8) : ""}${n.mainComponentId ? " main=" + n.mainComponentId : ""}${n.uniformScaleFactor ? " scale=" + f(n.uniformScaleFactor) : ""}${n.clipsContent ? " clip" : ""}`;
let found = 0; const want = +(process.env.N || 1); const skip = +(process.env.SKIP || 0);
(function walk(n, trail) {
  if (n.visible === false && !process.env.HIDDEN) return;
  if (found >= want + skip) return;
  if (R.test(n.name || "") || R.test(n.characters || "") || R.test(n.id || "") || R.test(n.hash || "")) {
    if (found++ >= skip) {
      console.log("—".repeat(20));
      const chain = [...trail, n].slice(-(+up));
      chain.forEach((x, i) => console.log(" ".repeat(i) + line(x)));
      if (process.env.KIDS) (function kids(x, d) { for (const c of x.children || []) { console.log(" ".repeat(chain.length + d) + line(c)); if (d < +process.env.KIDS - 1) kids(c, d + 1); } })(n, 0);
    }
    if (!process.env.DEEP) return;
  }
  for (const c of n.children || []) walk(c, [...trail, n]);
})(tree, []);
