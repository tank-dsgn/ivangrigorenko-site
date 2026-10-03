// Обход дерева Figma и генерация JSX.
// Значения раскладки переносятся один в один, поэтому вместо классов
// используется inline-style: так видно, откуда взялось каждое число,
// и ничего не теряется на округлениях Tailwind.

import { absolutePosition, frameStyle, imageFill, nodeAsset, px, sizing, textStyle } from "./nodes.mjs";

/**
 * Клик по узлу в Figma задан интеракцией. Достаём из неё адрес:
 * URL — внешняя ссылка, INTERNAL_NODE — переход на другую страницу сайта.
 */
/** Первый текст внутри узла — по нему опознаём карточку проекта */
function firstText(node, depth = 0) {
  if (depth > 6 || !node) return null;
  if (node.characters) return node.characters.trim();
  for (const c of node.children || []) {
    const t = firstText(c, depth + 1);
    if (t) return t;
  }
  return null;
}

function linkOf(node, linkByName) {
  const byName = linkByName[node.name];
  if (byName) return { ...byName, internal: byName.href.startsWith("/") };
  for (const i of node.interactions || []) {
    if (i.event?.interactionType !== "ON_CLICK") continue;
    for (const a of i.actions || []) {
      const href = a.connectionURL;
      if (!href) continue;
      return { href, newTab: Boolean(a.openUrlInNewTab), internal: href.startsWith("/") };
    }
  }
  return null;
}

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

const round = (v) => Math.round(v * 100) / 100;

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

