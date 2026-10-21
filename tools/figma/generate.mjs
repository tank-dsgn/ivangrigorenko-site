#!/usr/bin/env node
// Генерация React-компонента страницы из выгрузки Figma Sites.
//
//   node tools/figma/generate.mjs <slug> --sections [--fetch] [--json <путь>] [--out <путь>]
//
// Страница в Figma — это три фрейма под брейкпоинты (Desktop 1280,
// Tablet 800, Mobile 375). Оригинал переключает их на клиенте; здесь
// они рендерятся все три и показываются по медиазапросам, как в Figma.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { createEmitter, componentName } from "./emit.mjs";
import { createResolver } from "./resolve.mjs";
import assetMap from "../../lib/asset-map.json" with { type: "json" };
import overrides from "./overrides.json" with { type: "json" };

const BUNDLE = "39c51217-69ff-4444-95d1-588378532cd6";
const ORIGIN = "https://ivangrigorenko.com";

/** Брейкпоинты сайта. Сопоставляем по ширине фрейма, а не по имени:
 *  у страниц меню фрейм называется иначе, а десктопного нет вовсе. */
const BREAKPOINTS = [
  { width: 375, label: "Mobile", className: "md:hidden" },
  { width: 800, label: "Tablet", className: "hidden md:block xl:hidden" },
  { width: 1280, label: "Desktop", className: "hidden xl:block" },
];

/**
 * Выгрузка страницы. Копии лежат в tools/figma/export — после переключения
 * домена на этот сайт оригинал на Figma Sites станет недоступен, и другого
 * источника не будет. `--fetch` перекачивает выгрузку с оригинала.
 */
async function loadPage(slug, jsonPath, fetchFresh) {
  if (jsonPath) return JSON.parse(await readFile(jsonPath, "utf8"));
  const saved = `tools/figma/export/${slug}.json.gz`;
  if (!fetchFresh) {
    try {
      return JSON.parse(gunzipSync(await readFile(saved)).toString("utf8"));
    } catch {}
  }
  const name = slug === "index" ? "_index" : slug;
  const res = await fetch(`${ORIGIN}/_json/${BUNDLE}/${name}.json`);
  if (!res.ok) throw new Error(`Не удалось скачать выгрузку ${name}: ${res.status}`);
  const text = await res.text();
  await mkdir(dirname(resolve(saved)), { recursive: true });
  await writeFile(saved, gzipSync(text, { level: 9 }));
  return JSON.parse(text);
}

/**
 * Карта «имя слоя → адрес ссылки».
 *
 * Интеракции в выгрузке висят на узлах внутри вариантов компонентов, куда
 * обход видимого дерева не заходит. Но имя слоя задаёт адрес однозначно
 * (`Frame 1000005967` — всегда /autotor-ru), поэтому связываем по имени.
 * Имена с несколькими разными адресами пропускаем: это соцсети и пункты
 * навигации, они собраны вручную в Header и Footer.
 */
function linkMapByName(nodeById) {
  const byName = new Map();
  for (const node of Object.values(nodeById)) {
    for (const i of node.interactions || []) {
      if (i.event?.interactionType !== "ON_CLICK") continue;
      for (const a of i.actions || []) {
        if (!a.connectionURL) continue;
        const name = node.name;
        if (!name) continue;
        const entry = byName.get(name);
        if (!entry) byName.set(name, { href: a.connectionURL, newTab: Boolean(a.openUrlInNewTab) });
        else if (entry.href !== a.connectionURL) entry.ambiguous = true;
      }
    }
  }
  const map = {};
  for (const [name, v] of byName) if (!v.ambiguous) map[name] = v;
  return map;
}

/**
 * Шапка и футер собраны вручную как переиспользуемые компоненты и не генерируются.
 *
 * Причина: у инстансов компонентов в выгрузке не применяются переопределения,
 * поэтому на русской странице навигация вышла бы английской («Work / About»).
 * Но их наличие в макете зависит от страницы и брейкпоинта, поэтому генератор
 * отдаёт эту карту — страница сама решает, что показывать.
 */
const SHELL_TAGS = new Set(["HEADER", "FOOTER"]);

/**
 * Разрезает страницу на секции: по файлу на секцию макета.
 * Внутри каждого файла — три брейкпоинта, как и раньше.
 */
