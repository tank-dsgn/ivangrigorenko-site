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
  hoverRules = {},
  textStyles = [],
  hoverWords = [],
  frameStyles = [],
  imageSwaps = [],
  videos = {},
  hrefs = {},
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
        const e = a.easingFunction;
        return {
          to: nodeId(a.transitionNodeID),
          ms: animated ? Math.round((a.transitionDuration || 0) * 1000) : 0,
          ease: e?.length === 4 ? `cubic-bezier(${e.map((v) => Math.round(v * 1000) / 1000).join(", ")})` : "ease",
        };
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

  // CSS состояний «по наведению»: правила копятся здесь, генератор кладёт их в <style> секции
  const hoverCss = [];
  let hoverSeq = 0;
  const takeHoverCss = () => hoverCss.splice(0).join("\n");

  const kebab = (k) => k.replace(/^Webkit/, "-webkit").replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const near = (x, y, eps = 0.01) => Math.abs((x ?? 0) - (y ?? 0)) < eps;
  /** Что при наведении меняется «краской», а не геометрией */
  const PAINT = ["boxShadow", "background", "backgroundImage", "color", "opacity", "borderRadius", "outline"];

  /**
   * Чем узел в состоянии «наведение» отличается от обычного: сдвиг, масштаб, краска.
   * Обходит оба состояния параллельно и записывает разницу в узлы обычного состояния.
   * Возвращает false, если состояния устроены по-разному (другие слои, текст, картинка) —
   * тогда плавно переехать из одного в другое нельзя.
   */
  /** Сдвиг, масштаб и краска, которые переводят узел `a` в состояние `b` */
  function moveAndPaint(a, b, isRoot) {
    const to = {};
    const ta = a.relativeTransform;
    const tb = b.relativeTransform;
    // корень блока стоит на месте: двигаются его части
    if (!isRoot && ta && tb && a.size && b.size) {
      const sx = a.size.x > 0.5 ? b.size.x / a.size.x : 1;
      const sy = a.size.y > 0.5 ? b.size.y / a.size.y : 1;
      // картинку увеличиваем масштабом из центра; блок с детьми только сдвигаем.
      // Текст не масштабируем никогда: у подписи «Sizes» на VV блок в другом слайде
      // в 15 раз шире, и буквы растягивались вслед за ним
      // и не двигаем по левому краю: блок стал шире, а текст в нём по центру остался на месте
      const leaf = !(a.children || []).length && a.type !== "TEXT";
      const resized = !(a.children || []).length && (!near(sx, 1, 0.002) || !near(sy, 1, 0.002));
      const scaled = leaf && resized;
      const dx = resized ? tb[0][2] + b.size.x / 2 - (ta[0][2] + a.size.x / 2) : tb[0][2] - ta[0][2];
      const dy = resized ? tb[1][2] + b.size.y / 2 - (ta[1][2] + a.size.y / 2) : tb[1][2] - ta[1][2];
      // текст сменил размер блока (подпись то по ширине текста, то во всю ширину) — это
      // перестройка раскладки, а не движение: по центру он стоит на месте, не сдвигаем
      const textReflow = a.type === "TEXT" && resized;
      if (!textReflow && (!near(dx, 0, 0.05) || !near(dy, 0, 0.05))) to.translate = `${px(dx)} ${px(dy)}`.replace(/(^| )0( |$)/g, "$10px$2");
      if (scaled) to.scale = `${Math.round(sx * 1e4) / 1e4} ${Math.round(sy * 1e4) / 1e4}`;
    }
    const pa = { ...frameStyle(a, assets, assetMap), ...(a.type === "TEXT" ? textStyle(a, fonts) : {}) };
    const pb = { ...frameStyle(b, assets, assetMap), ...(b.type === "TEXT" ? textStyle(b, fonts) : {}) };
    for (const k of PAINT) if (pa[k] !== pb[k]) to[k] = pb[k] ?? (k === "boxShadow" ? "none" : "initial");
    return to;
  }

  function markHover(a, b, mark, rule = null, isRoot = true) {
    if (a.type !== b.type || a.name !== b.name) return false;
    if ((a.visible === false) !== (b.visible === false)) return false;
    if (a.visible === false) return true;
    if ((a.characters || "") !== (b.characters || "") || (a.hash || "") !== (b.hash || "")) return false;
    const ka = a.children || [];
    const kb = b.children || [];
    const sameKids = ka.length === kb.length;
    if (!sameKids && !rule?.repair) return false;

    const to = moveAndPaint(a, b, isRoot);
    // своя правка подписи: в макете она при наведении только меняет цвет
    if (a.type === "TEXT" && rule?.text) Object.assign(to, rule.text);
    if (Object.keys(to).length) mark.set(a, to);

    if (!sameKids) {
      // Наведение в макете собрано иначе (другая картинка, лишний слой). Чинить нечем,
      // поэтому картинку обычного состояния просто увеличиваем из центра.
      const leaves = ka.filter((c) => c.visible !== false && !(c.children || []).length);
      if (leaves.length === 1 && rule.repair.imageScale) {
        const k = rule.repair.imageScale;
        mark.set(leaves[0], { scale: `${k} ${k}` });
      }
      return true;
    }
    return ka.every((c, i) => {
      const ok = markHover(c, kb[i], mark, rule, false);
      // несовпавшую ветку при починке пропускаем, остальное двигается как в макете
      return ok || Boolean(rule?.repair);
    });
  }

  // узел → что с ним происходит при наведении; заполняется на время вывода блока
  let hoverMarks = null;
  let hoverGroup = null;

  /**
   * Наведение как в макете: Smart Animate.
   *
   * Если состояние «наведение» отличается от обычного только положением, размером
   * и краской (карточка приподнялась, картинка выросла, подпись сменила цвет), два
   * слоя не нужны: выводим обычное состояние, а разницу отдаём правилами `:hover`
   * с переходом. Элементы плавно переезжают из одного состояния в другое.
   * Возвращает JSX или null, если состояния устроены по-разному.
   */
  function hoverMorph(node, parent, depth, insideLink, enclosing, group) {
    if (hoverMarks || group.variants.length !== 2) return null;
    const base = group.variants.find((v) => v.id === group.initial);
    const over = group.variants.find((v) => v.id !== group.initial);
    if (!base || !over?.info.hoverOnly) return null;
    const sw = swapOf(base.tree, "ON_HOVER");
    if (!sw || sw.to !== over.id) return null;

    const mark = new Map();
    if (!markHover(base.tree, over.tree, mark, hoverRules[node.name] || null) || !mark.size) return null;

    const id = ++hoverSeq;
    hoverMarks = mark;
    hoverGroup = { id, root: base.tree, n: 0, ms: sw.ms, ease: sw.ease, moving: [], hover: [] };
    const jsx = emit(base.tree, parent, depth, insideLink, new Set([...enclosing, ...group.targets]));
    const g = hoverGroup;
    hoverMarks = null;
    hoverGroup = null;

    hoverCss.push(
      [
        ...g.moving,
        `@media (hover: hover) {`,
        ...g.hover.map((r) => `  ${r}`),
        `}`,
        `@media (prefers-reduced-motion: reduce) { .hg-${id}, .hg-${id} * { transition: none !important; } }`,
      ].join("\n")
    );
    // метки для VariantGroup здесь не нужны: состояние переключает CSS
    return jsx.replace(/ data-hover-to="([^"]+)" data-hover-ms="\d+"/g, (m, to) => (group.targets.has(to) ? "" : m));
  }

  // блок с состояниями по клику, который сейчас выводится
  let stateCtx = null;
  // узел → его «двойники» из других состояний (другая картинка или текст)
  const expanding = new Set();

  /** Что у узла своё в каждом состоянии: картинка, текст */
  const contentOf = (n) =>
    [n.hash || "", n.characters || "", (n.fills || []).filter((f) => f.visible !== false && f.type === "IMAGE").map((f) => f.imageRef).join()].join("|");

  /**
   * Обходит все состояния блока параллельно и записывает, чем каждый узел
   * отличается от исходного состояния. false — состояния устроены по-разному.
   */
  /** Устройство поддерева без мелочей: по нему видно, одинаково ли собраны два слоя */
  const shapeOf = (n) =>
    n.visible === false ? "-" : `${n.type}:${n.name}:${n.hash || ""}:${n.characters || ""}(${(n.children || []).map(shapeOf).join(",")})`;

  /**
   * Слой, собранный в разных состояниях по-разному (экран телефона в светлой и тёмной
   * теме — разные макеты), но стоящий на одном месте. Плавно перевести одно устройство
   * в другое нельзя, поэтому выводим все варианты слоя целиком и показываем нужный
   * по состоянию — как листья с разной картинкой. Двигаются при этом их предки.
   */
  function markAltTrees(nodes, ids, ctx) {
    const a = nodes[0];
    const t = (n) => n.relativeTransform || [[1, 0, 0], [0, 1, 0]];
    const near = (n) =>
      Math.abs((n.size?.x ?? 0) - (a.size?.x ?? 0)) < 64 && Math.abs((n.size?.y ?? 0) - (a.size?.y ?? 0)) < 64 &&
      Math.abs(t(n)[0][2] - t(a)[0][2]) < 32 && Math.abs(t(n)[1][2] - t(a)[1][2]) < 32;
    // растр и фрейм одного слоя разного размера (у растра поля под тень) — это нормально:
    // каждый вариант выводится со своей геометрией, место должно совпадать лишь примерно
    if (!nodes.every(near)) return false;
    const bySig = new Map();
    nodes.forEach((n, i) => {
      const k = shapeOf(n);
      if (!bySig.has(k)) bySig.set(k, { node: n, ids: [] });
      bySig.get(k).ids.push(ids[i]);
    });
    const own = bySig.get(shapeOf(a));
    const m = { css: {}, swap: {}, hide: [], only: own.ids, alts: [] };
    for (const v of bySig.values()) {
      if (v === own) continue;
      m.alts.push(v.node);
      ctx.marks.set(v.node, { css: {}, swap: {}, hide: [], only: v.ids });
    }
    ctx.marks.set(a, m);
    return true;
  }

  function markStates(nodes, ids, ctx, isRoot = true) {
    const a = nodes[0];
    const vis = nodes.map((n) => n.visible !== false);
    const ka = a.children || [];
    const differs = nodes.some((n) => n.type !== a.type || n.name !== a.name || (n.children || []).length !== ka.length);
    // разное устройство у видимого во всех состояниях слоя — показываем варианты целиком
    if (differs) return !isRoot && vis.every(Boolean) && ctx.altTrees !== false && markAltTrees(nodes, ids, ctx);
    if (!vis.some(Boolean)) return true;
    if (!vis[0]) return false; // слой, которого нет в исходном состоянии, плавно не показать

    const m = { css: {}, hide: ids.filter((_, i) => !vis[i]), swap: {} };

    // кто переключает состояние — зависит от состояния: на первом слайде «назад» не работает
    nodes.forEach((n, i) => {
      const sw = vis[i] && swapOf(n, "ON_CLICK");
      if (sw && ctx.targets.has(sw.to)) {
        m.swap[ids[i]] = sw.to;
        if (ctx.ms == null) { ctx.ms = sw.ms; ctx.ease = sw.ease; }
      }
    });

    const leaf = !ka.length;
    const own = contentOf(a);
    if (leaf && nodes.some((n, i) => vis[i] && contentOf(n) !== own)) {
      // у листа в другом состоянии другая картинка или текст: выводим оба, показываем нужный
      const bySig = new Map();
      nodes.forEach((n, i) => {
        if (!vis[i]) return;
        const k = contentOf(n);
        if (!bySig.has(k)) bySig.set(k, { node: n, ids: [] });
        bySig.get(k).ids.push(ids[i]);
      });
      m.only = bySig.get(own).ids;
      m.alts = [];
      for (const [k, v] of bySig) {
        if (k === own) continue;
        m.alts.push(v.node);
        ctx.marks.set(v.node, { css: {}, swap: {}, hide: [], only: v.ids });
      }
    } else {
      nodes.forEach((n, i) => {
        if (!i || !vis[i]) return;
        const to = moveAndPaint(a, n, isRoot);
        if (Object.keys(to).length) m.css[ids[i]] = to;
      });
    }
    if (Object.keys(m.css).length || m.hide.length || m.only || Object.keys(m.swap).length) ctx.marks.set(a, m);

    return ka.every((c, i) => markStates(nodes.map((n) => n.children[i]), ids, ctx, false));
  }

  /**
   * Карусель как в макете: Smart Animate по клику.
   *
   * Если состояния блока отличаются только положением частей, краской и содержимым
   * отдельных листьев (стрелка стала активной, точка сменила цвет), выводится одно
   * дерево, а разницу между состояниями задают правила CSS по атрибуту `data-state`
   * на корне. Лента слайдов плавно едет, а не подменяется. Атрибут переключает
   * `components/StateGroups.tsx`.
   */
  /** Свойства варианта из его имени: «mode=light, step=1» → { mode: "light", step: "1" } */
  const variantProps = (id) =>
    Object.fromEntries(
      (nodeById[id]?.name || "").split(",").map((p) => p.split("=").map((x) => x.trim())).filter((p) => p.length === 2)
    );

  /** Свойства варианта, меняющие содержимое (тема): их значение есть в именах слоёв варианта */
  function contentProps(trees, props) {
    const names = trees.map((t) => {
      const out = [];
      (function walk(n, d) { out.push(n.name || ""); if (d < 3) (n.children || []).forEach((c) => walk(c, d + 1)); })(t, 0);
      return out.join(" ").toLowerCase();
    });
    return Object.keys(props[0] || {}).filter((key) =>
      props.every((p, k) => /[a-zа-я]/i.test(p[key] || "") && new RegExp(`\\b${p[key].toLowerCase()}\\b`).test(names[k]))
    );
  }

  /**
   * Привести состояния к одному устройству, чтобы между ними можно было плавно переехать.
   *
   * Figma Sites растрирует то, чего в состоянии не видно: в карусели «App Login» на POT
   * невидимый слайд в одном состоянии — картинка, в другом — настоящий фрейм с телефонами.
   * Ещё у тёмной темы слои названы иначе («Content Dark» вместо «Content Light») и лежат
   * в другом порядке. Здесь: растрированный слой заменяется настоящим из соседнего
   * состояния (того, что отличается меньше всего, — той же темы), имена и порядок слоёв
   * выравниваются по исходному состоянию. Работает на копиях деревьев.
   */
  function harmonize(nodes, props, content = contentProps(nodes, props)) {
    const base = nodes[0];
    const kids = (n) => (n.children || []).filter((c) => c.visible !== false);
    // один и тот же слой с другим именем (тема в имени)
    if (nodes.some((n) => n.name !== base.name) && nodes.every((n) => n.type === base.type)) {
      const same = (n) => kids(n).map((c) => c.name).sort().join("|") === kids(base).map((c) => c.name).sort().join("|");
      if (nodes.every(same)) nodes.forEach((n) => (n.name = base.name));
    }
    // порядок детей — как в исходном состоянии
    const order = kids(base).map((c) => c.name);
    for (const n of nodes.slice(1)) {
      const k = kids(n);
      if (k.length !== order.length || k.map((c) => c.name).join("|") === order.join("|")) continue;
      const pool = [...k];
      const sorted = order.map((name) => {
        const i = pool.findIndex((c) => c.name === name);
        return i === -1 ? null : pool.splice(i, 1)[0];
      });
      if (sorted.every(Boolean)) n.children = [...sorted, ...(n.children || []).filter((c) => c.visible === false)];
    }
    // Растрированные слои. В строке (один и тот же слой во всех состояниях) где-то картинка,
    // где-то фрейм. Тема — свойство варианта, чьё значение встречается в именах слоёв
    // («Content Light»): донор растра берётся только из состояния той же темы.
    const lists = nodes.map(kids);
    if (lists.some((l) => l.length !== lists[0].length)) return;
    lists[0].forEach((_, i) => {
      const row = lists.map((l) => l[i]);
      // растр в выгрузке — узел типа IMAGE; разные значки (SVG) — это разное содержимое, их не трогаем
      if (row.every((c) => c.type === row[0].type) || row.some((c) => c.name !== row[0].name)) return;
      if (!row.some((c) => c.type === "IMAGE") || row.some((c) => !(c.children || []).length && c.type !== "IMAGE")) return;
      // Внутри каждой темы — один вид: растр, если он есть хоть у одного состояния этой темы
      // (так Figma Sites эту тему и показывает: в тёмной теме значки на растре белые, а во
      // фрейме из выгрузки — чёрные), иначе фрейм. Между темами вид может различаться —
      // такие слои дальше выводятся вариантами (markAltTrees).
      const kin = (k, j) => content.every((key) => props[k][key] === props[j][key]);
      row.forEach((c, k) => {
        if (c.type === "IMAGE") return;
        const j = row.findIndex((d, jj) => jj !== k && kin(k, jj) && d.type === "IMAGE");
        if (j === -1) return;
        const copy = structuredClone(row[j]);
        copy.relativeTransform = c.relativeTransform;
        const all = nodes[k].children;
        all[all.indexOf(c)] = copy;
        lists[k][i] = copy;
      });
    });
    lists[0].forEach((_, i) => harmonize(lists.map((l) => l[i]), props, content));
  }

  /**
   * Увеличение по клику в макете стоит только на слайде, который виден в своём
   * состоянии карусели. Выводится же одно дерево — исходного состояния, поэтому
   * отмечаем в нём все слои, которые увеличиваются хоть в одном состоянии.
   */
  function lendZoom(nodes) {
    const a = nodes[0];
    if (nodes.some((n) => n.type !== a.type || n.name !== a.name)) return;
    if (nodes.some((n) => (n.behaviors?.code || []).length)) a.zoomable = true;
    (a.children || []).forEach((c, k) => lendZoom(nodes.map((n) => n.children?.[k]).filter(Boolean).length === nodes.length ? nodes.map((n) => n.children[k]) : [c]));
  }

  function stateMorph(node, parent, depth, insideLink, enclosing, group) {
    if (stateCtx || group.variants.length < 2 || group.variants.some((v) => v.info.hoverOnly)) return null;
    const base = group.variants.find((v) => v.id === group.initial);
    if (!base) return null;
    const ordered = [base, ...group.variants.filter((v) => v !== base)];
    const ids = ordered.map((v) => v.id);
    const fresh = () => ({ id: 0, root: null, initial: base.id, n: 0, marks: new Map(), targets: group.targets, ms: null, ease: "linear", moving: [], rules: [] });
    let trees = ordered.map((v) => v.tree);
    let ctx = { ...fresh(), root: trees[0] };
    if (!markStates(trees, ids, ctx) || !ctx.marks.size) {
      // вторая попытка: состояния, приведённые к одному устройству
      trees = trees.map((t) => structuredClone(t));
      harmonize(trees, ids.map(variantProps));
      ctx = { ...fresh(), root: trees[0] };
      if (!markStates(trees, ids, ctx) || !ctx.marks.size) return null;
    }

    lendZoom(trees);
    ctx.id = ++hoverSeq;
    stateCtx = ctx;
    const jsx = emit(trees[0], parent, depth, insideLink, new Set([...enclosing, ...group.targets]));
    stateCtx = null;

    hoverCss.push(
      [...ctx.moving, ...ctx.rules, `@media (prefers-reduced-motion: reduce) { .sg-${ctx.id}, .sg-${ctx.id} * { transition: none !important; } }`].join("\n")
    );
    // метки для VariantGroup здесь не нужны: состояние переключает атрибут data-state
    return jsx.replace(/ data-swap-to="([^"]+)" data-swap-ms="\d+"/g, (m, to) => (group.targets.has(to) ? "" : m));
  }

  /** Класс и атрибуты узла внутри блока с состояниями по клику */
  function stateAttrs(node, baseTransform, classes) {
    if (!stateCtx) return "";
    const g = stateCtx;
    let extra = "";
    if (node === g.root) {
      classes.push(`sg-${g.id}`);
      extra += ` data-state=${JSON.stringify(g.initial)}`;
    }
    const m = g.marks.get(node);
    if (!m) return extra;
    const cls = `sn-${g.id}-${++g.n}`;
    classes.push(cls);
    const at = (id) => `.sg-${g.id}[data-state="${id}"] .${cls}`;
    const props = new Set();
    for (const [id, css] of Object.entries(m.css)) {
      let to = css;
      if (to.scale && baseTransform) {
        const { scale, ...rest } = to;
        to = { ...rest, transform: `${baseTransform} scale(${scale.replace(" ", ", ")})` };
      }
      Object.keys(to).forEach((k) => props.add(k));
      g.rules.push(`${at(id)} { ${Object.entries(to).map(([k, v]) => `${kebab(k)}: ${v} !important`).join("; ")}; }`);
    }
    if (props.size && g.ms) g.moving.push(`.${cls} { transition: ${[...props].map((k) => `${kebab(k)} ${g.ms}ms ${g.ease}`).join(", ")}; }`);
    // лист показан не во всех состояниях
    const all = [...g.targets];
    const hidden = m.only ? all.filter((id) => !m.only.includes(id)) : m.hide;
    for (const id of hidden) g.rules.push(`${at(id)} { display: none !important; }`);
    if (Object.keys(m.swap).length) extra += ` data-swap-map='${JSON.stringify(m.swap)}'`;
    return extra;
  }

  /** Класс узла внутри блока с наведением и его правила */
  function hoverClass(node, baseTransform) {
    if (!hoverGroup) return "";
    const g = hoverGroup;
    const root = node === g.root;
    let to = hoverMarks.get(node);
    if (!root && !to) return "";
    // У узла уже есть transform (например, сдвиг на −50% для привязки по центру).
    // Отдельное свойство scale применилось бы после него и увело бы картинку в сторону,
    // поэтому масштаб дописываем в тот же transform — он сработает первым, из центра.
    if (to?.scale && baseTransform) {
      const { scale, ...rest } = to;
      to = { ...rest, transform: `${baseTransform} scale(${scale.replace(" ", ", ")})` };
    }
    const cls = root ? `hg-${g.id}` : `hn-${g.id}-${++g.n}`;
    if (to) {
      const props = Object.keys(to);
      const decl = props.map((k) => `${kebab(k)}: ${to[k]} !important`).join("; ");
      g.hover.push(`${root ? `.${cls}:hover` : `.hg-${g.id}:hover .${cls}`} { ${decl}; }`);
      if (g.ms) g.moving.push(`.${cls} { transition: ${props.map((k) => `${kebab(k)} ${g.ms}ms ${g.ease}`).join(", ")}; }`);
    }
    return cls;
  }

  /** Классы и атрибуты узла от блоков с наведением и с состояниями */
  function motionAttrs(node, baseTransform) {
    const classes = [];
    const hover = hoverClass(node, baseTransform);
    if (hover) classes.push(hover);
    const extra = stateAttrs(node, baseTransform, classes);
    return (classes.length ? ` className="${classes.join(" ")}"` : "") + extra;
  }

  // ширина брейкпоинта, который сейчас выводится: от неё зависят отступы своих компонентов
  let breakpoint = 0;
  const setBreakpoint = (w) => { breakpoint = w; };

  /**
   * Свой компонент, которого нет в макете (кнопка в первом экране главной).
   * Встаёт последним ребёнком узла — на ширину и по выравниванию соседа сверху.
   */
  function addition(node, flowKids, pad) {
    return additions
      // hasText — уточнение, когда имя блока не уникально: среди его детей должен быть такой текст
      .filter((a) => a.into && [].concat(a.into).includes(node.name)) // имя блока; несколько — если на брейкпоинтах он назван по-разному
      .filter((a) => !a.hasText || (node.children || []).some((c) => c.type === "TEXT" && c.visible !== false && c.characters === a.hasText))
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
          // lang: false — компоненту язык не нужен; props — готовая строка свойств,
          // propsAt — добавка к ним на конкретной ширине макета
          `${pad}${indentUnit}${indentUnit}<${a.component}${a.lang === false ? "" : ` lang="${lang}"`}${a.props ? ` ${a.props}` : ""}${a.propsAt?.[breakpoint] ? ` ${a.propsAt[breakpoint]}` : ""}${a.full ? " full" : ""} />\n` +
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

    // Заголовок, где под курсором подсвечивается слово (overrides.json → hoverWords): пробел
    // входит в слово, иначе между словами подсветка мигала бы. Выделение из макета — классом.
    if (hoverWords.some((r) => chars.startsWith(r.startsWith))) {
      const words = [...chars.matchAll(/\S+\s*/g)].map((m) => {
        const accent = [...m[0]].some((_, i) => table[ids[m.index + i]] && styleLiteral(spanStyle(node, table[ids[m.index + i]], fonts)));
        return `<span${accent ? ` className="hover-words-accent"` : ""}>${literal(m[0])}</span>`;
      });
      return { body: `<span className="hover-words">${words.join("")}</span>`, list: false, multiline: false };
    }

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
    // В Figma слои рисуются по порядку, а в CSS блок с position ложится поверх обычных
    // соседей, даже если стоит раньше них. Поэтому обычному блоку, перед которым есть
    // сосед «по координатам» (подложка, затемнение), тоже даём position — иначе он
    // окажется под этим соседом, как заголовок обложки Autotor под градиентом.
    const lift = {};
    if (!isAbs) {
      const siblings = (parent.children || []).filter((c) => c.visible !== false);
      const at = node.id ? siblings.findIndex((c) => c.id === node.id) : -1;
      if (at > 0 && siblings.slice(0, at).some((c) => c.layoutPositioning === "ABSOLUTE")) lift.position = "relative";
    }
    return aspect ? { ...lift, ...abs, ...size, aspectRatio: aspect } : { ...lift, ...abs, ...size };
  }

  // Свои компоненты вместо вёрстки из макета: что нашли и с какими данными вывели.
  // По этому списку генератор пишет данные для Storybook.
  const componentCalls = [];
  const SIZES = { 375: "mobile", 800: "tablet", 1280: "desktop" };
  const visibleKids = (n) => (n.children || []).filter((c) => c.visible !== false);
  const texts = (n, out = []) => {
    if (n.visible === false) return out;
    // перенос строки внутри абзаца в Figma — U+2028; компонент держит его как обычный перевод строки
    if (n.type === "TEXT") out.push((n.characters || "").replace(/\u2028/g, "\n"));
    for (const c of n.children || []) texts(c, out);
    return out;
  };
  const propsLiteral = (props) =>
    Object.entries(props)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => (v === true ? k : typeof v === "string" && !/["\n\\{}]/.test(v) ? `${k}="${v}"` : `${k}={${JSON.stringify(v)}}`))
      .join(" ");

  /**
   * Карточка проекта на главной — настоящий компонент components/ProjectCard.tsx.
   *
   * В макете это блок из двух частей: «Image conteiner» и «Text conteiner». Общее
   * оформление (размеры, скругление, тень, типографика, подъём при наведении) живёт
   * в компоненте. Отсюда в него уходит только то, что у каждого проекта своё: ссылка,
   * тексты, картинка и её положение в окне, включая увеличение при наведении.
   * Возвращает null, если блок устроен не как карточка, — тогда он выводится как есть.
   */
  function projectCard(node, pad) {
    const size = SIZES[breakpoint];
    if (!size) return null;
    const parts = (n) => {
      const kids = visibleKids(n);
      const image = kids.find((c) => c.name === "Image conteiner");
      const text = kids.find((c) => c.name === "Text conteiner");
      return kids.length === 2 && image && text ? { card: n, image, text } : null;
    };
    const unwrap = (n) => parts(n) || (visibleKids(n).length === 1 ? parts(visibleKids(n)[0]) : null);
    const found = unwrap(node);
    if (!found) return null;
    const link = linkOf(node, linkByName, guidToUrl);
    const [tags, title, description, ...rest] = texts(found.text);
    const leaves = visibleKids(found.image);
    if (!link?.internal || !description || rest.length || leaves.length !== 1 || visibleKids(leaves[0]).length) return null;

    // окно под картинку: у части карточек своя пропорция, скругление или подложка
    const window_ = { ...place(found.image, found.card), ...frameStyle(found.image, assets, assetMap) };
    const frame = {};
    for (const k of ["aspectRatio", "borderRadius", "background", "backgroundImage"]) if (window_[k] !== undefined) frame[k] = window_[k];

    // сама картинка: положение в окне — из макета
    const leaf = leaves[0];
    const { backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat, ...position } = {
      ...place(leaf, found.image),
      ...frameStyle(leaf, assets, assetMap),
    };
    const src = /^url\((.+)\)$/.exec(backgroundImage || "")?.[1];
    if (!src || backgroundSize !== "cover") return null;

    // наведение: куда и насколько вырастает картинка
    let hover;
    const group = variantGroup(node);
    if (group) {
      const over = group.variants.find((v) => v.id !== group.initial);
      const mark = new Map();
      if (over && markHover(node, over.tree, mark, hoverRules[node.name] || null)) {
        const to = mark.get(leaf);
        if (to) hover = { translate: to.translate, scale: to.scale?.replace(" ", ", ") };
      }
    }

    usedAssets.add(src);
    usedLinks.add(link.href);
    const props = {
      size,
      href: link.href,
      tags,
      title,
      description,
      image: { src, style: position, ...(Object.keys(frame).length ? { frame } : {}), ...(hover ? { hover } : {}) },
    };
    componentCalls.push({ component: "ProjectCard", props });
    return `${pad}<ProjectCard ${propsLiteral(props)} />\n`;
  }

  /**
   * Маленькая карточка «Смотрите также» — компонент components/RelatedCard.tsx.
   *
   * В макете это «Card-projects-small»: окно с картинкой и подпись. Оформление и наведение
   * живут в компоненте; отсюда уходят ссылка, подпись, картинка с её положением и
   * увеличением при наведении, а на планшете и телефоне — ещё высота и тень окна, если
   * они в макете не такие, как у остальных.
   */
  const RELATED_FRAME = { height: "280px", boxShadow: "0 2px 6px 0 rgba(13, 18, 46, 0.3)" };
  function relatedCard(node, pad) {
    const size = SIZES[breakpoint];
    if (!size) return null;
    const kids = visibleKids(node);
    const window_ = kids.find((c) => c.type !== "TEXT");
    const label = kids.find((c) => c.type === "TEXT");
    const leaves = window_ ? visibleKids(window_) : [];
    if (kids.length !== 2 || !window_ || !label || leaves.length !== 1 || visibleKids(leaves[0]).length) return null;
    // На одной странице макета три карточки отвязаны от компонента и зовутся иначе,
    // поэтому узнаём карточку ещё и по устройству: окно с тёмной подложкой и подпись.
    const named = node.name === "Card-projects-small";
    if (!named && frameStyle(window_, assets, assetMap).background !== "#0c1543") return null;

    // ведёт на проект из своей подписи (см. пояснение у ссылок в emit)
    const [text] = texts(label);
    const slug = cardMap[text.toLowerCase()];
    const link = named && slug ? { href: `/${slug}-${lang}`, internal: true } : linkOf(node, linkByName, guidToUrl);
    if (!link?.internal) return null;

    const leaf = leaves[0];
    const { backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat, ...position } = {
      ...place(leaf, window_),
      ...frameStyle(leaf, assets, assetMap),
    };
    const src = /^url\((.+)\)$/.exec(backgroundImage || "")?.[1];
    if (!src || backgroundSize !== "cover") return null;

    let frame;
    if (size !== "desktop") {
      const own = frameStyle(window_, assets, assetMap);
      const height = place(window_, node).height;
      frame = {};
      if (height && height !== RELATED_FRAME.height) frame.height = height;
      if (own.boxShadow && own.boxShadow !== RELATED_FRAME.boxShadow) frame.boxShadow = own.boxShadow;
      if (!Object.keys(frame).length) frame = undefined;
    }

    let hover;
    const group = variantGroup(node);
    const over = group?.variants.find((v) => v.id !== group.initial);
    if (over) {
      const mark = new Map();
      if (markHover(node, over.tree, mark, hoverRules[node.name] || null)) {
        const to = mark.get(leaf);
        if (to) hover = { translate: to.translate, scale: to.scale?.replace(" ", ", ") };
      }
    }

    usedAssets.add(src);
    usedLinks.add(link.href);
    const props = { size, href: link.href, label: text, image: { src, style: position, ...(hover ? { hover } : {}) }, frame };
    componentCalls.push({ component: "RelatedCard", props });
    return `${pad}<RelatedCard ${propsLiteral(props)} />\n`;
  }

  /**
   * Контурная кнопка сайта — компонент components/Button.tsx.
   * В макете: «Button» со ссылкой, внутри плашка 40px с обводкой и одна подпись.
   */
  function siteButton(node, parent, pad) {
    if (node.name !== "Button") return null;
    const kids = visibleKids(node);
    const body = kids[0];
    const inner = body ? visibleKids(body) : [];
    if (kids.length !== 1 || inner.length !== 1 || inner[0].type !== "TEXT") return null;
    const link = linkOf(node, linkByName, guidToUrl);
    const look = { ...place(body, node), ...frameStyle(body, assets, assetMap) };
    if (!link || look.height !== "40px" || look.borderRadius !== "999px" || look.boxShadow !== "inset 0 0 0 1px #94a3b8") return null;

    const box = place(node, parent);
    const [label] = texts(inner[0]);
    const href = hrefs[link.href] ?? link.href;
    usedLinks.add(href);
    const props = {
      href,
      label,
      newTab: !link.internal && link.newTab ? true : undefined,
      width: box.alignSelf === "stretch" ? "fill" : box.width,
      wideLabel: place(inner[0], body).flex ? true : undefined,
    };
    componentCalls.push({ component: "Button", props });
    return `${pad}<Button ${propsLiteral(props)} />\n`;
  }

  /**
   * Переключатель светлой и тёмной темы в кейсах (компоненты «toggle», «toggle-mobile»).
   * Метка нужна для общего наведения: обводка цвета круга на ползунке — см. StateGroups.tsx
   * и `[data-toggle]` в app/globals.css.
   */
  const toggleAttr = (node) => (/^toggle(-mobile)?$/.test(node.name || "") ? ' data-toggle=""' : "");

  function emit(node, parent, depth, insideLink = false, swapTargets = null) {
    const pad = indentUnit.repeat(depth);

    // Невидимые узлы в вёрстку не попадают
    if (node.visible === false) return "";

    // Карточки проектов — свои компоненты, а не вёрстка из макета
    if (!insideLink && !hoverGroup && !stateCtx) {
      const card = projectCard(node, pad) || relatedCard(node, pad) || siteButton(node, parent, pad);
      if (card) return card;
    }

    // Лист, у которого в другом состоянии блока другая картинка или текст:
    // следом за ним выводим его «двойников», CSS покажет нужного.
    const twins = stateCtx?.marks.get(node)?.alts;
    if (twins && !expanding.has(node)) {
      expanding.add(node);
      const out = emit(node, parent, depth, insideLink, swapTargets) + twins.map((t) => emit(t, parent, depth, insideLink, swapTargets)).join("");
      expanding.delete(node);
      return out;
    }

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
    // своя правка оформления блока поверх макета (overrides.json → frameStyles): по имени слоя и ширине макета
    const ownFrame = frameStyles.find((r) => r.name === node.name)?.at?.[breakpoint];
    if (ownFrame) Object.assign(style, ownFrame);
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
      const morph =
        hoverMorph(node, parent, depth, insideLink, enclosing, group) ||
        stateMorph(node, parent, depth, insideLink, enclosing, group);
      if (morph) return morph;
      usedVariants = true;
      const box = place(node, parent);
      if (!box.position) box.position = "relative";
      if (node.pull) box[node.pull.axis === "VERTICAL" ? "marginTop" : "marginLeft"] = px(node.pull.value);
      if (style.transform) box.transform = style.transform; // поворот: стрелка «назад» — повёрнутая «вперёд»
      if (style.opacity != null) box.opacity = style.opacity;
      // сам блок может переключать состояние блока снаружи: стрелка карусели —
      // это кнопка со своим состоянием наведения
      const outer = triggers(node, enclosing) + motionAttrs(node, style.transform) + toggleAttr(node);
      if (outer.includes("data-swap-to") || outer.includes("data-swap-map")) box.cursor = "pointer";
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
    let attrs = (swapTargets ? triggers(node, swapTargets) : "") + motionAttrs(node, style.transform) + toggleAttr(node);
    if (attrs.includes("data-swap-to") || attrs.includes("data-swap-map")) style.cursor = "pointer";

    // Поведение из макета: параллакс при прокрутке и увеличение по клику
    const parallax = node.behaviors?.scrollParallax;
    if (parallax && parallax.axis === "VERTICAL" && parallax.speed != null) {
      attrs += ` data-parallax="${Math.round((1 - parallax.speed) * 1e4) / 1e4}"`;
      style.transform = [style.transform, "translateY(var(--parallax, 0px))"].filter(Boolean).join(" ");
      style.willChange = "transform";
    }
    if (((node.behaviors?.code || []).length || node.zoomable) && !insideLink && !link) {
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
      // своя правка оформления текста поверх макета (overrides.json → textStyles) — последней
      const own = textStyles.find((r) => (r.exact != null ? node.characters === r.exact : (node.characters || "").startsWith(r.startsWith)));
      if (own) Object.assign(style, own.style);
      // перенос строки из макета только на телефоне: с 480px мобильная вёрстка шире
      // макета (до 800px — планшет), и заголовок помещается в одну строку
      const shown = own?.phoneBreaks ? body.replaceAll('{"\\n"}', '<br className="sm:hidden" />') : body;
      const tag = list ? "div" : tagFor(node);
      if (link) {
        // текст-ссылка: ссылка внутри, чтобы тег текста (заголовок, абзац) сохранился
        const s = styleLiteral(style);
        return `${pad}<${tag}${swapAttr}${s ? ` style=${s}` : ""}><${linkTag} ${linkAttrs}>${shown}</${linkTag}></${tag}>\n`;
      }
      const s = styleLiteral(style);
      return `${pad}<${tag}${swapAttr}${s ? ` style=${s}` : ""}>${shown}</${tag}>\n`;
    }

    // Кадрированная заливка: картинку кладём отдельным тегом внутрь обрезающего блока,
    // потому что фоном нужный кусок не выразить
    const fill = imageFill(node, assets, assetMap);
    let cropped = "";
    // Видео-заливка (прототип в экране телефона на POT). Файлы видео в выгрузке нет —
    // он скачан с оригинала и пережат; соответствие хеша и файла — overrides.json → videos.
    // Кадр задан как у картинки: imageTransform — какая часть видео видна в слое.
    const videoFill = (node.fills || []).find((f) => f.visible !== false && f.type === "VIDEO");
    const videoFile = videoFill && videos[videoFill.videoRef];
    let videoTag = "";
    if (videoFile) {
      style.position = style.position || "relative";
      style.overflow = "hidden";
      const [[a, , tx], [, d, ty]] = videoFill.imageTransform || [[1, 0, 0], [0, 1, 0]];
      const pc = (v) => `${Math.round(v * 1e4) / 100}%`;
      videoTag =
        `${indentUnit.repeat(depth + 1)}<video src=${JSON.stringify(videoFile.src)}${videoFile.poster ? ` poster=${JSON.stringify(videoFile.poster)}` : ""} autoPlay loop muted playsInline preload="metadata" aria-hidden="true" style={{ position: "absolute", left: "${pc(-tx / a)}", top: "${pc(-ty / d)}", width: "${pc(1 / a)}", height: "${pc(1 / d)}", maxWidth: "none", objectFit: "fill" }} />\n`;
    }
    // своя картинка вместо картинки из макета (overrides.json → imageSwaps): окно получает
    // пропорции новой картинки, картинка заполняет его целиком
    const swap = fill && imageSwaps.find((r) => fill.src.includes(r.from));
    if (swap) {
      style.position = style.position || "relative";
      style.overflow = "hidden";
      style.aspectRatio = swap.aspect;
      const alt = swap.alt ? `alt=${JSON.stringify(swap.alt)}` : `alt="" aria-hidden="true"`;
      cropped =
        `${indentUnit.repeat(depth + 1)}<img src=${JSON.stringify(swap.src)} ${alt} loading="lazy" decoding="async" style={{ position: "absolute", left: "0", top: "0", width: "100%", height: "100%", maxWidth: "none" }} />\n`;
    } else if (fill?.crop) {
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
      videoTag +
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

  return { emit, usedAssets, usedLinks, usedFonts, setBreakpoint, takeHoverCss, usesVariants: () => usedVariants, componentCalls };
}
