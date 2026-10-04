import fs from "fs";
const [,, a, b, mode = "summary"] = process.argv;
const A = JSON.parse(fs.readFileSync(a)), B = JSON.parse(fs.readFileSync(b));
const out = [];
function cmp(kind, la, lb, keyOf, extra) {
  const ga = new Map(), gb = new Map();
  for (const x of la) (ga.get(keyOf(x)) || ga.set(keyOf(x), []).get(keyOf(x))).push(x);
  for (const x of lb) (gb.get(keyOf(x)) || gb.set(keyOf(x), []).get(keyOf(x))).push(x);
  let same = 0, moved = 0, miss = 0, ext = 0; const restA = [], restB = [];
  const srt = (l) => l.sort((p, q) => p.b[1] - q.b[1] || p.b[0] - q.b[0]);
  for (const [k, xs] of ga) {
    const ys = gb.get(k) || []; srt(xs); srt(ys);
    for (let i = 0; i < Math.max(xs.length, ys.length); i++) {
      const x = xs[i], y = ys[i];
      if (x && !y) { restA.push(x); continue; }
      if (!x && y) { restB.push(y); continue; }
      const d = x.b.map((v, j) => y.b[j] - v);
      if (kind === "TXT") d[2] = 0; // ширина инлайнового текста зависит от тега, не от вёрстки
      const ex = extra ? extra(x, y) : "";
      // у огромных декоративных фигур допуск шире: обводка выходит за коробку на пару пикселей
      const tol = Math.max(1, 0.0015 * Math.max(x.b[2], x.b[3]));
      if (d.some((v) => Math.abs(v) > tol) || ex) { moved++; out.push(`~ ${kind} ${k} ориг @${x.b} копия @${y.b} Δ${d}${ex}`); } else same++;
    }
  }
  for (const [k, ys] of gb) if (!ga.has(k)) for (const y of ys) restB.push(y);
  // остаток сводим по геометрии: в оригинале одноцветные иконки — встроенный svg без имени файла
  for (const x of restA) {
    // у встроенного svg обводка выходит за коробку, у картинки она внутри — сводим по центру
    const cx = (r) => [r.b[0] + r.b[2] / 2, r.b[1] + r.b[3] / 2];
    const i = restB.findIndex((y) => {
      const [ax, ay] = cx(x), [bx, by] = cx(y);
      return Math.abs(ax - bx) <= 1.5 && Math.abs(ay - by) <= 1.5 && Math.abs(x.b[2] - y.b[2]) <= 6 && Math.abs(x.b[3] - y.b[3]) <= 6;
    });
    if (i >= 0) { restB.splice(i, 1); same++; x.done = 1; }
  }
  for (const x of restA) if (!x.done) { miss++; out.push(`- ${kind} НЕТ в копии: ${keyOf(x)} @${x.b}`); }
  for (const y of restB) { ext++; out.push(`+ ${kind} лишний в копии: ${keyOf(y)} @${y.b}`); }
  return { same, moved, miss, ext };
}
const im = cmp("IMG", A.imgs, B.imgs, (x) => x.k);
const tx = cmp("TXT", A.texts, B.texts, (x) => x.t, (x, y) => {
  const e = [];
  if (x.f && Math.abs(x.f - y.f) > 0.3) e.push(`size ${x.f}→${y.f}`);
  const W = { thin: 100, "extra light": 200, extralight: 200, light: 300, regular: 400, medium: 500, "semi bold": 600, semibold: 600, bold: 700, "extra bold": 800, extrabold: 800, black: 900 };
  const sty = (x.ff.split(":")[1] || "").toLowerCase().replace(" italic", "");
  const ow = x.ff.includes(":") ? (+x.w !== 400 ? +x.w : W[sty] ?? 400) : +x.w;
  if (Math.abs(ow - +y.w) > 15) e.push(`weight ${ow}→${y.w}`);
  if (x.c !== y.c) e.push(`color ${x.c}→${y.c}`);
  const fa = x.ff.split(":")[0], fb = y.ff.replace(/^__/, "").replace(/_[0-9a-f]{6}$/, "").replace(/_/g, " ");
  if (fa !== fb && !(fa === "Open Sans" && /open.?sans/i.test(y.ff))) e.push(`font ${x.ff}→${y.ff}`);
  return e.length ? " [" + e.join("; ") + "]" : "";
});
console.log(`${A.name} vs ${B.name}: высота ${A.h}/${B.h}${A.h === B.h ? "" : " ✗"} | картинки: совп ${im.same}, сдвиг ${im.moved}, нет ${im.miss}, лишн ${im.ext} | тексты: совп ${tx.same}, отлич ${tx.moved}, нет ${tx.miss}, лишн ${tx.ext}`);
if (mode !== "summary") console.log(out.slice(0, +mode || 60).join("\n"));
