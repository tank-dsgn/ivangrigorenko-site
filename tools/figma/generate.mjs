#!/usr/bin/env node
// Generates a page's React component from the Figma Sites export.
//
//   node tools/figma/generate.mjs <slug> --sections [--fetch] [--json <path>] [--out <path>]
//
// A page in Figma is three frames, one per breakpoint: Desktop 1280, Tablet
// 800, Mobile 375. The original switches between them on the client; here all
// three are rendered and shown by media query, as in Figma.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { createEmitter, componentName } from "./emit.mjs";
import { createResolver } from "./resolve.mjs";
import assetMap from "../../lib/asset-map.json" with { type: "json" };
import overrides from "./overrides.json" with { type: "json" };

const BUNDLE = "39c51217-69ff-4444-95d1-588378532cd6";
const ORIGIN = "https://ivangrigorenko.com";

/** The site's breakpoints. Matched by frame width rather than by name: the
 *  menu pages name their frame differently and have no desktop one at all. */
const BREAKPOINTS = [
  { width: 375, label: "Mobile", className: "md:hidden" },
  { width: 800, label: "Tablet", className: "hidden md:block xl:hidden" },
  { width: 1280, label: "Desktop", className: "hidden xl:block" },
];

/**
 * The page export. Copies live in tools/figma/export: once the domain points
 * at this site the original on Figma Sites becomes unreachable and there is no
 * other source. `--fetch` pulls the export from the original again.
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
  if (!res.ok) throw new Error(`Could not download the export for ${name}: ${res.status}`);
  const text = await res.text();
  await mkdir(dirname(resolve(saved)), { recursive: true });
  await writeFile(saved, gzipSync(text, { level: 9 }));
  return JSON.parse(text);
}

/**
 * A map from layer name to link URL.
 *
 * In the export the interactions hang on nodes inside component variants,
 * where a walk of the visible tree never reaches. A layer name does pin the
 * URL down, though — `Frame 1000005967` is always /autotor-ru — so they are
 * matched by name. Names carrying more than one URL are skipped: those are the
 * social links and the navigation items, both hand-built in Header and
 * Footer.
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
 * The header and the footer are hand-built reusable components and are not generated.
 *
 * The reason: component instances in the export come without their overrides
 * applied, so the navigation on a Russian page would come out in English.
 * Whether they appear at all still depends on the page and the breakpoint, so
 * the generator hands over this map and the page decides what to show.
 */
const SHELL_TAGS = new Set(["HEADER", "FOOTER"]);

/**
 * Cuts the page into sections, one file per section of the design file.
 * Each file still holds all three breakpoints.
 */
async function emitSections({ slug, frames, resolveTree, emit, setBreakpoint, takeHoverCss, additions, shell, outDir }) {
  const dir = outDir || `components/generated/${slug}`;
  await mkdir(resolve(dir), { recursive: true });

  // sections are taken from desktop, which is the complete one; the other breakpoints keep the same order
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

    // this section's hover states: :hover rules with a transition
    const css = takeHoverCss();
    const styleTag = css
      ? `      <style>{\`\n${css.split("\n").map((l) => `        ${l}`).join("\n")}\n      \`}</style>\n`
      : "";

    const hasLink = body.includes("<Link ");
    const hasVariants = body.includes("<VariantGroup ");
    const imports =
      (hasLink ? `import Link from "next/link";\n` : "") +
      (hasVariants ? `import VariantGroup from "@/components/VariantGroup";\n` : "") +
      // the hand-written components the generator put in place of design-file blocks
      ["ProjectCard", "RelatedCard", "Button"]
        .filter((c) => body.includes(`<${c} `))
        .map((c) => `import ${c} from "@/components/${c}";\n`)
        .join("") +
      // no duplicates: one component can arrive both from the design file and from the insertions
      [...new Set(additions.filter((a) => body.includes(`<${a.component} `)).map((a) => `import ${a.component} from ${JSON.stringify(a.from)};\n`))]
        .filter((line) => !["ProjectCard", "RelatedCard", "Button"].some((c) => line.startsWith(`import ${c} `)))
        .join("");
    const src =
      `// Section "${sec.name}" — generated from Figma.\n` +
      `// To regenerate: node tools/figma/generate.mjs ${slug} --sections\n\n` +
      (imports ? `${imports}\n` : "") +
      `export default function ${comp}() {\n  return (\n    <>\n${styleTag}${body}    </>\n  );\n}\n`;

    await writeFile(`${dir}/${comp}.tsx`, src, "utf8");
    files.push({ comp, name: sec.name });
  }

  const index =
    `// The order of the sections on ${slug}. Generated.\n\n` +
    files.map((f) => `import ${f.comp} from "./${f.comp}";`).join("\n") +
    `\n\nexport const shell = ${JSON.stringify(shell)} as const;\n\n` +
    `export default function Page() {\n  return (\n    <>\n` +
    files.map((f) => `      {/* ${f.name} */}\n      <${f.comp} />\n`).join("") +
    `    </>\n  );\n}\n`;
  await writeFile(`${dir}/index.tsx`, index, "utf8");

  console.log(`${slug}: ${files.length} sections → ${dir}/`);
  for (const f of files) console.log(`    ${f.comp}.tsx  «${f.name}»`);
}

