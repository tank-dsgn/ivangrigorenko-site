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

  const { emit, usedAssets } = createEmitter({ assets });

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

  const name = componentName(slug.replace(/-/g, " "), "Page");
  const out =
    `// Сгенерировано из Figma: tools/figma/generate.mjs ${slug}\n` +
    `// Править руками не нужно — перезапустите генератор после правок в макете.\n\n` +
    `/** На каких брейкпоинтах макет показывает шапку и футер */\n` +
    `export const shell = ${JSON.stringify(shell)} as const;\n\n` +
    `export default function ${name}() {\n  return (\n    <>\n${parts.join("")}    </>\n  );\n}\n`;

  const target = arg("--out") || `components/generated/${slug}.tsx`;
  await mkdir(dirname(resolve(target)), { recursive: true });
  await writeFile(target, out, "utf8");

  console.log(`${slug}: ${frames.map((f) => f.name).join(", ")} → ${target}`);
  console.log(`  ассетов использовано: ${usedAssets.size}, размер файла: ${(out.length / 1024).toFixed(0)} КБ`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
