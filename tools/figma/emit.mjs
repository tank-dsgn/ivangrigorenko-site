// Обход дерева Figma и генерация JSX.
// Значения раскладки переносятся один в один, поэтому вместо классов
// используется inline-style: так видно, откуда взялось каждое число,
// и ничего не теряется на округлениях Tailwind.

import { absolutePosition, assetBox, assetBoxCss, fontKey, frameStyle, hugs, imageFill, nodeAsset, px, rotation, sizing, spanStyle, textStyle } from "./nodes.mjs";

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

function linkOf(node, linkByName, guidToUrl = {}) {
  // своя интеракция узла точнее: в ней уже учтены переопределения инстанса
  for (const i of node.interactions || []) {
    if (i.event?.interactionType !== "ON_CLICK") continue;
    for (const a of i.actions || []) {
      const t = a.transitionNodeID;
      const href =
        a.connectionURL ||
        (a.navigationType === "NAVIGATE" && t ? guidToUrl[`${t.sessionID}:${t.localID}`] : null);
      if (!href) continue;
      return { href, newTab: Boolean(a.openUrlInNewTab), internal: href.startsWith("/") };
    }
  }
  const byName = linkByName[node.name];
  if (byName) return { ...byName, internal: byName.href.startsWith("/") };
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
  cardTargets = {},
  lang = "ru",
  nodeById = {},
  fonts = {},
  guidToUrl = {},
  additions = [],
  resolveVariant = () => null,
  indentUnit = "  ",
}) {
  let usedVariants = false;

  const nodeId = (ref) =>
    ref && typeof ref === "object" ? `${ref.sessionID}:${ref.localID}` : ref;

  /**
   * Переключение состояния у самого узла: клик (карусель, тумблер темы)
   * или наведение (кнопка, карточка). Возвращает цель и длительность перехода.
   */
  function swapOf(node, event) {
    for (const i of node.interactions || []) {
      if (i.event?.interactionType !== event) continue;
      for (const a of i.actions || []) {
        if (a.navigationType !== "SWAP_STATE" || !a.transitionNodeID) continue;
        // без типа перехода и с INSTANT_TRANSITION состояние меняется мгновенно
        const animated = a.transitionType && a.transitionType !== "INSTANT_TRANSITION";
        return { to: nodeId(a.transitionNodeID), ms: animated ? Math.round((a.transitionDuration || 0) * 1000) : 0 };
      }
    }
    return null;
  }

  /** Все переключения в поддереве, ведущие в варианты набора */
  function swapsInto(node, targets, out = [], depth = 0) {
    if (!node || depth > 40 || node.visible === false) return out;
    for (const event of ["ON_CLICK", "ON_HOVER"]) {
      const sw = swapOf(node, event);
      if (sw && targets.has(sw.to)) out.push({ ...sw, event });
    }
    for (const c of node.children || []) swapsInto(c, targets, out, depth + 1);
    return out;
  }

  /**
   * Инстанс, у которого есть варианты с переключением, — интерактивный блок:
   * карусель, тумблер темы, кнопка с состоянием наведения.
   * Берём только те варианты, до которых можно дойти из исходного.
   */
  function variantGroup(node) {
    if (node.type !== "INSTANCE" || !node.mainComponentId) return null;
    const master = nodeById[node.mainComponentId];
    const set = master?.componentSetId && nodeById[master.componentSetId];
    const ids = set?.children || [];
    if (ids.length < 2) return null;
    const targets = new Set(ids);

    // каждый вариант разворачиваем как этот же инстанс: так на него ложатся
    // те же переопределения (перевод текста, размеры под брейкпоинт)
    const trees = new Map();
    const tree = (id) => {
      if (!trees.has(id)) trees.set(id, id === node.mainComponentId ? node : resolveVariant(node, id));
      return trees.get(id);
    };
    const reach = (events) => {
      const seen = new Set([node.mainComponentId]);
      const queue = [node.mainComponentId];
      while (queue.length) {
        const t = tree(queue.shift());
        if (!t) continue;
        for (const sw of swapsInto(t, targets)) {
          if (!events.includes(sw.event) || seen.has(sw.to)) continue;
          seen.add(sw.to);
          queue.push(sw.to);
        }
      }
      return seen;
    };
    // до варианта, куда ведёт только наведение, очередь доходит не сразу —
    // его можно не рисовать, пока у пользователя нет мыши
    const byClick = reach(["ON_CLICK"]);
    const variants = ids
      .filter((id) => reach(["ON_CLICK", "ON_HOVER"]).has(id) && tree(id))
      .map((id) => ({ id, tree: tree(id), info: { hoverOnly: !byClick.has(id) } }));
    if (variants.length < 2) return null;
    return { variants, initial: node.mainComponentId, targets };
  }
  // В макете одна и та же подпись встречается в разном регистре
  // («Дизайн-Система» и «дизайн-система»), поэтому ищем без учёта регистра
  const cardMap = Object.fromEntries(
    Object.entries(cardTargets).map(([k, v]) => [k.toLowerCase(), v])
  );
  /** Тяжёлые PNG переведены в WebP — подменяем имя файла по карте */
  const resolve = (url) => `/a/${assetMap[url] ?? url}`;
  const usedAssets = new Set();
  const usedLinks = new Set();
  const usedFonts = new Set();

  // ширина брейкпоинта, который сейчас выводится: от неё зависят отступы своих компонентов
  let breakpoint = 0;
  const setBreakpoint = (w) => { breakpoint = w; };

  /**
   * Свой компонент, которого нет в макете (кнопка в первом экране главной).
   * Встаёт последним ребёнком узла — на ширину и по выравниванию соседа сверху.
   */
  function addition(node, flowKids, pad) {
    return additions
      .filter((a) => a.into && a.into === node.name)
      .map((a) => {
        const above = flowKids[flowKids.length - 1];
        const like = above ? sizing(above, node) : {};
        const box = styleLiteral({
          width: like.width,
          alignSelf: like.alignSelf,
          flexShrink: 0,
          marginTop: px(a.gap?.[breakpoint] ?? 0),
          display: a.align ? "flex" : undefined,
          justifyContent: a.align,
        });
        return (
          `${pad}${indentUnit}<div style=${box}>\n` +
          `${pad}${indentUnit}${indentUnit}<${a.component} lang="${lang}"${a.full ? " full" : ""} />\n` +
          `${pad}${indentUnit}</div>\n`
        );
      })
      .join("");
  }

  /** Текст в JSX: перевод строки — отдельным выражением, иначе JSX его съест */
  const literal = (text) =>
    text
      .split("\n")
      .map((l, i) => (i === 0 ? "" : `{"\\n"}`) + (l ? `{\`${esc(l)}\`}` : ""))
      .join("");

  /**
   * Содержимое текстового узла.
   *
   * В Figma `\n` — новый абзац, U+2028 — перенос строки внутри абзаца. Абзац
   * может быть пунктом списка, а часть символов — иметь свой стиль.
   * Возвращает JSX и признак «внутри есть список» — тогда узел должен быть <div>.
   */
  function textBody(node, pad) {
    // Оригинал сохраняет двойные пробелы из макета, а HTML их схлопывает —
    // второй и следующие пробелы делаем неразрывными.
    const chars = (node.characters || "").replace(/ {2,}/g, (m) => " " + "\u00a0".repeat(m.length - 1));
    const ids = node.characterStyleOverrides || [];
    const table = node.styleOverrideTable || {};
    usedFonts.add(fontKey(node.style));

    const paragraphs = [[]];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const runs = paragraphs[paragraphs.length - 1];
      if (ch === "\n") { paragraphs.push([]); continue; }
      const id = table[ids[i]] ? ids[i] : 0;
      const last = runs[runs.length - 1];
      const c = ch === "\u2028" ? "\n" : ch;
      if (last && last.id === id) last.text += c;
      else runs.push({ id, text: c });
    }

    const run = ({ id, text }) => {
      if (!id) return literal(text);
      usedFonts.add(fontKey({ ...(node.style || {}), ...table[id] }));
      const st = styleLiteral(spanStyle(node, table[id], fonts));
      return st ? `<span style=${st}>${literal(text)}</span>` : literal(text);
    };
    const line = (runs) => runs.map(run).join("");

    const types = node.lineTypes || [];
    const isList = (i) => types[i] === "UNORDERED" || types[i] === "ORDERED";
    if (!paragraphs.some((_, i) => isList(i))) {
      const body = paragraphs.map(line).join(`{"\\n"}`);
      return { body, list: false, multiline: body.includes(`{"\\n"}`) };
    }

    // Список: маркер стоит в отступе пункта, как в оригинале
    const size = node.style?.fontSize || 16;
    const inner = pad + indentUnit;
    let out = "";
    let counter = 0;
    for (let i = 0; i < paragraphs.length; i++) {
      if (!isList(i)) {
        counter = 0;
        const body = line(paragraphs[i]);
        out += body ? `${inner}<p style={{ whiteSpace: "pre-line" }}>${body}</p>\n` : `${inner}<br />\n`;
        continue;
      }
      if (!isList(i - 1)) out += `${inner}<ul style={{ listStyle: "none", margin: "0", padding: "0" }}>\n`;
      counter = types[i] === "ORDERED" ? counter + 1 : 0;
      const indent = px(size * 1.5 * (node.lineIndentations?.[i] || 1));
      const marker = types[i] === "ORDERED" ? `${counter}.` : "•";
      out +=
        `${inner}${indentUnit}<li style={{ marginInlineStart: "${indent}", whiteSpace: "pre-line" }}>` +
        `<span aria-hidden="true" style={{ display: "inline-block", width: "${indent}", marginLeft: "-${indent}" }}>${marker}</span>` +
        `${line(paragraphs[i])}</li>\n`;
      if (!isList(i + 1)) out += `${inner}</ul>\n`;
    }
    return { body: `\n${out}${pad}`, list: true, multiline: false };
  }

  /** Атрибуты узла-переключателя: куда ведёт клик и наведение */
  function triggers(node, targets) {
    let out = "";
    const click = swapOf(node, "ON_CLICK");
    if (click && targets.has(click.to)) out += ` data-swap-to=${JSON.stringify(click.to)} data-swap-ms="${click.ms}"`;
    const hover = swapOf(node, "ON_HOVER");
    if (hover && targets.has(hover.to)) out += ` data-hover-to=${JSON.stringify(hover.to)} data-hover-ms="${hover.ms}"`;
    return out;
  }

  /** Положение и размер узла в родителе */
  function place(node, parent) {
    const isAbs = node.layoutPositioning === "ABSOLUTE" || !parent?.layoutMode;
    const auto = { ...hugs(node) };

    // Пропорции зафиксированы: если узел тянется по одной оси, вторая считается
    // из соотношения сторон. Так фоновая картинка растёт вместе с шириной окна.
    let aspect = null;
    const ar = node.targetAspectRatio;
    if (ar?.x && ar?.y && !rotation(node)) {
      const c = node.constraints || {};
      const row = parent?.layoutMode === "HORIZONTAL";
      const col = parent?.layoutMode === "VERTICAL";
      const fluidW = isAbs
        ? c.horizontal === "LEFT_RIGHT" || c.horizontal === "SCALE"
        : (col && node.layoutAlign === "STRETCH") || (row && node.layoutGrow === 1);
      const fluidH = isAbs
        ? c.vertical === "TOP_BOTTOM" || c.vertical === "SCALE"
        : (row && node.layoutAlign === "STRETCH") || (col && node.layoutGrow === 1);
      if (fluidW !== fluidH) {
        aspect = `${round(ar.x)} / ${round(ar.y)}`;
        if (fluidW) auto.h = true;
        else auto.w = true;
      }
    }

    const abs = isAbs ? absolutePosition(node, parent, auto) : {};
    const size = sizing(node, parent, auto);
    // растянутый между краями узел размера не имеет — его задают отступы
    if (abs.left !== undefined && abs.right !== undefined) delete size.width;
    if (abs.top !== undefined && abs.bottom !== undefined) delete size.height;
    return aspect ? { ...abs, ...size, aspectRatio: aspect } : { ...abs, ...size };
  }

  function emit(node, parent, depth, insideLink = false, swapTargets = null) {
    const pad = indentUnit.repeat(depth);

    // Невидимые узлы в вёрстку не попадают
    if (node.visible === false) return "";

    // Повёрнутая группа — не блок, а общий поворот для детей. Как и оригинал,
    // раскрываем её: каждый ребёнок встаёт в родителя группы со сложенной матрицей.
    if (node.type === "GROUP" && rotation(node) && node.relativeTransform) {
      const [[g00, g01, g02], [g10, g11, g12]] = node.relativeTransform;
      return (node.children || [])
        .map((c) => {
          if (!c.relativeTransform) return "";
          const [[c00, c01, c02], [c10, c11, c12]] = c.relativeTransform;
          const flat = {
            ...c,
            layoutPositioning: "ABSOLUTE",
            opacity: (c.opacity ?? 1) * (node.opacity ?? 1),
            groupOpacity: (node.groupOpacity ?? 1) * (node.opacity ?? 1),
            relativeTransform: [
              [g00 * c00 + g01 * c10, g00 * c01 + g01 * c11, g00 * c02 + g01 * c12 + g02],
              [g10 * c00 + g11 * c10, g10 * c01 + g11 * c11, g10 * c02 + g11 * c12 + g12],
            ],
          };
          return emit(flat, parent, depth, insideLink, swapTargets);
        })
        .join("");
    }

    const style = { ...place(node, parent), ...frameStyle(node, assets, assetMap) };
    if (node.pull) style[node.pull.axis === "VERTICAL" ? "marginTop" : "marginLeft"] = px(node.pull.value);

    // Поворот: вокруг центра. У стрелки «назад» это та же стрелка «вперёд», повёрнутая на 180°.
    const angle = rotation(node);
    if (angle) style.transform = [style.transform, `rotate(${angle}deg)`].filter(Boolean).join(" ");

    // Ссылка узла. Карточка «Смотрите также» ведёт на проект из своей подписи:
    // в оригинале на части страниц подпись заменена, а ссылка осталась от
    // мастер-компонента и ведёт не туда — поэтому адрес берём по подписи.
    // Вложенные ссылки недопустимы: внутри <a> детей не оборачиваем.
    let link = insideLink ? null : linkOf(node, linkByName, guidToUrl);
    if (!insideLink && node.name === "Card-projects-small") {
      const slug = cardMap[(firstText(node) || "").toLowerCase()];
      if (slug) link = { href: `/${slug}-${lang}`, internal: true, newTab: false };
    }
    const linkTag = link ? (link.internal ? "Link" : "a") : null;
    const linkAttrs = link
      ? `href=${JSON.stringify(link.href)}${!link.internal && link.newTab ? ' target="_blank" rel="noopener noreferrer"' : ""}`
      : "";
    if (link) usedLinks.add(link.href);

    // Интерактивный блок: выводим его состояния слоями
    const enclosing = swapTargets || new Set();
    const group = variantGroup(node);
    if (group && ![...group.targets].some((t) => enclosing.has(t))) {
      usedVariants = true;
      const box = place(node, parent);
      if (!box.position) box.position = "relative";
      if (node.pull) box[node.pull.axis === "VERTICAL" ? "marginTop" : "marginLeft"] = px(node.pull.value);
      if (style.transform) box.transform = style.transform; // поворот: стрелка «назад» — повёрнутая «вперёд»
      if (style.opacity != null) box.opacity = style.opacity;
      // сам блок может переключать состояние блока снаружи: стрелка карусели —
      // это кнопка со своим состоянием наведения
      const outer = triggers(node, enclosing);
      if (outer.includes("data-swap-to")) box.cursor = "pointer";
      const inner = new Set([...enclosing, ...group.targets]);
      const panels = group.variants
        .map(({ id, tree: v, info }) => {
          // панель занимает коробку блока; положение (в потоке или поверх) ставит VariantGroup
          const fixed = sizing(v, parent);
          const vs = { ...frameStyle(v, assets, assetMap), width: fixed.width || box.left !== undefined ? "100%" : undefined, height: fixed.height ? "100%" : undefined };
          const kids = (v.children || [])
            .filter((c) => c.visible !== false)
            .map((c) => emit(c, v, depth + 2 + (link ? 1 : 0), insideLink || Boolean(link), inner))
            .join("");
          return (
            `${pad}${indentUnit}<div data-variant=${JSON.stringify(id)}${info.hoverOnly ? " data-lazy" : ""}${triggers(v, group.targets)} style=${styleLiteral(vs)}>\n` +
            kids +
            `${pad}${indentUnit}</div>\n`
          );
        })
        .join("");
      if (link) {
        // блок-ссылка: коробку держит ссылка, состояния — внутри неё
        const fill = { position: "relative", width: "100%", height: box.height ? "100%" : undefined };
        return (
          `${pad}<${linkTag} ${linkAttrs}${outer} style=${styleLiteral({ display: "block", ...box })}>\n` +
          `${pad}<VariantGroup initial=${JSON.stringify(group.initial)} style=${styleLiteral(fill)}>\n` +
          panels +
          `${pad}</VariantGroup>\n` +
          `${pad}</${linkTag}>\n`
        );
      }
      return (
        `${pad}<VariantGroup initial=${JSON.stringify(group.initial)}${outer} style=${styleLiteral(box)}>\n` +
        panels +
        `${pad}</VariantGroup>\n`
      );
    }

    // Узел, который переключает состояние блока кликом или наведением
    let attrs = swapTargets ? triggers(node, swapTargets) : "";
    if (attrs.includes("data-swap-to")) style.cursor = "pointer";

    // Поведение из макета: параллакс при прокрутке и увеличение по клику
    const parallax = node.behaviors?.scrollParallax;
    if (parallax && parallax.axis === "VERTICAL" && parallax.speed != null) {
      attrs += ` data-parallax="${Math.round((1 - parallax.speed) * 1e4) / 1e4}"`;
      style.transform = [style.transform, "translateY(var(--parallax, 0px))"].filter(Boolean).join(" ");
      style.willChange = "transform";
    }
    if ((node.behaviors?.code || []).length && !insideLink && !link) {
      attrs += ` data-lightbox="" role="button" tabIndex={0}`;
      style.cursor = "zoom-in";
    }
    const swapAttr = attrs;

    // Картинка или сгенерированный из Figma SVG — отдельный тег <img>
    const asset = nodeAsset(node, assets);
    if (asset) {
      asset.src = resolve(asset.src.replace("/a/", ""));
      usedAssets.add(asset.src);
      // собственная прозрачность узла уже запечена в картинку; остаётся прозрачность группы
      const assetOpacity = node.groupOpacity != null && node.groupOpacity !== 1 ? node.groupOpacity : null;

      // Повёрнутая картинка, стоящая по координатам. Оригинал растягивает её вместе
      // с родителем уже после поворота; то же самое даёт SVG с viewBox по габаритам
      // повёрнутого прямоугольника и картинкой с матрицей внутри.
      const isAbs = node.layoutPositioning === "ABSOLUTE" || !parent?.layoutMode;
      if (angle && isAbs && node.size?.x >= 1 && node.size?.y >= 1) {
        const [[a, b, tx], [c, d, ty]] = node.relativeTransform;
        const W = node.size.x;
        const H = node.size.y;
        const xs = [0, a * W, b * H, a * W + b * H];
        const ys = [0, c * W, d * H, c * W + d * H];
        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const bw = Math.max(...xs) - minX;
        const bh = Math.max(...ys) - minY;
        const frame = place(
          { ...node, type: "SVG", layoutMode: undefined, size: { x: bw, y: bh }, relativeTransform: [[1, 0, tx + minX], [0, 1, ty + minY]] },
          parent
        );
        if (assetOpacity != null) frame.opacity = assetOpacity;
        const img = assetBox(node, asset);
        const r = (v) => Math.round(v * 1e6) / 1e6;
        return (
          // сам <svg> отступами не растягивается, поэтому габариты держит обёртка
          `${pad}<span${swapAttr} style=${styleLiteral(frame)}>\n` +
          `${pad}${indentUnit}<svg viewBox="0 0 ${round(bw)} ${round(bh)}" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: "0", top: "0", width: "100%", height: "100%", overflow: "visible" }}>\n` +
          `${pad}${indentUnit}${indentUnit}<image href=${JSON.stringify(asset.src)} x="${round(img.left)}" y="${round(img.top)}" width="${round(img.width)}" height="${round(img.height)}" preserveAspectRatio="none" transform="matrix(${r(a)} ${r(c)} ${r(b)} ${r(d)} ${round(-minX)} ${round(-minY)})" />\n` +
          `${pad}${indentUnit}</svg>\n` +
          `${pad}</span>\n`
        );
      }

      // В картинку уже запечены заливка, обводка, скругления и тень узла,
      // поэтому от узла остаются только положение, размер и поворот.
      const own = place(node, parent);
      for (const k of ["marginTop", "marginLeft"]) if (style[k]) own[k] = style[k];
      if (style.transform) own.transform = style.transform;
      if (assetOpacity != null) own.opacity = assetOpacity;
      if (style.cursor) own.cursor = style.cursor;

      // Картинка шире коробки узла на тень и обводку — кладём её со смещением
      const box = assetBox(node, asset);
      const bw = node.size?.x ?? 0;
      const bh = node.size?.y ?? 0;
      const flush =
        Math.abs(box.left) < 0.05 && Math.abs(box.top) < 0.05 &&
        Math.abs(box.width - bw) < 0.05 && Math.abs(box.height - bh) < 0.05;
      // картинке без явного размера (растянута между краями) нужна обёртка:
      // сам <img> отступами не растягивается
      if (!flush || own.width === undefined || own.height === undefined) {
        const wrap = styleLiteral({ ...own, position: own.position ?? "relative" });
        const inner = styleLiteral({ position: "absolute", ...assetBoxCss(node, asset), maxWidth: "none" });
        return (
          `${pad}<span${swapAttr}${wrap ? ` style=${wrap}` : ""}>\n` +
          `${pad}${indentUnit}<img src=${JSON.stringify(asset.src)} alt="" aria-hidden="true" loading="lazy" decoding="async" style=${inner} />\n` +
          `${pad}</span>\n`
        );
      }

      const s = styleLiteral(own);
      return `${pad}<img${swapAttr}\n${pad}${indentUnit}src=${JSON.stringify(asset.src)}\n${pad}${indentUnit}alt=""\n${pad}${indentUnit}aria-hidden="true"\n${pad}${indentUnit}loading="lazy"\n${pad}${indentUnit}decoding="async"\n${s ? `${pad}${indentUnit}style=${s}\n` : ""}${pad}/>\n`;
    }

    if (node.type === "TEXT") {
      Object.assign(style, textStyle(node, fonts));
      const { body, list, multiline } = textBody(node, pad);
      // текст с авто-шириной в Figma не переносится
      if (style.textOverflow) style.whiteSpace = "nowrap";
      else if (node.textAutoResize === "WIDTH_AND_HEIGHT") style.whiteSpace = multiline ? "pre" : "nowrap";
      else if (multiline) style.whiteSpace = "pre-line";
      const tag = list ? "div" : tagFor(node);
      if (link) {
        // текст-ссылка: ссылка внутри, чтобы тег текста (заголовок, абзац) сохранился
        const s = styleLiteral(style);
        return `${pad}<${tag}${swapAttr}${s ? ` style=${s}` : ""}><${linkTag} ${linkAttrs}>${body}</${linkTag}></${tag}>\n`;
      }
      const s = styleLiteral(style);
      return `${pad}<${tag}${swapAttr}${s ? ` style=${s}` : ""}>${body}</${tag}>\n`;
    }

    // Кадрированная заливка: картинку кладём отдельным тегом внутрь обрезающего блока,
    // потому что фоном нужный кусок не выразить
    const fill = imageFill(node, assets, assetMap);
    let cropped = "";
    if (fill?.crop) {
      usedAssets.add(fill.src);
      style.position = style.position || "relative";
      style.overflow = "hidden";
      const c = fill.crop;
      // в процентах от блока: кадр сохраняется, когда блок растягивается
      const bw = node.size?.x || 1;
      const bh = node.size?.y || 1;
      const pc = (v, base) => `${Math.round((v / base) * 1e4) / 100}%`;
      const inner = `{{ position: "absolute", left: "${pc(c.left, bw)}", top: "${pc(c.top, bh)}", width: "${pc(c.width, bw)}", height: "${pc(c.height, bh)}", maxWidth: "none" }}`;
      cropped =
        `${indentUnit.repeat(depth + 1)}<img src=${JSON.stringify(fill.src)} alt="" aria-hidden="true" loading="lazy" decoding="async" style=${inner} />\n`;
    }

    // Если внутри есть абсолютно позиционированные дети — этот узел им точка отсчёта
    const visibleKids = (node.children || []).filter((c) => c.visible !== false);
    const hasAbsoluteKid = visibleKids.some(
      (c) => c.layoutPositioning === "ABSOLUTE" || !node.layoutMode
    );
    if (hasAbsoluteKid && !style.position) style.position = "relative";

    // Отрицательный зазор (элементы внахлёст) в CSS gap не выразить — сдвигаем
    // каждого следующего ребёнка отрицательным отступом.
    const overlap = node.layoutMode && node.itemSpacing < 0 && node.primaryAxisAlignItems !== "SPACE_BETWEEN" ? node.itemSpacing : 0;
    let flowIndex = 0;
    const kids =
      cropped +
      visibleKids
        .map((c) => {
          const inFlow = c.layoutPositioning !== "ABSOLUTE";
          const pull = overlap && inFlow && flowIndex++ > 0 ? overlap : 0;
          const child = pull ? { ...c, pull: { axis: node.layoutMode, value: pull } } : c;
          // свой компонент рядом с узлом: оба уходят в общий ряд или столбик
          const side = additions.find((a) => a.beside === c.name && (a.parents || []).includes(node.name));
          if (side) {
            const column = side.direction?.[breakpoint] === "column";
            const like = sizing(c, node);
            const box = styleLiteral({
              display: "flex",
              flexDirection: column ? "column" : "row",
              alignItems: column ? "stretch" : "center",
              gap: px(side.gap?.[breakpoint] ?? 0),
              width: column ? like.width : undefined,
              alignSelf: column ? like.alignSelf : undefined,
              flexShrink: 0,
            });
            return (
              `${pad}${indentUnit}<div style=${box}>\n` +
              emit(child, node, depth + 2, insideLink || Boolean(link), swapTargets) +
              `${pad}${indentUnit}${indentUnit}<${side.component} lang="${lang}"${side.props ? ` ${side.props}` : ""}${column ? " full" : ""} />\n` +
              `${pad}${indentUnit}</div>\n`
            );
          }
          return emit(child, node, depth + 1, insideLink || Boolean(link), swapTargets);
        })
        .join("") +
      addition(node, visibleKids.filter((c) => c.layoutPositioning !== "ABSOLUTE"), pad);
    const s = styleLiteral(style);

    if (link) {
      if (!kids) return `${pad}<${linkTag} ${linkAttrs}${swapAttr}${s ? ` style=${s}` : ""} />\n`;
      return `${pad}<${linkTag} ${linkAttrs}${swapAttr}${s ? ` style=${s}` : ""}>\n${kids}${pad}</${linkTag}>\n`;
    }

    const tag = tagFor(node);
    if (!kids) return `${pad}<${tag}${swapAttr}${s ? ` style=${s}` : ""} />\n`;
    return `${pad}<${tag}${swapAttr}${s ? ` style=${s}` : ""}>\n${kids}${pad}</${tag}>\n`;
  }

  return { emit, usedAssets, usedLinks, usedFonts, setBreakpoint, usesVariants: () => usedVariants };
}
