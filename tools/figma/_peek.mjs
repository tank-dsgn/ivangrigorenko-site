import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createResolver } from "./resolve.mjs";
const [slug, name, maxDepth = "3", width] = process.argv.slice(2);
const doc = JSON.parse(gunzipSync(readFileSync(`tools/figma/export/${slug}.json.gz`)).toString());
const { resolve } = createResolver(doc);
const page = doc.nodeById[doc.roots[0]];
for (const id of page.children) {
  const f = doc.nodeById[id];
  if (width && Math.round(f.size?.x) !== Number(width)) continue;
  const tree = resolve(id);
  let shown = 0;
  const walk = (n, d, inside) => {
    if (n.visible === false) return;
    const hit = n.name === name;
    if (hit && shown++ >= 2) return;
    const di = hit ? 0 : inside;
    if (di != null && di <= Number(maxDepth)) {
      const extra = [n.componentSetId && `set=${doc.nodeById[n.componentSetId]?.name}`, n.mainComponentId && `main=${doc.nodeById[n.mainComponentId]?.name}`, n.type === "TEXT" && JSON.stringify((n.characters || "").slice(0, 40)), n.cornerRadius && `r=${n.cornerRadius}`, (n.interactions || []).length && `int=${n.interactions.map(i => i.event?.interactionType + ">" + (i.actions || []).map(a => a.navigation || a.connectionType).join("+")).join(",")}`].filter(Boolean).join(" ");
      console.log(`${"  ".repeat(di)}${n.type} "${n.name}" ${Math.round(n.size?.x)}×${Math.round(n.size?.y)} ${extra}`);
    }
    for (const c of n.children || []) walk(c, d + 1, di != null ? di + 1 : null);
  };
  console.log(`--- frame ${f.name} ${Math.round(f.size.x)}`);
  walk(tree, 0, null);
}
