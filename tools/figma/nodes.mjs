// Разбор выгрузки Figma Sites: цвета, типографика, геометрия, ассеты.
// Выгрузка — это дерево узлов Figma: у каждого есть auto-layout,
// отступы, заливки и стиль текста. Здесь всё это переводится в CSS.

/** Цвет Figma (0..1 по каналам) → строка CSS */
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

/** Первая видимая сплошная заливка */
export function solidFill(node) {
  const f = (node.fills || []).find((x) => x.visible !== false && x.type === "SOLID");
  return f ? cssColor(f) : null;
}

/**
 * Линейный градиент Figma → CSS.
 *
 * В Figma направление задано матрицей, которая переводит координаты
 * объекта в пространство градиента. Чтобы получить угол для CSS,
 * матрицу нужно обратить и посмотреть, куда идёт ось градиента.
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
      // в CSS 0deg — вверх, угол растёт по часовой стрелке; ось Y экрана направлена вниз
      angle = ((Math.atan2(x1 - x0, -(y1 - y0)) * 180) / Math.PI + 360) % 360;
    }
  }
  const op = fill.opacity ?? 1;
  const list = stops
    .map((st) => `${cssColor({ color: st.color, opacity: op })} ${Number((st.position * 100).toFixed(2))}%`)
    .join(", ");
  return `linear-gradient(${Number(angle.toFixed(2))}deg, ${list})`;
}

/** Заливка картинкой: ссылка на ассет и режим вписывания */
export function imageFill(node, assets) {
  const f = (node.fills || []).find((x) => x.visible !== false && x.type === "IMAGE");
  if (!f) return null;
  const a = assets[f.imageRef];
  if (!a) return null;
  return {
    src: `/a/${a.url}`,
    fit: f.scaleMode === "FIT" ? "contain" : "cover",
    width: f.originalImageWidth,
    height: f.originalImageHeight,
  };
}

/** Ассет самого узла (IMAGE и SVG ссылаются на файл по хешу) */
export function nodeAsset(node, assets) {
  if (!node.hash) return null;
  const a = assets[node.hash];
  if (!a) return null;
  return { src: `/a/${a.url}`, width: a.size?.x, height: a.size?.y, generated: a.type === "GENERATED_ASSET" };
}

/** Начертание из PostScript-имени шрифта */
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

/** Стили самого фрейма: направление, отступы, выравнивание, фон, скругления, тени */
export function frameStyle(node, assets) {
  const s = {};
  if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
    s.display = "flex";
    s.flexDirection = node.layoutMode === "HORIZONTAL" ? "row" : "column";
    if (node.itemSpacing) s.gap = px(node.itemSpacing);
    if (node.primaryAxisAlignItems) s.justifyContent = ALIGN[node.primaryAxisAlignItems];
    if (node.counterAxisAlignItems) s.alignItems = ALIGN[node.counterAxisAlignItems];
  }
  const [pt, pr, pb, pl] = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
  if (pt || pr || pb || pl) s.padding = `${px(pt || 0)} ${px(pr || 0)} ${px(pb || 0)} ${px(pl || 0)}`;

  // У TEXT заливка описывает цвет букв — её ставит textStyle, не фон
  const bg = node.type === "TEXT" ? null : solidFill(node);
  if (bg) s.background = bg;

  // Слои фона: картинка снизу, градиенты поверх — как в Figma
  const layers = [];
  const img = imageFill(node, assets);
  if (img) { s.backgroundSize = img.fit; s.backgroundPosition = "center"; s.backgroundRepeat = "no-repeat"; }
  for (const f of node.fills || []) {
    if (f.visible === false) continue;
    if (f.type === "GRADIENT_LINEAR") {
      const g = linearGradient(f);
      if (g) layers.unshift(g);
    }
  }
  if (img) layers.push(`url(${img.src})`);
  if (layers.length) s.backgroundImage = layers.join(", ");

  if (node.cornerRadius) s.borderRadius = px(node.cornerRadius);
  else if (node.rectangleCornerRadii?.some(Boolean)) s.borderRadius = node.rectangleCornerRadii.map(px).join(" ");

  if (node.clipsContent) s.overflow = "hidden";

  const stroke = (node.strokes || []).find((x) => x.visible !== false && x.type === "SOLID");
  if (stroke && node.strokeWeight) s.border = `${px(node.strokeWeight)} solid ${cssColor(stroke)}`;

  const shadows = (node.effects || []).filter((e) => e.visible !== false && (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW"));
  if (shadows.length) {
    s.boxShadow = shadows
      .map((e) => `${e.type === "INNER_SHADOW" ? "inset " : ""}${px(e.offset?.x || 0)} ${px(e.offset?.y || 0)} ${px(e.radius || 0)} ${px(e.spread || 0)} ${cssColor(e)}`)
      .join(", ");
  }
  if (node.opacity != null && node.opacity !== 1) s.opacity = node.opacity;
  return s;
}

/** Стили текстового узла */
export function textStyle(node) {
  const st = node.style || {};
  const s = {
    fontSize: px(st.fontSize),
    lineHeight: st.lineHeightPx ? px(st.lineHeightPx) : undefined,
    fontWeight: fontWeight(st),
  };
  if (st.letterSpacing) s.letterSpacing = px(st.letterSpacing);
  if (st.textAlignHorizontal && st.textAlignHorizontal !== "LEFT") s.textAlign = st.textAlignHorizontal.toLowerCase();
  if (st.textCase === "UPPER") s.textTransform = "uppercase";
  if (st.textDecoration === "UNDERLINE") s.textDecoration = "underline";
  const color = solidFill(node);
  if (color) s.color = color;
  return s;
}

/** Размеры: что зафиксировано, что тянется, что растёт */
export function sizing(node, parent) {
  const s = {};
  const horizontal = parent?.layoutMode === "HORIZONTAL";
  const vertical = parent?.layoutMode === "VERTICAL";
  const auto = node.textAutoResize;

  if (node.layoutGrow === 1) s.flex = "1 1 0%";
  if (node.layoutAlign === "STRETCH") s.alignSelf = "stretch";

  const fixedW = node.layoutGrow !== 1 && !(vertical && node.layoutAlign === "STRETCH") && auto !== "WIDTH_AND_HEIGHT";
  const fixedH = !(horizontal && node.layoutAlign === "STRETCH") && auto !== "HEIGHT" && auto !== "WIDTH_AND_HEIGHT";

  if (fixedW && node.size?.x != null) s.width = px(node.size.x);
  if (fixedH && node.size?.y != null) s.height = px(node.size.y);
  // внутри flex фиксированный размер не должен ужиматься соседями
  if ((horizontal && fixedW) || (vertical && fixedH)) s.flexShrink = 0;
  if (node.maxWidth != null) s.maxWidth = px(node.maxWidth);
  return s;
}

/** Абсолютно позиционированный ребёнок: смещение берём из матрицы трансформации */
export function absolutePosition(node) {
  const t = node.relativeTransform;
  if (!t) return {};
  return { position: "absolute", left: px(t[0][2]), top: px(t[1][2]) };
}

export function px(v) {
  if (v == null) return undefined;
  const r = Math.round(v * 100) / 100;
  return r === 0 ? "0" : `${r}px`;
}
