// node tools/verify/near.mjs <страница> <ширина> <y0> <y1> — что стоит в полосе страницы у оригинала и у копии
import fs from "fs";
const [,, page, w, y0, y1] = process.argv;
for (const side of ["orig", "copy"]) {
  const d = JSON.parse(fs.readFileSync(new URL(`.snap/${side}-${page}-${w}.json`, import.meta.url)));
  const rows = [
    ...d.texts.map((t) => ({ y: t.b[1], s: `T @${t.b} f=${t.f} lh=${t.lh} w=${t.w} ${t.ff} «${t.t.slice(0, 40)}»` })),
    ...d.imgs.map((t) => ({ y: t.b[1], s: `I @${t.b} ${t.k}` })),
  ].filter((r) => r.y >= +y0 && r.y <= +y1).sort((a, b) => a.y - b.y);
  console.log(`== ${side}`); for (const r of rows) console.log(r.s);
}
