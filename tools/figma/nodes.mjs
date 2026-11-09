// Reading the Figma Sites export: colour, typography, geometry, assets.
// The export is a tree of Figma nodes, each with its auto-layout, padding,
// fills and text style. This is where all of that is turned into CSS.

/** A Figma colour, 0..1 per channel, as a CSS string */
export function cssColor({ color, opacity = 1 }) {
  if (!color) return null;
  const to255 = (v) => Math.round(v * 255);
  const a = (color.a ?? 1) * opacity;
  const [r, g, b] = [to255(color.r), to255(color.g), to255(color.b)];
  if (a >= 1) {
    const hex = [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
    return `#${hex}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

/**
 * The resulting colour of the solid fills. In Figma fills stack bottom to top:
 * the top one covers those below, and a translucent one blends with them. This
 * used to take the first fill, which made the App Store block on POT — black
 * underneath, white over it — come out black. Since 2026-10-21 the fills are
 * composited as Figma does it: on the VV cover a purple below and 20% black
 * above give a dark purple.
 */
export function solidFill(node) {
  const fills = (node.fills || []).filter((x) => x.visible !== false && x.type === "SOLID" && x.color);
  if (!fills.length) return null;
  if (fills.length === 1) return cssColor(fills[0]);
  // source-over compositing from the bottom up, channels 0..1
  let r = 0, g = 0, b = 0, a = 0;
  for (const f of fills) {
    const fa = (f.color.a ?? 1) * (f.opacity ?? 1);
    const na = fa + a * (1 - fa);
    if (na <= 0) continue;
    r = (f.color.r * fa + r * a * (1 - fa)) / na;
    g = (f.color.g * fa + g * a * (1 - fa)) / na;
    b = (f.color.b * fa + b * a * (1 - fa)) / na;
    a = na;
  }
  return cssColor({ color: { r, g, b, a } });
}

/**
 * A Figma linear gradient as CSS.
 *
 * In Figma the direction is a matrix that maps the object's coordinates into
 * the gradient's space. To get an angle for CSS the matrix has to be inverted
 * and the gradient's axis followed.
 */
export function linearGradient(fill) {
  const stops = fill.gradientStops || [];
  if (!stops.length) return null;
  const t = fill.transform;
  let angle = 180;
  if (t) {
    const [[a, b, tx], [c, d, ty]] = t;
    const det = a * d - b * c;
    if (det) {
      const ia = d / det, ib = -b / det, ic = -c / det, id = a / det;
      const itx = -(ia * tx + ib * ty), ity = -(ic * tx + id * ty);
      const at = (x, y) => [ia * x + ib * y + itx, ic * x + id * y + ity];
      const [x0, y0] = at(0, 0.5);
      const [x1, y1] = at(1, 0.5);
      // in CSS 0deg points up and the angle grows clockwise, while the screen's Y axis points down
      angle = ((Math.atan2(x1 - x0, -(y1 - y0)) * 180) / Math.PI + 360) % 360;
    }
  }
  const op = fill.opacity ?? 1;
  const list = stops
    .map((st) => `${cssColor({ color: st.color, opacity: op })} ${Number((st.position * 100).toFixed(2))}%`)
    .join(", ");
  return `linear-gradient(${Number(angle.toFixed(2))}deg, ${list})`;
}

/**
 * A Figma radial gradient as CSS. The `transform` matrix maps the layer, 0..1
 * on each axis, into the gradient's space, where the centre is (0.5, 0.5) and
 * the radius 0.5. Inverting it gives the centre and the semi-axes of the
 * ellipse as fractions of the layer. CSS only knows axis-aligned ellipses, so
 * any rotation that is not a multiple of 90° is lost. Added 2026-10-21: on VV
 * it is what dissolves the edges of the Icon Library image into white.
 */
export function radialGradient(fill) {
  const stops = fill.gradientStops || [];
  if (!stops.length) return null;
  let cx = 50, cy = 50, rx = 50, ry = 50;
  const t = fill.transform;
  if (t) {
    const [[a, b, tx], [c, d, ty]] = t;
    const det = a * d - b * c;
    if (det) {
      const ia = d / det, ib = -b / det, ic = -c / det, id = a / det;
      const itx = -(ia * tx + ib * ty), ity = -(ic * tx + id * ty);
      const at = (x, y) => [ia * x + ib * y + itx, ic * x + id * y + ity];
      const [x0, y0] = at(0.5, 0.5);
      const [x1, y1] = at(1, 0.5);
      const [x2, y2] = at(0.5, 1);
      cx = x0 * 100; cy = y0 * 100;
      rx = Math.max(Math.abs(x1 - x0), Math.abs(x2 - x0)) * 100;
      ry = Math.max(Math.abs(y1 - y0), Math.abs(y2 - y0)) * 100;
    }
  }
  const n = (v) => Number(v.toFixed(2));
  const op = fill.opacity ?? 1;
  const list = stops
    .map((st) => `${cssColor({ color: st.color, opacity: op })} ${n(st.position * 100)}%`)
    .join(", ");
  return `radial-gradient(${n(rx)}% ${n(ry)}% at ${n(cx)}% ${n(cy)}%, ${list})`;
}

/**
 * An image fill.
 *
 * FILL is ordinary cover-and-clip and a background is enough for it.
 * STRETCH is Figma's crop mode: which part of the image to show is described by
 * the `imageTransform` matrix. A background cannot express that, so for those
 * the position and size of a separate image inside a clipping block are worked
 * out here.
 */
export function imageFill(node, assets, assetMap = {}) {
  const f = (node.fills || []).find((x) => x.visible !== false && x.type === "IMAGE");
  if (!f) return null;
  const a = assets[f.imageRef];
  if (!a) return null;

  const src = `/a/${assetMap[a.url] ?? a.url}`;
  const box = node.size || {};

  if (f.scaleMode === "STRETCH" && f.imageTransform && box.x && box.y) {
    const [[sx, , tx], [, sy, ty]] = f.imageTransform;
    if (sx && sy) {
      return {
        src,
        crop: {
          width: box.x / sx,
          height: box.y / sy,
          left: (-tx * box.x) / sx,
          top: (-ty * box.y) / sy,
        },
      };
    }
  }

  return { src, fit: f.scaleMode === "FIT" ? "contain" : "cover" };
}

/** The node's own asset; IMAGE and SVG reference a file by hash */
export function nodeAsset(node, assets) {
  if (!node.hash) return null;
  const a = assets[node.hash];
  if (!a) return null;
  return {
    src: `/a/${a.url}`,
    width: a.size?.x,
    height: a.size?.y,
    offsets: a.offsets,
    generated: a.type === "GENERATED_ASSET",
  };
}

/**
 * Where the node's image sits relative to its box.
 *
 * The generated image is wider than the node, because the shadow and the
 * stroke are baked into it. How far it reaches out on each side is recorded in
 * `offsets`, as a percentage of the node's size. On a degenerate node — a line
 * of zero height — there is nothing to take a percentage of, so the image is
 * centred instead.
 */
export function assetBox(node, asset) {
  const bw = node.size?.x ?? 0;
  const bh = node.size?.y ?? 0;
  const o = asset.offsets;
  const part = (side, base) => {
    const v = o?.[side];
    if (!v) return 0;
    return v.unit === "PERCENT" ? (v.value * base) / 100 : v.value;
  };
  const axis = (box, own, a, b) => {
    if (o) {
      const start = part(a, box);
      const length = box - start - part(b, box);
      // on a line of zero thickness the overhang is recorded in pixels
      if (length >= 0.01) return { start, length };
    }
    const length = own ?? box;
    return { start: box / 2 - length / 2, length };
  };
  const x = axis(bw, asset.width, "left", "right");
  const y = axis(bh, asset.height, "top", "bottom");
  return { left: x.start, top: y.start, width: x.length, height: y.length };
}

/**
 * The same image position, in CSS: as a percentage of the node's box, so the
 * image stretches with the node when it is pinned to both edges. A degenerate
 * box has nothing to take a percentage of, so there it is pixels.
 */
export function assetBoxCss(node, asset) {
  const b = assetBox(node, asset);
  const bw = node.size?.x ?? 0;
  const bh = node.size?.y ?? 0;
  const pct = (v, base) => `${Math.round((v / base) * 1e4) / 100}%`;
  return {
    left: bw >= 1 ? pct(b.left, bw) : px(b.left),
    width: bw >= 1 ? pct(b.width, bw) : px(b.width),
    top: bh >= 1 ? pct(b.top, bh) : px(b.top),
    height: bh >= 1 ? pct(b.height, bh) : px(b.height),
  };
}

/** The weight and style from a font's PostScript name */
export function fontWeight(style = {}) {
  const name = (style.fontPostScriptName || style.fontStyle || "").toLowerCase();
  if (name.includes("black") || name.includes("heavy")) return 900;
  if (name.includes("extrabold")) return 800;
  if (name.includes("bold")) return 700;
  if (name.includes("semibold")) return 600;
  if (name.includes("medium")) return 500;
  if (name.includes("light")) return 300;
  if (name.includes("thin")) return 100;
  return 400;
}

const ALIGN = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", SPACE_BETWEEN: "space-between", STRETCH: "stretch", BASELINE: "baseline" };

/** The frame's own styles: direction, padding, alignment, background, corners, shadows */
export function frameStyle(node, assets, assetMap = {}) {
  const s = {};
  if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
    s.display = "flex";
    s.flexDirection = node.layoutMode === "HORIZONTAL" ? "row" : "column";
    // With space-between alignment Figma distributes the items itself, and
    // itemSpacing is left in the data as a stale value. Passed on as gap it
    // would become a minimum and push the row apart.
    const spread = node.primaryAxisAlignItems === "SPACE_BETWEEN";
    if (node.layoutWrap === "WRAP") {
      // in Figma wrapping is set separately, as is the distance between rows
      s.flexWrap = "wrap";
      if (node.itemSpacing && !spread) s.columnGap = px(node.itemSpacing);
      if (node.counterAxisSpacing) s.rowGap = px(node.counterAxisSpacing);
    } else if (node.itemSpacing > 0 && !spread) {
      s.gap = px(node.itemSpacing);
    }
    if (node.primaryAxisAlignItems) s.justifyContent = ALIGN[node.primaryAxisAlignItems];
    // Figma packs children to the start of the cross axis by default, CSS
    // stretches them. Without an explicit value a column would stretch to the
    // row's height and drift to the middle.
    s.alignItems = ALIGN[node.counterAxisAlignItems] ?? "flex-start";
  }
  const [pt, pr, pb, pl] = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
  if (pt || pr || pb || pl) s.padding = `${px(pt || 0)} ${px(pr || 0)} ${px(pb || 0)} ${px(pl || 0)}`;

  // Figma stacks fills bottom to top. Solid fills under the image are the
  // background colour; solid fills over it — the darkening of the drawing on
  // Ostral — would end up behind it in CSS, so they become a separate layer
  // above the image.
  const visible = (node.fills || []).filter((f) => f.visible !== false);
  const imgAt = visible.findIndex((f) => f.type === "IMAGE");
  const img = imageFill(node, assets, assetMap);
  const overImage = img && !img.crop && imgAt !== -1 ? visible.slice(imgAt + 1).filter((f) => f.type === "SOLID") : [];

  // On TEXT the fill is the colour of the letters, set by textStyle rather than the background
  const bg = node.type === "TEXT" ? null : solidFill({ fills: imgAt !== -1 && img && !img.crop ? visible.slice(0, imgAt) : visible });
  if (bg) s.background = bg;

  // Background layers: the image at the bottom, gradients and fills over it, as in Figma
  const layers = [];
  if (img && !img.crop) { s.backgroundSize = img.fit; s.backgroundPosition = "center"; s.backgroundRepeat = "no-repeat"; }
  for (const f of visible) {
    if (f.type === "GRADIENT_LINEAR" || f.type === "GRADIENT_RADIAL") {
      const g = f.type === "GRADIENT_LINEAR" ? linearGradient(f) : radialGradient(f);
      if (g) layers.unshift(g);
    } else if (overImage.includes(f)) {
      const c = cssColor(f);
      layers.unshift(`linear-gradient(${c}, ${c})`);
    }
  }
  if (img && !img.crop) layers.push(`url(${img.src})`);
  if (layers.length) s.backgroundImage = layers.join(", ");

  if (node.cornerRadius) s.borderRadius = px(node.cornerRadius);
  else if (node.rectangleCornerRadii?.some(Boolean)) s.borderRadius = node.rectangleCornerRadii.map(px).join(" ");

  if (node.clipsContent) s.overflow = "hidden";
  // Horizontal scrolling set in the design file — on POT, the rows of phones on
  // a phone — means the row is paged with a finger and no scrollbar shows. The
  // vertical kind is not carried over: it sits on the breakpoints' root frames
  // and is the page's own scrolling.
  if (node.clipsContent && node.overflowDirection === "HORIZONTAL_SCROLLING") {
    delete s.overflow;
    s.overflowX = "auto";
    s.overflowY = "hidden";
    s.scrollbarWidth = "none";
    s.overscrollBehaviorX = "contain";
  }

  // A stroke in Figma takes no space: it is drawn over the block and does not
  // move the content. A CSS border would, so it is drawn as a shadow with no
  // blur instead.
  const shadows = [];
  const stroke = (node.strokes || []).find((x) => x.visible !== false && x.type === "SOLID");
  const weight = node.strokeWeight ?? 1; // 1 by default; the export omits default values
  const sides = node.individualStrokeWeights || (weight ? { top: weight, right: weight, bottom: weight, left: weight } : null);
  if (stroke && sides) {
    const c = cssColor(stroke);
    const { top = 0, right = 0, bottom = 0, left = 0 } = sides;
    const even = top === right && right === bottom && bottom === left;
    if (node.strokeDashes?.length && even) {
      s.outline = `${px(top)} dashed ${c}`;
      s.outlineOffset = node.strokeAlign === "OUTSIDE" ? "0" : px(-top);
    } else if (node.strokeAlign === "OUTSIDE" && even) {
      shadows.push(`0 0 0 ${px(top)} ${c}`);
    } else if (node.strokeAlign === "CENTER" && even) {
      shadows.push(`0 0 0 ${px(top / 2)} ${c}`, `inset 0 0 0 ${px(top / 2)} ${c}`);
    } else if (even) {
      shadows.push(`inset 0 0 0 ${px(top)} ${c}`);
    } else {
      if (top) shadows.push(`inset 0 ${px(top)} 0 0 ${c}`);
      if (bottom) shadows.push(`inset 0 ${px(-bottom)} 0 0 ${c}`);
      if (left) shadows.push(`inset ${px(left)} 0 0 0 ${c}`);
      if (right) shadows.push(`inset ${px(-right)} 0 0 0 ${c}`);
    }
  }

  for (const e of node.effects || []) {
    if (e.visible === false || (e.type !== "DROP_SHADOW" && e.type !== "INNER_SHADOW")) continue;
    shadows.push(`${e.type === "INNER_SHADOW" ? "inset " : ""}${px(e.offset?.x || 0)} ${px(e.offset?.y || 0)} ${px(e.radius || 0)} ${px(e.spread || 0)} ${cssColor(e)}`);
  }
  if (shadows.length) s.boxShadow = shadows.join(", ");
  // Layer blur, the glow on the VV cover. Figma's radius is roughly two sigma
  // of a CSS blur, so it is halved; without the blur the glow came out as a
  // hard shape.
  const blur = (node.effects || []).find((e) => e.visible !== false && e.type === "LAYER_BLUR" && e.radius);
  if (blur) s.filter = `blur(${px(blur.radius / 2)})`;
  const backdrop = (node.effects || []).find((e) => e.visible !== false && e.type === "BACKGROUND_BLUR" && e.radius);
  if (backdrop) s.backdropFilter = `blur(${px(backdrop.radius / 2)})`;
  if (node.opacity != null && node.opacity !== 1) s.opacity = node.opacity;
  return s;
}

/** A font's key in the export's `fonts` table: "Family:Style" */
export const fontKey = (st = {}) => `${st.fontFamily}:${st.fontStyle}`;

/**
 * Line height. "Auto" in Figma means the height that comes with the font: the
 * original hands that to the browser as `normal`, and when a percentage of it
 * is set, multiplies the font size by that percentage.
 */
function lineHeightOf(st) {
  if (st.lineHeightUnit === "INTRINSIC_%") {
    const pct = st.lineHeightPercent;
    return pct && Math.abs(pct - 100) > 0.01 ? `${Math.round(pct * 100) / 100}%` : "normal";
  }
  return st.lineHeightPx ? px(st.lineHeightPx) : undefined;
}

/**
 * Typography from a Figma text style.
 *
 * The weight and the variable axes come from the export's `fonts` table, as
 * they do in the original: SF Pro Semibold has weight 590 and optical size 28,
 * neither of which the style name reveals.
 */
function fontStyleOf(st = {}, fonts = {}) {
  const f = fonts[fontKey(st)];
  const s = {
    fontSize: px(st.fontSize),
    // "Auto" in Figma is the line height the font itself carries; the original hands it to the browser
    lineHeight: lineHeightOf(st),
    fontWeight: f?.weight ?? fontWeight(st),
  };
  // the site's own typeface is set on the page; the rest are design-file fonts inside the cases
  if (st.fontFamily && st.fontFamily !== "Open Sans") {
    s.fontFamily = `"${st.fontFamily}", var(--font-open-sans), sans-serif`;
    const axes = (f?.variationAxes || []).filter((a) => a.tag !== "wght");
    if (axes.length) s.fontVariationSettings = axes.map((a) => `"${a.tag}" ${a.value}`).join(", ");
  }
  if (st.italic) {
    s.fontStyle = "italic";
    // the Open Sans italic is loaded as its own family, so it is not fetched on every page
    if (st.fontFamily === "Open Sans") s.fontFamily = "var(--font-open-sans-italic), var(--font-open-sans), sans-serif";
  }
  if (st.letterSpacing) s.letterSpacing = px(st.letterSpacing);
  if (st.textCase === "UPPER") s.textTransform = "uppercase";
  if (st.textCase === "LOWER") s.textTransform = "lowercase";
  if (st.textCase === "TITLE") s.textTransform = "capitalize";
  if (st.textDecoration === "UNDERLINE") s.textDecoration = "underline";
  if (st.textDecoration === "STRIKETHROUGH") s.textDecoration = "line-through";
  return s;
}

/** The styles of a text node */
export function textStyle(node, fonts = {}) {
  const st = node.style || {};
  const s = fontStyleOf(st, fonts);
  const align = st.textAlignHorizontal;
  if (align && align !== "LEFT") s.textAlign = align === "JUSTIFIED" ? "justify" : align.toLowerCase();
  const color = solidFill(node);
  if (color) s.color = color;
  // truncation with an ellipsis
  if (st.textTruncation === "ENDING") {
    s.overflow = "hidden";
    if ((st.maxLines ?? 1) <= 1) {
      s.textOverflow = "ellipsis";
      s.whiteSpace = "nowrap";
    } else {
      s.display = "-webkit-box";
      s.WebkitBoxOrient = "vertical";
      s.WebkitLineClamp = st.maxLines;
    }
  }
  return s;
}

/**
 * The style of a run inside a text: whatever differs from the node's own
 * style. In Figma a stretch of text can carry its own colour, weight or size;
 * in the export that is a style index per character plus a table of styles.
 */
export function spanStyle(node, override, fonts = {}) {
  const base = textStyle(node, fonts);
  const own = fontStyleOf({ ...(node.style || {}), ...override }, fonts);
  if (override.fills) {
    const color = solidFill({ fills: override.fills });
    if (color) own.color = color;
  }
  // letter case is set on the whole node: the original never changes it per run
  delete own.textTransform;
  const diff = {};
  for (const [k, v] of Object.entries(own)) if (v !== undefined && v !== base[k]) diff[k] = v;
  if (base.textDecoration && !own.textDecoration) diff.textDecoration = "none";
  if (base.fontStyle && !own.fontStyle) diff.fontStyle = "normal";
  return diff;
}

/** The axes along which a node hugs its content rather than having a set size */
export function hugs(node) {
  const row = node.layoutMode === "HORIZONTAL";
  const col = node.layoutMode === "VERTICAL";
  const auto = node.type === "TEXT" ? node.textAutoResize : null;
  return {
    w: (row && node.primaryAxisSizingMode !== "FIXED") || (col && node.counterAxisSizingMode !== "FIXED") || auto === "WIDTH_AND_HEIGHT",
    h: (col && node.primaryAxisSizingMode !== "FIXED") || (row && node.counterAxisSizingMode !== "FIXED") || auto === "HEIGHT" || auto === "WIDTH_AND_HEIGHT",
  };
}

/** Sizing: what is fixed, what stretches, what grows */
export function sizing(node, parent, autoAxes = hugs(node)) {
  const s = {};
  const horizontal = parent?.layoutMode === "HORIZONTAL";
  const vertical = parent?.layoutMode === "VERTICAL";
  const auto = node.textAutoResize;

  if (node.layoutGrow === 1) {
    // a growing block takes the remainder and is not inflated by its content, as in the original
    s.flex = "1 0 0px";
    if (horizontal) s.minWidth = "1px";
    if (vertical) s.minHeight = "1px";
  }
  if (node.layoutAlign === "STRETCH") s.alignSelf = "stretch";
  // Text filling a column must not widen it: a column that hugs its content
  // takes its width from the image beside it, not from the longest line.
  if (node.type === "TEXT" && vertical && node.layoutAlign === "STRETCH" && auto !== "WIDTH_AND_HEIGHT") {
    s.width = "min-content";
    s.minWidth = "100%";
  }

  // An auto-layout frame hugs its content by default: a size along an axis is
  // only set in FIXED mode. The original is built the same way, without a
  // height, so when the text breaks into a different number of lines the block
  // adjusts instead of clipping or leaving a gap.
  const { w: hugW, h: hugH } = autoAxes;

  const fixedW = !hugW && node.layoutGrow !== 1 && !(vertical && node.layoutAlign === "STRETCH");
  const fixedH = !hugH && !(horizontal && node.layoutAlign === "STRETCH");

  if (fixedW && !s.width && node.size?.x != null) s.width = px(node.size.x);
  if (fixedH && node.size?.y != null) s.height = px(node.size.y);
  // inside flex a fixed size must not be squeezed by its neighbours
  if ((horizontal && fixedW) || (vertical && fixedH)) s.flexShrink = 0;
  if (node.maxWidth != null) s.maxWidth = px(node.maxWidth);
  return s;
}

/**
 * An absolutely positioned child.
 *
 * The offset lives in the transform matrix, but pinning to the top left will
 * not do: every Figma node has constraints. Most blocks are pinned to the
 * centre, some stretch across the width, some hold to the right edge. Without
 * that, anything other than 1280 wide falls apart.
 */
/**
 * The node's rotation in degrees. In Figma's matrix [[a, b, tx], [c, d, ty]]
 * the rotation is a = cos, c = sin.
 */
export function rotation(node) {
  const t = node.relativeTransform;
  if (!t) return 0;
  const deg = (Math.atan2(t[1][0], t[0][0]) * 180) / Math.PI;
  return Math.abs(deg) < 0.01 ? 0 : Math.round(deg * 100) / 100;
}

export function absolutePosition(node, parent, autoAxes = hugs(node)) {
  const t = node.relativeTransform;
  if (!t) return {};

  const w = node.size?.x;
  const h = node.size?.y;
  // On a rotated node the offset in the matrix is where its original corner
  // ends up, not its top left edge. Taking the centre of the rotated rectangle
  // and stepping back half the size puts a centre rotation exactly right.
  let x = t[0][2];
  let y = t[1][2];
  if (rotation(node) && w != null && h != null) {
    const cx = t[0][2] + (t[0][0] * w + t[0][1] * h) / 2;
    const cy = t[1][2] + (t[1][0] * w + t[1][1] * h) / 2;
    x = cx - w / 2;
    y = cy - h / 2;
  }
  // Children's offsets are computed against the parent's size in the main
  // component. When the instance is a different width, the constraint has to be
  // measured from the original size, or a block that sat in the middle drifts.
  const pw = parent?.layoutSize?.x ?? parent?.size?.x;
  const ph = parent?.layoutSize?.y ?? parent?.size?.y;
  const pct = (v, base) => `${Math.round((v / base) * 1e4) / 100}%`;
  const c = node.constraints || {};
  const s = { position: "absolute" };

  // A block with no set size is pinned to the centre by its own middle, so if
  // the text inside takes one line instead of two the block stays centred.
  const hug = rotation(node) ? { w: false, h: false } : autoAxes;
  const shift = [];

  // horizontally
  if (pw && w != null && c.horizontal === "CENTER" && hug.w) {
    s.left = `calc(50% + ${Math.round((x + w / 2 - pw / 2) * 100) / 100}px)`;
    shift.push("translateX(-50%)");
  } else if (pw && w != null && c.horizontal === "CENTER") {
    s.left = `calc(50% + ${Math.round((x - pw / 2) * 100) / 100}px)`;
  } else if (pw && w != null && c.horizontal === "RIGHT") {
    s.right = px(pw - x - w);
  } else if (pw && w != null && c.horizontal === "SCALE") {
    s.left = pct(x, pw);
    s.right = pct(pw - x - w, pw);
    s.width = undefined;
  } else if (pw && w != null && c.horizontal === "LEFT_RIGHT") {
    s.left = px(x);
    s.right = px(pw - x - w);
    s.width = undefined;
  } else {
    s.left = px(x);
  }

  // vertically
  if (ph && h != null && c.vertical === "CENTER" && hug.h) {
    s.top = `calc(50% + ${Math.round((y + h / 2 - ph / 2) * 100) / 100}px)`;
    shift.push("translateY(-50%)");
  } else if (ph && h != null && c.vertical === "CENTER") {
    s.top = `calc(50% + ${Math.round((y - ph / 2) * 100) / 100}px)`;
  } else if (ph && h != null && c.vertical === "BOTTOM") {
    s.bottom = px(ph - y - h);
  } else if (ph && h != null && c.vertical === "SCALE") {
    s.top = pct(y, ph);
    s.bottom = pct(ph - y - h, ph);
    s.height = undefined;
  } else if (ph && h != null && c.vertical === "TOP_BOTTOM") {
    s.top = px(y);
    s.bottom = px(ph - y - h);
    s.height = undefined;
  } else {
    s.top = px(y);
  }

  if (shift.length) s.transform = shift.join(" ");
  return s;
}

export function px(v) {
  if (v == null) return undefined;
  const r = Math.round(v * 100) / 100;
  return r === 0 ? "0" : `${r}px`;
}
