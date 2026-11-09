// Walks the Figma tree and emits JSX.
// Layout values are carried over one to one, so inline styles are used instead
// of classes: that way every number is traceable to the design file and
// nothing is lost to Tailwind's rounding.

import { absolutePosition, assetBox, assetBoxCss, fontKey, frameStyle, hugs, imageFill, nodeAsset, px, rotation, sizing, spanStyle, textStyle } from "./nodes.mjs";

/**
 * A click on a node is an interaction in Figma. The URL is read out of it:
 * URL is an external link, INTERNAL_NODE a move to another page of the site.
 */
/** The first text inside a node; a project card is recognised by it */
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
  // the node's own interaction is the more accurate one: it already accounts for the instance's overrides
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

/** The component name taken from the Figma layer name */
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

/** A JS style object as a string for JSX */
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
   * A state switch on the node itself: a click, for a carousel or a theme
   * toggle, or a hover, for a button or a card. Returns the target and the
   * transition duration.
   */
  function swapOf(node, event) {
    for (const i of node.interactions || []) {
      if (i.event?.interactionType !== event) continue;
      for (const a of i.actions || []) {
        if (a.navigationType !== "SWAP_STATE" || !a.transitionNodeID) continue;
        // with no transition type, and with INSTANT_TRANSITION, the state changes at once
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

  /** Every switch in the subtree that leads into a variant of the set */
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
   * An instance whose variants can be switched is an interactive block: a
   * carousel, a theme toggle, a button with a hover state.
   * Only the variants reachable from the starting one are taken.
   */
  function variantGroup(node) {
    if (node.type !== "INSTANCE" || !node.mainComponentId) return null;
    const master = nodeById[node.mainComponentId];
    const set = master?.componentSetId && nodeById[master.componentSetId];
    const ids = set?.children || [];
    if (ids.length < 2) return null;
    const targets = new Set(ids);

    // each variant is expanded as this same instance, so the same overrides
    // land on it: the translated text, the sizes for the breakpoint
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
    // a variant reachable only by hover is not needed straight away: it can go
    // undrawn until the visitor turns out to have a mouse
    const byClick = reach(["ON_CLICK"]);
    const variants = ids
      .filter((id) => reach(["ON_CLICK", "ON_HOVER"]).has(id) && tree(id))
      .map((id) => ({ id, tree: tree(id), info: { hoverOnly: !byClick.has(id) } }));
    if (variants.length < 2) return null;
    return { variants, initial: node.mainComponentId, targets };
  }
  // The same caption appears in the design file in different cases, so the
  // lookup ignores case
  const cardMap = Object.fromEntries(
    Object.entries(cardTargets).map(([k, v]) => [k.toLowerCase(), v])
  );
  /** Heavy PNGs were converted to WebP; the file name is swapped through the map */
  const resolve = (url) => `/a/${assetMap[url] ?? url}`;
  const usedAssets = new Set();
  const usedLinks = new Set();
  const usedFonts = new Set();

  // CSS for the hover states: the rules collect here and the generator puts them in the section's <style>
  const hoverCss = [];
  let hoverSeq = 0;
  const takeHoverCss = () => hoverCss.splice(0).join("\n");

  const kebab = (k) => k.replace(/^Webkit/, "-webkit").replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const near = (x, y, eps = 0.01) => Math.abs((x ?? 0) - (y ?? 0)) < eps;
  /** What hover changes by paint rather than by geometry */
  const PAINT = ["boxShadow", "background", "backgroundImage", "color", "opacity", "borderRadius", "outline"];

  /**
   * How a node in the hover state differs from the default one: offset, scale,
   * paint. Walks both states side by side and records the difference on the
   * default state's nodes. Returns false when the states are built differently
   * — different layers, text or image — because then one cannot ease into the
   * other.
   */
  /** The offset, scale and paint that take node `a` into state `b` */
  function moveAndPaint(a, b, isRoot) {
    const to = {};
    const ta = a.relativeTransform;
    const tb = b.relativeTransform;
    // the block's root stays put; its parts are what move
    if (!isRoot && ta && tb && a.size && b.size) {
      const sx = a.size.x > 0.5 ? b.size.x / a.size.x : 1;
      const sy = a.size.y > 0.5 ? b.size.y / a.size.y : 1;
      // an image grows by a scale about its centre; a block with children is
      // only moved. Text is never scaled: the Sizes caption on VV has a block
      // fifteen times wider in another slide, and the letters stretched with
      // it. Nor is text moved by its left edge: the block grew wider while the
      // text inside stayed centred where it was
      const leaf = !(a.children || []).length && a.type !== "TEXT";
      const resized = !(a.children || []).length && (!near(sx, 1, 0.002) || !near(sy, 1, 0.002));
      const scaled = leaf && resized;
      const dx = resized ? tb[0][2] + b.size.x / 2 - (ta[0][2] + a.size.x / 2) : tb[0][2] - ta[0][2];
      const dy = resized ? tb[1][2] + b.size.y / 2 - (ta[1][2] + a.size.y / 2) : tb[1][2] - ta[1][2];
      // the text changed the block's size — a caption sized to its text in one
      // state and to the full width in another — which is a relayout, not a
      // movement: centred, it stays where it is, so it is not shifted
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
    // a hand-made correction to the caption: in the design file hover only changes its colour
    if (a.type === "TEXT" && rule?.text) Object.assign(to, rule.text);
    if (Object.keys(to).length) mark.set(a, to);

    if (!sameKids) {
      // The hover state is built differently in the design file: another image,
      // an extra layer. There is nothing to repair it with, so the default
      // state's image is simply scaled about its centre.
      const leaves = ka.filter((c) => c.visible !== false && !(c.children || []).length);
      if (leaves.length === 1 && rule.repair.imageScale) {
        const k = rule.repair.imageScale;
        mark.set(leaves[0], { scale: `${k} ${k}` });
      }
      return true;
    }
    return ka.every((c, i) => {
      const ok = markHover(c, kb[i], mark, rule, false);
      // the branch that did not match is skipped during the repair; the rest moves as in the design file
      return ok || Boolean(rule?.repair);
    });
  }

  // node → what happens to it on hover; filled in while the block is being emitted
  let hoverMarks = null;
  let hoverGroup = null;

  /**
   * Hover as the design file has it: Smart Animate.
   *
   * When the hover state differs from the default one only in position, size
   * and paint — the card lifted, the image grew, the caption changed colour —
   * two layers are unnecessary: the default state is emitted and the difference
   * handed to `:hover` rules with a transition, so the elements ease from one
   * state into the other.
   * Returns JSX, or null when the states are built differently.
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
    // no markers for VariantGroup are needed here: CSS does the switching
    return jsx.replace(/ data-hover-to="([^"]+)" data-hover-ms="\d+"/g, (m, to) => (group.targets.has(to) ? "" : m));
  }

  // the click-switched block currently being emitted
  let stateCtx = null;
  // node → its counterparts from the other states, with a different image or text
  const expanding = new Set();

  /** What a node has of its own in each state: image, text */
  const contentOf = (n) =>
    [n.hash || "", n.characters || "", (n.fills || []).filter((f) => f.visible !== false && f.type === "IMAGE").map((f) => f.imageRef).join()].join("|");

  /**
   * Walks every state of the block side by side and records how each node
   * differs from the starting state. false means the states are built
   * differently.
   */
  /** The shape of a subtree, without the detail: enough to tell whether two layers are built alike */
  const shapeOf = (n) =>
    n.visible === false ? "-" : `${n.type}:${n.name}:${n.hash || ""}:${n.characters || ""}(${(n.children || []).map(shapeOf).join(",")})`;

  /**
   * A layer built differently in different states — a phone screen in the
   * light and the dark theme are two different designs — but standing in the
   * same place. One shape cannot ease into another, so every variant of the
   * layer is emitted whole and the right one shown per state, the way leaves
   * with different images are. Their ancestors are what move.
   */
  function markAltTrees(nodes, ids, ctx) {
    const a = nodes[0];
    const t = (n) => n.relativeTransform || [[1, 0, 0], [0, 1, 0]];
    const near = (n) =>
      Math.abs((n.size?.x ?? 0) - (a.size?.x ?? 0)) < 64 && Math.abs((n.size?.y ?? 0) - (a.size?.y ?? 0)) < 64 &&
      Math.abs(t(n)[0][2] - t(a)[0][2]) < 32 && Math.abs(t(n)[1][2] - t(a)[1][2]) < 32;
    // a raster and a frame of the same layer differing in size — the raster
    // carries margins for the shadow — is fine: each variant is emitted with
    // its own geometry and the positions need only roughly agree
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
    // a layer visible in every state but built differently: show the variants whole
    if (differs) return !isRoot && vis.every(Boolean) && ctx.altTrees !== false && markAltTrees(nodes, ids, ctx);
    if (!vis.some(Boolean)) return true;
    if (!vis[0]) return false; // a layer absent from the starting state cannot be eased in

    const m = { css: {}, hide: ids.filter((_, i) => !vis[i]), swap: {} };

    // which element switches the state depends on the state: on the first slide, back does nothing
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
      // a leaf with a different image or text in another state: both are emitted and the right one shown
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
   * A carousel as the design file has it: Smart Animate on click.
   *
   * When the block's states differ only in where the parts sit, in paint, and
   * in the content of individual leaves — an arrow became active, a dot changed
   * colour — one tree is emitted and CSS rules keyed on the `data-state`
   * attribute
   * at the root carry the difference between states. The strip of slides
   * glides rather than being swapped out. The attribute is switched by
   * `components/StateGroups.tsx`.
   */
  /** A variant's properties from its name: "mode=light, step=1" → { mode: "light", step: "1" } */
  const variantProps = (id) =>
    Object.fromEntries(
      (nodeById[id]?.name || "").split(",").map((p) => p.split("=").map((x) => x.trim())).filter((p) => p.length === 2)
    );

  /** Variant properties that change the content, such as the theme: their value appears in the variant's layer names */
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
   * Bring the states to a common shape, so one can ease into another.
   *
   * Figma Sites rasterises whatever a state does not show: in the App Login
   * carousel on POT the hidden slide is an image in one state and a real frame
   * of phones in another. The dark theme also names its layers differently —
   * "Content Dark" rather than "Content Light" — and puts them in another
   * order. Here a rasterised layer is replaced with the real one from the
   * nearest state, meaning the one that differs least, of the same theme, and
   * layer names and order are aligned to the starting state. Works on copies
   * of the trees.
   */
  function harmonize(nodes, props, content = contentProps(nodes, props)) {
    const base = nodes[0];
    const kids = (n) => (n.children || []).filter((c) => c.visible !== false);
    // the same layer under another name, with the theme in it
    if (nodes.some((n) => n.name !== base.name) && nodes.every((n) => n.type === base.type)) {
      const same = (n) => kids(n).map((c) => c.name).sort().join("|") === kids(base).map((c) => c.name).sort().join("|");
      if (nodes.every(same)) nodes.forEach((n) => (n.name = base.name));
    }
    // children keep the order of the starting state
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
    // Rasterised layers. Across a row — the same layer in every state — some
    // are images and some are frames. The theme is the variant property whose
    // value shows up in the layer names, as in "Content Light", and the donor
    // for a raster is only taken from a state of the same theme.
    const lists = nodes.map(kids);
    if (lists.some((l) => l.length !== lists[0].length)) return;
    lists[0].forEach((_, i) => {
      const row = lists.map((l) => l[i]);
      // a raster in the export is an IMAGE node; differing icons, which are SVG, are different content and are left alone
      if (row.every((c) => c.type === row[0].type) || row.some((c) => c.name !== row[0].name)) return;
      if (!row.some((c) => c.type === "IMAGE") || row.some((c) => !(c.children || []).length && c.type !== "IMAGE")) return;
      // Within one theme there is a single form: a raster if any state of that
      // theme has one, because that is how Figma Sites shows the theme — in the
      // dark theme the icons on the raster are white while the frame from the
      // export has them black — and otherwise a frame. Across themes the form
      // may differ, and such layers are emitted as variants further on
      // (markAltTrees).
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
   * In the design file click-to-zoom is set only on the slide visible in its
   * own carousel state. One tree is emitted, that of the starting state, so
   * every layer that zooms in any state is marked in it.
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
      // second attempt: the states brought to a common shape
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
    // no markers for VariantGroup are needed here: the data-state attribute does the switching
    return jsx.replace(/ data-swap-to="([^"]+)" data-swap-ms="\d+"/g, (m, to) => (group.targets.has(to) ? "" : m));
  }

  /** The class and attributes of a node inside a click-switched block */
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
    // the leaf is shown in some states but not all
    const all = [...g.targets];
    const hidden = m.only ? all.filter((id) => !m.only.includes(id)) : m.hide;
    for (const id of hidden) g.rules.push(`${at(id)} { display: none !important; }`);
    if (Object.keys(m.swap).length) extra += ` data-swap-map='${JSON.stringify(m.swap)}'`;
    return extra;
  }

  /** The class of a node inside a hover block, and its rules */
  function hoverClass(node, baseTransform) {
    if (!hoverGroup) return "";
    const g = hoverGroup;
    const root = node === g.root;
    let to = hoverMarks.get(node);
    if (!root && !to) return "";
    // The node already has a transform, a −50% shift to centre it for example.
    // A separate scale property would apply after it and drag the image
    // sideways, so the scale is appended to the same transform, where it acts
    // first, about the centre.
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

  /** The classes and attributes a node gets from hover blocks and from state blocks */
  function motionAttrs(node, baseTransform) {
    const classes = [];
    const hover = hoverClass(node, baseTransform);
    if (hover) classes.push(hover);
    const extra = stateAttrs(node, baseTransform, classes);
    return (classes.length ? ` className="${classes.join(" ")}"` : "") + extra;
  }

  // the width of the breakpoint being emitted: the hand-written components' spacing depends on it
  let breakpoint = 0;
  const setBreakpoint = (w) => { breakpoint = w; };

  /**
   * A hand-written component with no counterpart in the design file, such as
   * the button in the first screen of the home page. It becomes the node's last
   * child, taking the width and the alignment of the sibling above it.
   */
  function addition(node, flowKids, pad) {
    return additions
      // hasText narrows it down when the block name is not unique: one of its children must carry that text
      .filter((a) => a.into && [].concat(a.into).includes(node.name)) // the block name; several of them when the breakpoints name it differently
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
          // lang: false means the component does not need the language; props
          // is a ready-made string of properties and propsAt adds to it at one
          // particular design width
          `${pad}${indentUnit}${indentUnit}<${a.component}${a.lang === false ? "" : ` lang="${lang}"`}${a.props ? ` ${a.props}` : ""}${a.propsAt?.[breakpoint] ? ` ${a.propsAt[breakpoint]}` : ""}${a.full ? " full" : ""} />\n` +
          `${pad}${indentUnit}</div>\n`
        );
      })
      .join("");
  }

  /** Text in JSX: a line break goes in as its own expression, or JSX swallows it */
  const literal = (text) =>
    text
      .split("\n")
      .map((l, i) => (i === 0 ? "" : `{"\\n"}`) + (l ? `{\`${esc(l)}\`}` : ""))
      .join("");

  /**
   * What a text node holds.
   *
   * In Figma `\n` is a new paragraph and U+2028 a line break inside one. A
   * paragraph can be a list item, and a stretch of characters can carry its own
   * style.
   * Returns the JSX and a flag saying a list is inside, in which case the node
   * has to be a <div>.
   */
  function textBody(node, pad) {
    // The original keeps the double spaces from the design file while HTML
    // collapses them, so the second space and any after it are made
    // non-breaking.
    const chars = (node.characters || "").replace(/ {2,}/g, (m) => " " + "\u00a0".repeat(m.length - 1));
    const ids = node.characterStyleOverrides || [];
    const table = node.styleOverrideTable || {};
    usedFonts.add(fontKey(node.style));

    // A heading where one word lights up on hover (overrides.json →
    // hoverWords): the space belongs to the word, otherwise the highlight would
    // flicker between words. The highlight from the design file is a class.
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

    // List: the marker sits in the item's indent, as in the original
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

  /** The attributes of a switching node: where a click and a hover lead */
  function triggers(node, targets) {
    let out = "";
    const click = swapOf(node, "ON_CLICK");
    if (click && targets.has(click.to)) out += ` data-swap-to=${JSON.stringify(click.to)} data-swap-ms="${click.ms}"`;
    const hover = swapOf(node, "ON_HOVER");
    if (hover && targets.has(hover.to)) out += ` data-hover-to=${JSON.stringify(hover.to)} data-hover-ms="${hover.ms}"`;
    return out;
  }

  /** A node's position and size within its parent */
  function place(node, parent) {
    const isAbs = node.layoutPositioning === "ABSOLUTE" || !parent?.layoutMode;
    const auto = { ...hugs(node) };

    // The aspect ratio is locked: when the node stretches along one axis the
    // other is derived from it. That is how a background image grows with the
    // width of the window.
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
    // a node stretched between two edges has no size of its own; the insets give it one
    if (abs.left !== undefined && abs.right !== undefined) delete size.width;
    if (abs.top !== undefined && abs.bottom !== undefined) delete size.height;
    // Figma draws layers in order, while in CSS a positioned block lands on top
    // of its ordinary siblings even when it comes before them. So an ordinary
    // block preceded by a positioned sibling — a ground, a darkening layer —
    // is given a position too, or it ends up underneath it, as the heading of
    // the Autotor cover did under its gradient.
    const lift = {};
    if (!isAbs) {
      const siblings = (parent.children || []).filter((c) => c.visible !== false);
      const at = node.id ? siblings.findIndex((c) => c.id === node.id) : -1;
      if (at > 0 && siblings.slice(0, at).some((c) => c.layoutPositioning === "ABSOLUTE")) lift.position = "relative";
    }
    return aspect ? { ...lift, ...abs, ...size, aspectRatio: aspect } : { ...lift, ...abs, ...size };
  }

  // Hand-written components in place of markup from the design file: what was
  // found and with what data it was emitted. The generator writes Storybook's
  // data from this list.
  const componentCalls = [];
  const SIZES = { 375: "mobile", 800: "tablet", 1280: "desktop" };
  const visibleKids = (n) => (n.children || []).filter((c) => c.visible !== false);
  const texts = (n, out = []) => {
    if (n.visible === false) return out;
    // a line break inside a paragraph is U+2028 in Figma; the component keeps it as an ordinary newline
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
   * A project card on the home page: the real components/ProjectCard.tsx.
   *
   * In the design file this is a block of two parts, "Image conteiner" and
   * "Text conteiner". The shared styling — sizes, corner radius, shadow,
   * typography, the hover lift — lives in the component. Only what each
   * project has of its own goes into it from here: the link, the text, the
   * image and where it sits in its window, including how it grows on hover.
   * Returns null when the block is not built like a card, in which case it is
   * emitted as it stands.
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

    // the image window: some cards have their own aspect ratio, corner radius or ground
    const window_ = { ...place(found.image, found.card), ...frameStyle(found.image, assets, assetMap) };
    const frame = {};
    for (const k of ["aspectRatio", "borderRadius", "background", "backgroundImage"]) if (window_[k] !== undefined) frame[k] = window_[k];

    // the image itself; its position in the window comes from the design file
    const leaf = leaves[0];
    const { backgroundImage, backgroundSize, backgroundPosition, backgroundRepeat, ...position } = {
      ...place(leaf, found.image),
      ...frameStyle(leaf, assets, assetMap),
    };
    const src = /^url\((.+)\)$/.exec(backgroundImage || "")?.[1];
    if (!src || backgroundSize !== "cover") return null;

    // hover: where the image grows to and by how much
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
   * The small "See also" card: components/RelatedCard.tsx.
   *
   * In the design file this is "Card-projects-small": a window with an image
   * and a caption. The styling and the hover live in the component; what goes
   * in from here is the link, the caption, the image with its position and its
   * hover growth, and on tablet and phone the window's height and shadow as
   * well, when the design file gives them something other than the usual.
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
    // On one page of the design file three cards are detached from the
    // component and named differently, so a card is also recognised by its
    // shape: a window with a dark ground, and a caption.
    const named = node.name === "Card-projects-small";
    if (!named && frameStyle(window_, assets, assetMap).background !== "#0c1543") return null;

    // it leads to the project named in its own caption; see the note on links in emit
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
   * The outlined site button: components/Button.tsx.
   * In the design file: "Button" with a link, holding a 40px outlined plate and
   * a single label.
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
   * The light/dark theme switch inside the cases, the "toggle" and
   * "toggle-mobile" components. The marker is there for the shared hover: an
   * outline in the colour of the circle on the knob — see StateGroups.tsx and
   * `[data-toggle]` in app/globals.css.
   */
  const toggleAttr = (node) => (/^toggle(-mobile)?$/.test(node.name || "") ? ' data-toggle=""' : "");

  function emit(node, parent, depth, insideLink = false, swapTargets = null) {
    const pad = indentUnit.repeat(depth);

    // Invisible nodes never reach the markup
    if (node.visible === false) return "";

    // Project cards are hand-written components, not markup from the design file
    if (!insideLink && !hoverGroup && !stateCtx) {
      const card = projectCard(node, pad) || relatedCard(node, pad) || siteButton(node, parent, pad);
      if (card) return card;
    }

    // A leaf carrying a different image or text in another state of the block:
    // its counterparts are emitted after it and CSS shows the right one.
    const twins = stateCtx?.marks.get(node)?.alts;
    if (twins && !expanding.has(node)) {
      expanding.add(node);
      const out = emit(node, parent, depth, insideLink, swapTargets) + twins.map((t) => emit(t, parent, depth, insideLink, swapTargets)).join("");
      expanding.delete(node);
      return out;
    }

    // A rotated group is not a block but a shared rotation for its children.
    // As the original does, it is unwrapped: each child moves into the group's
    // parent with the matrices composed.
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
    // a hand-made styling correction on top of the design file (overrides.json → frameStyles), by layer name and design width
    const ownFrame = frameStyles.find((r) => r.name === node.name)?.at?.[breakpoint];
    if (ownFrame) Object.assign(style, ownFrame);
    if (node.pull) style[node.pull.axis === "VERTICAL" ? "marginTop" : "marginLeft"] = px(node.pull.value);

    // Rotation about the centre. The back arrow is the forward arrow turned 180°.
    const angle = rotation(node);
    if (angle) style.transform = [style.transform, `rotate(${angle}deg)`].filter(Boolean).join(" ");

    // The node's link. A "See also" card leads to the project named in its
    // caption: on some pages of the original the caption was replaced while the
    // link stayed with the main component and points elsewhere, so the URL is
    // taken from the caption. Nested links are not allowed, so children inside
    // an <a> are not wrapped.
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

    // An interactive block: its states are emitted as layers
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
      if (style.transform) box.transform = style.transform; // rotation: the back arrow is the forward one turned round
      if (style.opacity != null) box.opacity = style.opacity;
      // the block can itself switch the state of the block around it: a
      // carousel arrow is a button with a hover state of its own
      const outer = triggers(node, enclosing) + motionAttrs(node, style.transform) + toggleAttr(node);
      if (outer.includes("data-swap-to") || outer.includes("data-swap-map")) box.cursor = "pointer";
      const inner = new Set([...enclosing, ...group.targets]);
      const panels = group.variants
        .map(({ id, tree: v, info }) => {
          // the panel fills the block's box; VariantGroup decides whether it sits in the flow or over it
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
        // a link block: the link holds the box and the states sit inside it
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

    // A node that switches the block's state on click or on hover
    let attrs = (swapTargets ? triggers(node, swapTargets) : "") + motionAttrs(node, style.transform) + toggleAttr(node);
    if (attrs.includes("data-swap-to") || attrs.includes("data-swap-map")) style.cursor = "pointer";

    // Behaviour from the design file: parallax on scroll and click to zoom
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

    // An image, or an SVG generated out of Figma, becomes its own <img> tag
    const asset = nodeAsset(node, assets);
    if (asset) {
      asset.src = resolve(asset.src.replace("/a/", ""));
      usedAssets.add(asset.src);
      // the node's own opacity is already baked into the image; the group's opacity remains
      const assetOpacity = node.groupOpacity != null && node.groupOpacity !== 1 ? node.groupOpacity : null;

      // A rotated image placed by coordinates. The original stretches it with
      // its parent after the rotation; an SVG with a viewBox the size of the
      // rotated rectangle, holding the image with its matrix, does the same.
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
          // an <svg> is not stretched by insets, so a wrapper holds its size
          `${pad}<span${swapAttr} style=${styleLiteral(frame)}>\n` +
          `${pad}${indentUnit}<svg viewBox="0 0 ${round(bw)} ${round(bh)}" preserveAspectRatio="none" aria-hidden="true" style={{ position: "absolute", left: "0", top: "0", width: "100%", height: "100%", overflow: "visible" }}>\n` +
          `${pad}${indentUnit}${indentUnit}<image href=${JSON.stringify(asset.src)} x="${round(img.left)}" y="${round(img.top)}" width="${round(img.width)}" height="${round(img.height)}" preserveAspectRatio="none" transform="matrix(${r(a)} ${r(c)} ${r(b)} ${r(d)} ${round(-minX)} ${round(-minY)})" />\n` +
          `${pad}${indentUnit}</svg>\n` +
          `${pad}</span>\n`
        );
      }

      // The fill, stroke, corner radius and shadow of the node are already
      // baked into the image, so only its position, size and rotation remain.
      const own = place(node, parent);
      for (const k of ["marginTop", "marginLeft"]) if (style[k]) own[k] = style[k];
      if (style.transform) own.transform = style.transform;
      if (assetOpacity != null) own.opacity = assetOpacity;
      if (style.cursor) own.cursor = style.cursor;

      // The image is wider than the node's box by the shadow and the stroke, so it is offset
      const box = assetBox(node, asset);
      const bw = node.size?.x ?? 0;
      const bh = node.size?.y ?? 0;
      const flush =
        Math.abs(box.left) < 0.05 && Math.abs(box.top) < 0.05 &&
        Math.abs(box.width - bw) < 0.05 && Math.abs(box.height - bh) < 0.05;
      // an image with no explicit size, stretched between edges, needs a
      // wrapper: an <img> is not stretched by insets
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
      // auto-width text does not wrap in Figma
      if (style.textOverflow) style.whiteSpace = "nowrap";
      else if (node.textAutoResize === "WIDTH_AND_HEIGHT") style.whiteSpace = multiline ? "pre" : "nowrap";
      else if (multiline) style.whiteSpace = "pre-line";
      // a hand-made text styling correction on top of the design file (overrides.json → textStyles), applied last
      const own = textStyles.find((r) => (r.exact != null ? node.characters === r.exact : (node.characters || "").startsWith(r.startsWith)));
      if (own) Object.assign(style, own.style);
      // the line break from the design file applies on phones only: from 480px
      // the mobile layout is wider than the design file — tablet starts at
      // 800px — and the heading fits on one line
      const shown = own?.phoneBreaks ? body.replaceAll('{"\\n"}', '<br className="sm:hidden" />') : body;
      const tag = list ? "div" : tagFor(node);
      if (link) {
        // text that is a link: the link goes inside, so the text's tag, a heading or a paragraph, is kept
        const s = styleLiteral(style);
        return `${pad}<${tag}${swapAttr}${s ? ` style=${s}` : ""}><${linkTag} ${linkAttrs}>${shown}</${linkTag}></${tag}>\n`;
      }
      const s = styleLiteral(style);
      return `${pad}<${tag}${swapAttr}${s ? ` style=${s}` : ""}>${shown}</${tag}>\n`;
    }

    // A cropped fill: the image goes in as its own tag inside a clipping
    // block, because a background cannot express the part that is wanted
    const fill = imageFill(node, assets, assetMap);
    let cropped = "";
    // A video fill: the prototype inside the phone screen on POT. The export
    // holds no video file; it was downloaded from the original and recompressed,
    // and overrides.json → videos maps hash to file. The frame is given as it
    // is for an image: imageTransform says which part of the video the layer
    // shows.
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
    // a hand-picked image in place of the design file's (overrides.json →
    // imageSwaps): the window takes the new image's aspect ratio and the image
    // fills it completely
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
      // as a percentage of the block, so the crop holds when the block stretches
      const bw = node.size?.x || 1;
      const bh = node.size?.y || 1;
      const pc = (v, base) => `${Math.round((v / base) * 1e4) / 100}%`;
      const inner = `{{ position: "absolute", left: "${pc(c.left, bw)}", top: "${pc(c.top, bh)}", width: "${pc(c.width, bw)}", height: "${pc(c.height, bh)}", maxWidth: "none" }}`;
      cropped =
        `${indentUnit.repeat(depth + 1)}<img src=${JSON.stringify(fill.src)} alt="" aria-hidden="true" loading="lazy" decoding="async" style=${inner} />\n`;
    }

    // When there are absolutely positioned children inside, this node is their origin
    const visibleKids = (node.children || []).filter((c) => c.visible !== false);
    const hasAbsoluteKid = visibleKids.some(
      (c) => c.layoutPositioning === "ABSOLUTE" || !node.layoutMode
    );
    if (hasAbsoluteKid && !style.position) style.position = "relative";

    // A negative gap, with the elements overlapping, cannot be expressed by CSS
    // gap, so each following child is pulled back by a negative margin.
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
          // a hand-written component beside the node: both go into the shared row or column
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