async function emitSections({ slug, frames, resolveTree, emit, setBreakpoint, takeHoverCss, additions, shell, outDir }) {
  const dir = outDir || `components/generated/${slug}`;
  await mkdir(resolve(dir), { recursive: true });

  // секции берём с десктопа — он полный; на других брейкпоинтах порядок тот же
  const byIndex = new Map();
  for (const bp of BREAKPOINTS) {
    const frame = frames.find((f) => Math.round(f.size?.x) === bp.width);
    if (!frame) continue;
    const tree = resolveTree(frame.id);
    const visible = (tree.children || []).filter(
      (c) => c.visible !== false && !SHELL_TAGS.has(c.accessibleHTMLTag)
    );
    visible.forEach((node, i) => {
      if (!byIndex.has(i)) byIndex.set(i, { name: node.name, parts: [] });
      byIndex.get(i).parts.push({ bp, node, tree });
    });
  }

  const used = new Map();
  const files = [];
  for (const [i, sec] of byIndex) {
    let base = componentName(sec.name, `Section${i + 1}`);
    const n = (used.get(base) || 0) + 1;
    used.set(base, n);
    const comp = n > 1 ? `${base}${n}` : base;

    const body = sec.parts
      .map(({ bp, node, tree }) => {
        setBreakpoint(bp.width);
        return (
          `      {/* ${bp.label} */}\n` +
          `      <div className=${JSON.stringify(("figma-page " + bp.className).trim())}>\n` +
          emit(node, tree, 3) +
          `      </div>\n`
        );
      })
      .join("");

    // состояния «по наведению» этой секции: правила :hover с переходом
    const css = takeHoverCss();
    const styleTag = css
      ? `      <style>{\`\n${css.split("\n").map((l) => `        ${l}`).join("\n")}\n      \`}</style>\n`
      : "";

    const hasLink = body.includes("<Link ");
    const hasVariants = body.includes("<VariantGroup ");
    const imports =
      (hasLink ? `import Link from "next/link";\n` : "") +
      (hasVariants ? `import VariantGroup from "@/components/VariantGroup";\n` : "") +
      // свои компоненты, которыми генератор заменил блоки макета
      ["ProjectCard", "RelatedCard", "Button"]
        .filter((c) => body.includes(`<${c} `))
        .map((c) => `import ${c} from "@/components/${c}";\n`)
        .join("") +
      // без повторов: один компонент может прийти и из макета, и из своих вставок
      [...new Set(additions.filter((a) => body.includes(`<${a.component} `)).map((a) => `import ${a.component} from ${JSON.stringify(a.from)};\n`))]
        .filter((line) => !["ProjectCard", "RelatedCard", "Button"].some((c) => line.startsWith(`import ${c} `)))
        .join("");
    const src =
      `// Секция «${sec.name}» — сгенерировано из Figma.\n` +
      `// Перегенерировать: node tools/figma/generate.mjs ${slug} --sections\n\n` +
      (imports ? `${imports}\n` : "") +
      `export default function ${comp}() {\n  return (\n    <>\n${styleTag}${body}    </>\n  );\n}\n`;

    await writeFile(`${dir}/${comp}.tsx`, src, "utf8");
    files.push({ comp, name: sec.name });
  }

  const index =
    `// Порядок секций страницы ${slug}. Сгенерировано.\n\n` +
    files.map((f) => `import ${f.comp} from "./${f.comp}";`).join("\n") +
    `\n\nexport const shell = ${JSON.stringify(shell)} as const;\n\n` +
    `export default function Page() {\n  return (\n    <>\n` +
    files.map((f) => `      {/* ${f.name} */}\n      <${f.comp} />\n`).join("") +
    `    </>\n  );\n}\n`;
  await writeFile(`${dir}/index.tsx`, index, "utf8");

  console.log(`${slug}: ${files.length} секций → ${dir}/`);
  for (const f of files) console.log(`    ${f.comp}.tsx  «${f.name}»`);
}

/**
 * Шрифты макетов. Каждая страница дописывает в общий список те, что на ней
 * реально встретились; по нему tools/figma/fonts.mjs скачивает файлы
 * и собирает @font-face.
 */
const FONT_MANIFEST = "tools/figma/fonts.json";
async function recordFonts(used, table) {
  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(FONT_MANIFEST, "utf8"));
  } catch {}
  for (const key of used) if (table[key]) manifest[key] = table[key];
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(FONT_MANIFEST, JSON.stringify(sorted, null, 2) + "\n", "utf8");
  console.log(`  шрифты: ${[...used].sort().join(", ")}`);
}

/**
 * Данные для Storybook: с какими свойствами генератор вывел свои компоненты
 * (карточки проектов). Истории берут их отсюда — показывают то же, что сайт.
 */
async function recordComponents(slug, calls) {
  if (!calls.length) return;
  const byComponent = {};
  for (const c of calls) (byComponent[c.component] ||= []).push(c.props);
  const target = `stories/data/${slug}.json`;
  await mkdir(dirname(resolve(target)), { recursive: true });
  await writeFile(target, JSON.stringify(byComponent, null, 2) + "\n", "utf8");
  console.log(`  свои компоненты: ${Object.entries(byComponent).map(([k, v]) => `${k} ×${v.length}`).join(", ")} → ${target}`);
}

