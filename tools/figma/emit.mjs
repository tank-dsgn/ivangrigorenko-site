// Обход дерева Figma и генерация JSX.
// Значения раскладки переносятся один в один, поэтому вместо классов
// используется inline-style: так видно, откуда взялось каждое число,
// и ничего не теряется на округлениях Tailwind.

import { absolutePosition, frameStyle, nodeAsset, sizing, textStyle } from "./nodes.mjs";

const VOID_TEXT_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "li"]);

/** Имя компонента из имени слоя в Figma */
export function componentName(name, fallback) {
  const cleaned = (name || fallback || "Section")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");
  const safe = /^[A-Za-z]/.test(cleaned) ? cleaned : `S${cleaned}`;
  return safe || fallback;
}

const esc = (s) =>
  s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

/** JS-объект стилей → строка для JSX */
function styleLiteral(style) {
  const entries = Object.entries(style).filter(([, v]) => v !== undefined && v !== null);
  if (!entries.length) return null;
  const body = entries
    .map(([k, v]) => `${k}: ${typeof v === "number" ? v : JSON.stringify(v)}`)
    .join(", ");
  return `{{ ${body} }}`;
}

function tagFor(node) {
  const t = node.accessibleHTMLTag;
  if (t && /^(h[1-6]|p|section|header|footer|nav|main|article|aside|ul|ol|li|span|button)$/.test(t)) return t;
  if (node.type === "TEXT") return "p";
  return "div";
}

export function createEmitter({ assets, assetMap = {}, indentUnit = "  " }) {
  /** Тяжёлые PNG переведены в WebP — подменяем имя файла по карте */
  const resolve = (url) => `/a/${assetMap[url] ?? url}`;
  const usedAssets = new Set();

  function emit(node, parent, depth) {
    const pad = indentUnit.repeat(depth);

    // Невидимые узлы в вёрстку не попадают
    if (node.visible === false) return "";

    const style = {
      ...(node.layoutPositioning === "ABSOLUTE" || !parent?.layoutMode ? absolutePosition(node) : {}),
      ...sizing(node, parent),
      ...frameStyle(node, assets, assetMap),
    };

    // Картинка или сгенерированный из Figma SVG — отдельный тег <img>
    const asset = nodeAsset(node, assets);
    if (asset) {
      asset.src = resolve(asset.src.replace("/a/", ""));
      usedAssets.add(asset.src);
      const s = styleLiteral(style);
      return `${pad}<img\n${pad}${indentUnit}src=${JSON.stringify(asset.src)}\n${pad}${indentUnit}alt=""\n${pad}${indentUnit}aria-hidden="true"\n${pad}${indentUnit}loading="lazy"\n${pad}${indentUnit}decoding="async"\n${s ? `${pad}${indentUnit}style=${s}\n` : ""}${pad}/>\n`;
    }

    if (node.type === "TEXT") {
      Object.assign(style, textStyle(node));
      const tag = tagFor(node);
      const s = styleLiteral(style);
      const text = (node.characters || "").replace(/\u00a0/g, " ");
      const lines = text.split("\n");
      const content =
        lines.length > 1
          ? lines.map((l, i) => (i === 0 ? `{\`${esc(l)}\`}` : `{"\\n"}{\`${esc(l)}\`}`)).join("")
          : `{\`${esc(text)}\`}`;
      const whitespace = lines.length > 1 ? " whiteSpace: \"pre-line\"," : "";
      const sFixed = whitespace && s ? s.replace("{{ ", `{{${whitespace} `) : s;
      return `${pad}<${tag}${sFixed ? ` style=${sFixed}` : ""}>${content}</${tag}>\n`;
    }

    // Если внутри есть абсолютно позиционированные дети — этот узел им точка отсчёта
    const visibleKids = (node.children || []).filter((c) => c.visible !== false);
    const hasAbsoluteKid = visibleKids.some(
      (c) => c.layoutPositioning === "ABSOLUTE" || !node.layoutMode
    );
    if (hasAbsoluteKid && !style.position) style.position = "relative";

    const kids = visibleKids.map((c) => emit(c, node, depth + 1)).join("");
    const tag = tagFor(node);
    const s = styleLiteral(style);

    if (!kids) return `${pad}<${tag}${s ? ` style=${s}` : ""} />\n`;
    return `${pad}<${tag}${s ? ` style=${s}` : ""}>\n${kids}${pad}</${tag}>\n`;
  }

  return { emit, usedAssets };
}