export function createEmitter({
  assets,
  assetMap = {},
  linkByName = {},
  textOverrides = {},
  cardTargets = {},
  lang = "ru",
  related = null,
  indentUnit = "  ",
}) {
  // Счётчик карточек «Смотрите также»: сбрасывается на каждый брейкпоинт
  let cardIndex = 0;
  const resetCards = () => { cardIndex = 0; };
  // В макете одна и та же подпись встречается в разном регистре
  // («Дизайн-Система» и «дизайн-система»), поэтому ищем без учёта регистра
  const lower = (obj) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
  const textMap = lower(textOverrides);
  const cardMap = lower(cardTargets);
  /** Тяжёлые PNG переведены в WebP — подменяем имя файла по карте */
  const resolve = (url) => `/a/${assetMap[url] ?? url}`;
  const usedAssets = new Set();
  const usedLinks = new Set();

  function emit(node, parent, depth, insideLink = false, card = null) {
    const pad = indentUnit.repeat(depth);

    // Невидимые узлы в вёрстку не попадают
    if (node.visible === false) return "";

    const style = {
      ...(node.layoutPositioning === "ABSOLUTE" || !parent?.layoutMode ? absolutePosition(node, parent) : {}),
      ...sizing(node, parent),
      ...frameStyle(node, assets, assetMap),
    };

    // Картинка или сгенерированный из Figma SVG — отдельный тег <img>
    const asset = nodeAsset(node, assets);
    if (asset) {
      asset.src = resolve(asset.src.replace("/a/", ""));
      usedAssets.add(asset.src);

      // У сгенерированных SVG свой размер: обводка и тень выходят за коробку узла.
      // Рисуем ассет в его собственном размере и центрируем в коробке —
      // иначе стрелки сплющиваются, а иконки тянутся не в свою пропорцию.
      const box = node.size || {};
      const own = asset.width && asset.height;
      if (own && (Math.abs(asset.width - (box.x ?? 0)) > 0.5 || Math.abs(asset.height - (box.y ?? 0)) > 0.5)) {
        const wrap = styleLiteral({ ...style, position: style.position ?? "relative" });
        const inner = styleLiteral({
          position: "absolute",
          left: px((box.x ?? 0) / 2 - asset.width / 2),
          top: px((box.y ?? 0) / 2 - asset.height / 2),
          width: px(asset.width),
          height: px(asset.height),
          maxWidth: "none",
        });
        return (
          `${pad}<span${wrap ? ` style=${wrap}` : ""}>\n` +
          `${pad}${indentUnit}<img src=${JSON.stringify(asset.src)} alt="" aria-hidden="true" loading="lazy" decoding="async" style=${inner} />\n` +
          `${pad}</span>\n`
        );
      }

      const s = styleLiteral(style);
      return `${pad}<img\n${pad}${indentUnit}src=${JSON.stringify(asset.src)}\n${pad}${indentUnit}alt=""\n${pad}${indentUnit}aria-hidden="true"\n${pad}${indentUnit}loading="lazy"\n${pad}${indentUnit}decoding="async"\n${s ? `${pad}${indentUnit}style=${s}\n` : ""}${pad}/>\n`;
    }

    if (node.type === "TEXT") {
      Object.assign(style, textStyle(node));
      const tag = tagFor(node);
      const s = styleLiteral(style);
      const raw = (node.characters || "").replace(/\u00a0/g, " ");
      const text = card?.label ?? textMap[raw.trim().toLowerCase()] ?? raw;
      const lines = text.split("\n");
      const content =
        lines.length > 1
          ? lines.map((l, i) => (i === 0 ? `{\`${esc(l)}\`}` : `{"\\n"}{\`${esc(l)}\`}`)).join("")
          : `{\`${esc(text)}\`}`;
      const whitespace = lines.length > 1 ? " whiteSpace: \"pre-line\"," : "";
      const sFixed = whitespace && s ? s.replace("{{ ", `{{${whitespace} `) : s;
      return `${pad}<${tag}${sFixed ? ` style=${sFixed}` : ""}>${content}</${tag}>\n`;
    }

    // Кадрированная заливка: картинку кладём отдельным тегом внутрь обрезающего блока,
    // потому что фоном нужный кусок не выразить
    let fill = imageFill(node, assets, assetMap);
    if (card && fill) {
      // картинка берётся из таблицы проектов и центрируется в окне карточки
      const boxW = node.size?.x ?? card.w;
      const boxH = node.size?.y ?? card.h;
      fill = {
        src: resolve(card.image),
        crop: {
          width: card.w,
          height: card.h,
          left: boxW / 2 - card.w / 2,
          top: boxH / 2 - card.h / 2,
        },
      };
    }
    let cropped = "";
    if (fill?.crop) {
      usedAssets.add(fill.src);
      style.position = style.position || "relative";
      style.overflow = "hidden";
      const c = fill.crop;
      const inner = `{{ position: "absolute", left: "${round(c.left)}px", top: "${round(c.top)}px", width: "${round(c.width)}px", height: "${round(c.height)}px", maxWidth: "none" }}`;
      cropped =
        `${indentUnit.repeat(depth + 1)}<img src=${JSON.stringify(fill.src)} alt="" aria-hidden="true" loading="lazy" decoding="async" style=${inner} />\n`;
    }

    // Если внутри есть абсолютно позиционированные дети — этот узел им точка отсчёта
    const visibleKids = (node.children || []).filter((c) => c.visible !== false);
    const hasAbsoluteKid = visibleKids.some(
      (c) => c.layoutPositioning === "ABSOLUTE" || !node.layoutMode
    );
    if (hasAbsoluteKid && !style.position) style.position = "relative";

    // вложенные ссылки недопустимы — если мы уже внутри <a>, детей не оборачиваем
    let link = insideLink ? null : linkOf(node, linkByName);
    if (node.name === "Card-projects-small" && related) {
      // состав блока зависит от страницы, а в выгрузке лежит набор мастер-компонента
      card = related[cardIndex++] || null;
    }
    if (!link && !insideLink && node.name === "Card-projects-small") {
      const slug = card?.slug ?? cardMap[(firstText(node) || "").toLowerCase()];
      if (slug) link = { href: `/${slug}-${lang}`, internal: true, newTab: false };
    }
    const kids =
      cropped +
      visibleKids.map((c) => emit(c, node, depth + 1, insideLink || Boolean(link), card)).join("");
    const s = styleLiteral(style);

    if (link) {
      usedLinks.add(link.href);
      const attrs = link.internal
        ? `href=${JSON.stringify(link.href)}`
        : `href=${JSON.stringify(link.href)}${link.newTab ? ' target="_blank" rel="noopener noreferrer"' : ""}`;
      const tagName = link.internal ? "Link" : "a";
      if (!kids) return `${pad}<${tagName} ${attrs}${s ? ` style=${s}` : ""} />\n`;
      return `${pad}<${tagName} ${attrs}${s ? ` style=${s}` : ""}>\n${kids}${pad}</${tagName}>\n`;
    }

    const tag = tagFor(node);
    if (!kids) return `${pad}<${tag}${s ? ` style=${s}` : ""} />\n`;
    return `${pad}<${tag}${s ? ` style=${s}` : ""}>\n${kids}${pad}</${tag}>\n`;
  }

  return { emit, usedAssets, usedLinks, resetCards };
}