/**
 * The design-file fonts. Each page adds the ones it actually used to a shared
 * list, from which tools/figma/fonts.mjs downloads the files and assembles the
 * @font-face rules.
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
  console.log(`  fonts: ${[...used].sort().join(", ")}`);
}

/**
 * Data for Storybook: the props the generator gave the hand-written components,
 * the project cards above all. The stories read them from here, so they show
 * exactly what the site shows.
 */
async function recordComponents(slug, calls) {
  if (!calls.length) return;
  const byComponent = {};
  for (const c of calls) (byComponent[c.component] ||= []).push(c.props);
  const target = `stories/data/${slug}.json`;
  await mkdir(dirname(resolve(target)), { recursive: true });
  await writeFile(target, JSON.stringify(byComponent, null, 2) + "\n", "utf8");
  console.log(`  hand-written components: ${Object.entries(byComponent).map(([k, v]) => `${k} ×${v.length}`).join(", ")} → ${target}`);
}

async function main() {
  const [, , slug, ...rest] = process.argv;
  if (!slug) {
    console.error("Name a page, for example: node tools/figma/generate.mjs eazychange-ru");
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

  // Own text in place of the design file's: the named node's children are
  // replaced with paragraphs, styled after its first text layer.
  const rewrites = (overrides.paragraphs || []).filter((r) => r.pages.includes(slug));
  // Correcting a phrase inside text from the design file (overrides.json →
  // textFixes), without touching Figma. Per-character styles are stretched over
  // the new phrase, which takes the style of the old one's first letter.
  const fixes = (overrides.textFixes || []).filter((r) => r.pages.includes(slug));
  // the fills in the text layer's parent, for nearFill
  const parentOf = new Map();
  const hex = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
  const fillsNear = (node) => {
    const out = new Set();
    const walk = (n) => {
      for (const f of n.fills || []) if (f.type === "SOLID" && f.visible !== false && f.color) out.add(hex(f.color));
      (n.children || []).forEach((c) => c !== node && walk(c));
    };
    const p = parentOf.get(node);
    if (p) walk(p);
    return out;
  };
  const fixText = (node) => {
    for (const { find, replace, exact, nearFill } of fixes) {
      // exact matches the layer's whole text, for short captions such as
      // "2 month"; nearFill matches only when a fill of that colour sits beside
      // the layer, in its parent, so a palette caption is corrected on the one
      // swatch that is meant
      if (exact) {
        if (node.characters === find && (!nearFill || fillsNear(node).has(nearFill.toUpperCase()))) node.characters = replace;
        continue;
      }
      let at = node.characters.indexOf(find);
      while (at !== -1) {
        node.characters = node.characters.slice(0, at) + replace + node.characters.slice(at + find.length);
        // a copy: the style array is shared by the layer's copies across breakpoints
        const o = node.characterStyleOverrides?.slice();
        if (o?.length > at) {
          o.splice(at, Math.min(find.length, o.length - at), ...Array(replace.length).fill(o[at]));
          node.characterStyleOverrides = o;
        }
        at = node.characters.indexOf(find, at + replace.length);
      }
    }
  };
  const rewrite = (node) => {
    if (!node) return node;
    if (node.type === "TEXT" && typeof node.characters === "string" && fixes.length) fixText(node);
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
  const link = (n) => (n.children || []).forEach((c) => { parentOf.set(c, n); link(c); });
  const resolveTree = (id) => {
    const tree = resolveRaw(id);
    link(tree);
    return rewrite(tree);
  };
  // the other component states, themes and carousel slides, get the same text corrections
  const resolveVariantFixed = (node, id) => {
    const tree = resolveVariant(node, id);
    if (tree) { link(tree); rewrite(tree); }
    return tree;
  };

  const frames = (page.children || [])
    .map((id) => nodeById[id])
    .filter((n) => n?.isBreakpointFrame);

  const lang = slug.endsWith("-en") || slug === "index" ? "en" : "ru";
  // hand-written components on top of the design file, for this page only
  const additions = (overrides.additions || []).filter((a) => a.pages.includes(slug));
  const { emit, usedAssets, usedLinks, usedFonts, setBreakpoint, takeHoverCss, componentCalls } = createEmitter({
    additions,
    hoverRules: overrides.hover || {},
    textStyles: (overrides.textStyles || []).filter((r) => r.pages.includes(slug)),
    hoverWords: (overrides.hoverWords || []).filter((r) => r.pages.includes(slug)),
    frameStyles: (overrides.frameStyles || []).filter((r) => r.pages.includes(slug)),
    imageSwaps: (overrides.imageSwaps || []).filter((r) => r.pages.includes(slug)),
    videos: overrides.videos || {},
    hrefs: overrides.hrefs || {},
    assets,
    fonts,
    guidToUrl,
    assetMap,
    linkByName: linkMapByName(nodeById),
    cardTargets: overrides.cards,
    lang,
    nodeById,
    resolveVariant: resolveVariantFixed,
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
    // the frame itself is the breakpoint's canvas, so its children are rendered
    const inner = (tree.children || [])
      .filter((c) => keepShell || !SHELL_TAGS.has(c.accessibleHTMLTag))
      .map((c) => emit(c, tree, 3))
      .join("");
    parts.push(
      `      {/* ${bp.label} — ${Math.round(frame.size.x)}px */}\n` +
        `      <div className=${JSON.stringify(("figma-page " + bp.className).trim())}>\n${inner}      </div>\n`
    );
  }

  // --sections puts every section of the design file into its own named file,
  // so the page reads as a list of sections rather than one sheet.
  if (rest.includes("--sections")) {
    // the hover and carousel styles left over from building the whole page
    // above are not wanted here: they settled into the first section, whose
    // elements never use them
    takeHoverCss();
    await emitSections({ slug, frames, resolveTree, emit, setBreakpoint, takeHoverCss, additions, shell, outDir: arg("--out") });
    console.log(`  assets: ${usedAssets.size}, links: ${usedLinks.size}`);
    await recordFonts(usedFonts, fonts);
    await recordComponents(slug, componentCalls);
    return;
  }

  const name = componentName(slug.replace(/-/g, " "), "Page");
  const needsLink = [...usedLinks].some((h) => h.startsWith("/"));
  const out =
    `// Generated from Figma: tools/figma/generate.mjs ${slug}\n` +
    `// Not for hand-editing: rerun the generator after changing the design file.\n\n` +
    (needsLink ? `import Link from "next/link";\n\n` : "") +
    `/** The breakpoints at which the design file shows the header and the footer */\n` +
    `export const shell = ${JSON.stringify(shell)} as const;\n\n` +
    `export default function ${name}() {\n  return (\n    <>\n${parts.join("")}    </>\n  );\n}\n`;

  const target = arg("--out") || `components/generated/${slug}.tsx`;
  await mkdir(dirname(resolve(target)), { recursive: true });
  await writeFile(target, out, "utf8");

  console.log(`${slug}: ${frames.map((f) => f.name).join(", ")} → ${target}`);
  console.log(`  assets: ${usedAssets.size}, links: ${usedLinks.size}, size: ${(out.length / 1024).toFixed(0)} KB`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
