#!/usr/bin/env node
// Шрифты макетов в кейсах: SF Pro в экранах приложения, Inter в дизайн-системе и т.д.
//
//   node tools/figma/fonts.mjs
//
// Берёт список из tools/figma/fonts.json (его пополняет generate.mjs), скачивает
// те же файлы, что отдаёт оригинал, в public/fonts и пишет app/figma-fonts.css.
// Open Sans сюда не входит — это основной шрифт сайта, он подключён в app/layout.tsx.

import { readFile, writeFile, mkdir, access } from "node:fs/promises";

const ORIGIN = "https://ivangrigorenko.com";
const OUT_DIR = "public/fonts";
const CSS = "app/figma-fonts.css";

const manifest = JSON.parse(await readFile("tools/figma/fonts.json", "utf8"));
await mkdir(OUT_DIR, { recursive: true });

const exists = (p) => access(p).then(() => true, () => false);

async function download(url, name) {
  const target = `${OUT_DIR}/${name}`;
  if (await exists(target)) return target;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  await writeFile(target, Buffer.from(await res.arrayBuffer()));
  return target;
}

/** Формат по первым байтам: пользовательские шрифты лежат без расширения */
function formatOf(buf) {
  const tag = buf.subarray(0, 4).toString("latin1");
  if (tag === "wOF2") return ["woff2", "woff2"];
  if (tag === "wOFF") return ["woff", "woff"];
  if (tag === "OTTO") return ["otf", "opentype"];
  return ["ttf", "truetype"];
}

// Несколько начертаний вариативного шрифта — это один файл, правило нужно одно
const faces = new Map();
for (const [key, f] of Object.entries(manifest)) {
  const family = key.split(":")[0];
  if (family === "Open Sans") continue;
  const variable = (f.variationAxes || []).some((a) => a.tag === "wght");
  const id = `${family}|${f.id}`;
  if (!faces.has(id)) faces.set(id, { family, font: f, variable });
}

let css = "/* Сгенерировано: node tools/figma/fonts.mjs. Шрифты макетов в кейсах. */\n";
for (const { family, font, variable } of faces.values()) {
  const weight = variable ? "1 1000" : font.weight;
  const style = font.italic ? "italic" : "normal";
  const head = `  font-family: "${family}";\n  font-style: ${style};\n  font-weight: ${weight};\n  font-display: swap;\n`;

  if (font.source === 1 && font.subsets) {
    for (const sub of font.subsets.subsetMappings) {
      await download(`${ORIGIN}${font.subsets.baseUrl}${sub.file}`, sub.file);
      css += `\n@font-face {\n${head}  src: url("/fonts/${sub.file}") format("woff2");\n  unicode-range: ${sub.unicodeRange};\n}\n`;
    }
  } else {
    const res = await fetch(`${ORIGIN}/_user_fonts/v1/${font.id}`);
    if (!res.ok) throw new Error(`${family}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const [ext, format] = formatOf(buf);
    const name = `${family.replace(/\s+/g, "")}-${font.weight}${font.italic ? "i" : ""}.${ext}`;
    await writeFile(`${OUT_DIR}/${name}`, buf);
    css += `\n@font-face {\n${head}  src: url("/fonts/${name}") format("${format}");\n}\n`;
  }
  console.log(`${family} ${weight}${font.italic ? " italic" : ""}`);
}
await writeFile(CSS, css, "utf8");
console.log(`→ ${CSS}`);