async function main() {
  const [, , slug, ...rest] = process.argv;
  if (!slug) {
    console.error("Укажите страницу, например: node tools/figma/generate.mjs eazychange-ru");
    process.exit(1);
  }
  const arg = (flag) => {
    const i = rest.indexOf(flag);
    return i === -1 ? null : rest[i + 1];
  };

  const doc = await loadPage(slug, arg("--json"), rest.includes("--fetch"));
  const { nodeById, assets, roots, fonts, guidToUrl } = doc;
  const page = nodeById[roots[0]];
  const { resolve: resolveRaw, resolveVariant } = createResolver(doc);

  // Свой текст вместо текста из макета: у названного узла дети заменяются абзацами,
  // оформление берётся у его первого текстового слоя.
  const rewrites = (overrides.paragraphs || []).filter((r) => r.pages.includes(slug));
  const rewrite = (node) => {
    if (!node) return node;
    const rule = rewrites.find((r) => r.into === node.name);
    const like = rule && (node.children || []).find((c) => c.type === "TEXT" && c.visible !== false);
    if (like) {
      node.children = rule.text.map((characters, i) => ({
        ...like,
        id: `${like.id}:p${i}`,
        name: characters.slice(0, 40),
        characters,
        characterStyleOverrides: [],
        styleOverrideTable: {},
        lineTypes: ["NONE"],
        lineIndentations: [0],
      }));
    } else {
      (node.children || []).forEach(rewrite);
    }
    return node;
  };
  const resolveTree = (id) => rewrite(resolveRaw(id));

  const frames = (page.children || [])
    .map((id) => nodeById[id])
    .filter((n) => n?.isBreakpointFrame);

  const lang = slug.endsWith("-en") || slug === "index" ? "en" : "ru";
  // свои компоненты поверх макета — только для этой страницы
  const additions = (overrides.additions || []).filter((a) => a.pages.includes(slug));
  const { emit, usedAssets, usedLinks, usedFonts, setBreakpoint, takeHoverCss, componentCalls } = createEmitter({
    additions,
    hoverRules: overrides.hover || {},
    textStyles: (overrides.textStyles || []).filter((r) => r.pages.includes(slug)),
    frameStyles: (overrides.frameStyles || []).filter((r) => r.pages.includes(slug)),
    imageSwaps: (overrides.imageSwaps || []).filter((r) => r.pages.includes(slug)),
    assets,
    fonts,
    guidToUrl,
    assetMap,
    linkByName: linkMapByName(nodeById),
    cardTargets: overrides.cards,
    lang,
    nodeById,
    resolveVariant,
  });

  const keepShell = rest.includes("--keep-shell");
  const shell = { header: {}, footer: {} };

  const parts = [];
  for (const bp of BREAKPOINTS) {
    const frame = frames.find((f) => Math.round(f.size?.x) === bp.width);
    if (!frame) continue;
    const tree = resolveTree(frame.id);
    const visible = (tree.children || []).filter((c) => c.visible !== false);
    shell.header[bp.label.toLowerCase()] = visible.some((c) => c.accessibleHTMLTag === "HEADER");
    shell.footer[bp.label.toLowerCase()] = visible.some((c) => c.accessibleHTMLTag === "FOOTER");
    // сам фрейм — это холст брейкпоинта, рендерим его детей
    const inner = (tree.children || [])
      .filter((c) => keepShell || !SHELL_TAGS.has(c.accessibleHTMLTag))
      .map((c) => emit(c, tree, 3))
      .join("");
    parts.push(
      `      {/* ${bp.label} — ${Math.round(frame.size.x)}px */}\n` +
        `      <div className=${JSON.stringify(("figma-page " + bp.className).trim())}>\n${inner}      </div>\n`
    );
  }

  // --sections: каждая секция макета уезжает в свой файл со своим именем.
  // Так страница читается как список секций, а не как одна простыня.
  if (rest.includes("--sections")) {
    await emitSections({ slug, frames, resolveTree, emit, setBreakpoint, takeHoverCss, additions, shell, outDir: arg("--out") });
    console.log(`  ассетов: ${usedAssets.size}, ссылок: ${usedLinks.size}`);
    await recordFonts(usedFonts, fonts);
    await recordComponents(slug, componentCalls);
    return;
  }

  const name = componentName(slug.replace(/-/g, " "), "Page");
  const needsLink = [...usedLinks].some((h) => h.startsWith("/"));
  const out =
    `// Сгенерировано из Figma: tools/figma/generate.mjs ${slug}\n` +
    `// Править руками не нужно — перезапустите генератор после правок в макете.\n\n` +
    (needsLink ? `import Link from "next/link";\n\n` : "") +
    `/** На каких брейкпоинтах макет показывает шапку и футер */\n` +
    `export const shell = ${JSON.stringify(shell)} as const;\n\n` +
    `export default function ${name}() {\n  return (\n    <>\n${parts.join("")}    </>\n  );\n}\n`;

  const target = arg("--out") || `components/generated/${slug}.tsx`;
  await mkdir(dirname(resolve(target)), { recursive: true });
  await writeFile(target, out, "utf8");

  console.log(`${slug}: ${frames.map((f) => f.name).join(", ")} → ${target}`);
  console.log(`  ассетов: ${usedAssets.size}, ссылок: ${usedLinks.size}, размер: ${(out.length / 1024).toFixed(0)} КБ`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
