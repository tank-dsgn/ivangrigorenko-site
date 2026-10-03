#!/usr/bin/env node
// Генерация React-компонента страницы из выгрузки Figma Sites.
//
//   node tools/figma/generate.mjs <slug> [--json <путь>] [--out <путь>]
//
// Страница в Figma — это три фрейма под брейкпоинты (Desktop 1280,
// Tablet 800, Mobile 375). Оригинал переключает их на клиенте; здесь
// они рендерятся все три и показываются по медиазапросам, как в Figma.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createEmitter, componentName } from "./emit.mjs";
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

async function loadPage(slug, jsonPath) {
  if (jsonPath) return JSON.parse(await readFile(jsonPath, "utf8"));
  const name = slug === "index" ? "_index" : slug;
  const res = await fetch(`${ORIGIN}/_json/${BUNDLE}/${name}.json`);
  if (!res.ok) throw new Error(`Не удалось скачать выгрузку ${name}: ${res.status}`);
  return res.json();
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
 * Дети приходят списком id — собираем настоящее дерево.
 *
 * У инстансов компонентов дети получают синтетические id вида
 * `I<инстанс>;<узел компонента>`. Самого такого узла в выгрузке нет —
 * нужно взять последний сегмент, это id узла внутри мастер-компонента.
 */
function resolveTree(nodeById, id, depth = 0) {
  if (depth > 60) return null;
  const raw = nodeById[id] || nodeById[String(id).split(";").pop()];
  if (!raw) return null;
  const node = { ...raw };
  if (Array.isArray(raw.children)) {
    node.children = raw.children
      .map((c) => resolveTree(nodeById, c, depth + 1))
      .filter(Boolean);
  }
  return node;
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
async function emitSections({ slug, frames, nodeById, emit, resetCards, shell, outDir }) {
  const dir = outDir || `components/generated/${slug}`;
  await mkdir(resolve(dir), { recursive: true });

  // секции берём с десктопа — он полный; на других брейкпоинтах порядок тот же
  const byIndex = new Map();
  for (const bp of BREAKPOINTS) {
    const frame = frames.find((f) => Math.round(f.size?.x) === bp.width);
    if (!frame) continue;
    const tree = resolveTree(nodeById, frame.id);
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
        resetCards();
        return (
          `      {/* ${bp.label} */}\n` +
          `      <div className=${JSON.stringify(("figma-page " + bp.className).trim())}>\n` +
          emit(node, tree, 3) +
          `      </div>\n`
        );
      })
      .join("");

    const hasLink = body.includes("<Link ");
    const src =
      `// Секция «${sec.name}» — сгенерировано из Figma.\n` +
      `// Перегенерировать: node tools/figma/generate.mjs ${slug} --sections\n\n` +
      (hasLink ? `import Link from "next/link";\n\n` : "") +
      `export default function ${comp}() {\n  return (\n    <>\n${body}    </>\n  );\n}\n`;

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

  const doc = await loadPage(slug, arg("--json"));
  const { nodeById, assets, roots } = doc;
  const page = nodeById[roots[0]];

  const frames = (page.children || [])
    .map((id) => nodeById[id])
    .filter((n) => n?.isBreakpointFrame);

  const lang = slug.endsWith("-en") || slug === "index" ? "en" : "ru";
  const project = slug.replace(/-(ru|en)$/, "");

  // «Смотрите также»: все проекты, кроме текущего, в порядке из таблицы
  const related = (overrides.relatedOrder || [])
    .filter((p) => p !== project)
    .map((p) => {
      const r = overrides.related?.[p];
      return r ? { slug: p, label: r[lang], image: r.image, w: r.w, h: r.h } : null;
    })
    .filter(Boolean);
  const { emit, usedAssets, usedLinks, resetCards } = createEmitter({
    assets,
    assetMap,
    linkByName: linkMapByName(nodeById),
    // правки страницы идут поверх языковых
    textOverrides: { ...(overrides.text[lang] || {}), ...(overrides.pages?.[slug] || {}) },
    cardTargets: overrides.cards,
    lang,
    related: related.length ? related : null,
  });

  const keepShell = rest.includes("--keep-shell");
  const shell = { header: {}, footer: {} };

  const parts = [];
  for (const bp of BREAKPOINTS) {
    const frame = frames.find((f) => Math.round(f.size?.x) === bp.width);
    if (!frame) continue;
    const tree = resolveTree(nodeById, frame.id);
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
    await emitSections({ slug, frames, nodeById, emit, resetCards, shell, outDir: arg("--out") });
    console.log(`  ассетов: ${usedAssets.size}, ссылок: ${usedLinks.size}`);
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
