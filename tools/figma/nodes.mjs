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

/**
 * Итоговый цвет сплошных заливок. В Figma заливки лежат снизу вверх, верхняя
 * перекрывает нижние, полупрозрачная смешивается с ними. Раньше здесь бралась
 * первая заливка: блок «App Store» на POT (чёрная снизу, белая поверх) выходил
 * чёрным. С 2026-10-21 заливки складываются, как в Figma: у обложки VV фиолетовая
 * снизу и чёрная 20% поверх дают тёмно-фиолетовый.
 */
export function solidFill(node) {
  const fills = (node.fills || []).filter((x) => x.visible !== false && x.type === "SOLID" && x.color);
  if (!fills.length) return null;
  if (fills.length === 1) return cssColor(fills[0]);
  // наложение «поверх» снизу вверх, каналы 0..1
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

/**
 * Радиальный градиент Figma → CSS. Матрица `transform` переводит слой (0..1 по каждой
 * оси) в пространство градиента, где центр — (0.5, 0.5), а радиус — 0.5. Обратная
 * матрица даёт центр и полуоси эллипса в долях слоя; CSS умеет только эллипс по осям,
 * поэтому поворот (если он не кратен 90°) теряется. Появился 2026-10-21: на VV
 * «Icon Library» края картинки с иконками растворяются в белом именно им.
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
 * Заливка картинкой.
 *
 * FILL — обычное вписывание с обрезкой по краям, его достаточно отдать фоном.
 * STRETCH — это режим «кадрирование» в Figma: какой кусок картинки показывать,
 * описывает матрица `imageTransform`. Фоном такое не выразить, поэтому для них
 * считаем положение и размер отдельной картинки внутри обрезающего блока.
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

/** Ассет самого узла (IMAGE и SVG ссылаются на файл по хешу) */
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
 * Где картинка узла лежит относительно его коробки.
 *
 * Сгенерированная картинка шире узла: в неё попадают тень и обводка.
 * На сколько она выступает с каждой стороны, записано в `offsets` —
 * в процентах от размера узла. У вырожденных узлов (линия нулевой высоты)
 * процент не от чего считать, там картинка центрируется.
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
      // у линии нулевой толщины выступ записан в пикселях
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
 * То же положение картинки, но в CSS: в процентах от коробки узла, чтобы
 * картинка растягивалась вместе с узлом, когда тот привязан к обоим краям.
 * У вырожденной коробки проценты считать не от чего — там пиксели.
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
export function frameStyle(node, assets, assetMap = {}) {
  const s = {};
  if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
    s.display = "flex";
    s.flexDirection = node.layoutMode === "HORIZONTAL" ? "row" : "column";
    // При выравнивании «по краям» Figma распределяет элементы сама, а itemSpacing
    // остаётся в данных залежавшимся значением. Если отдать его как gap, он станет
    // минимальным зазором и распирает ряд.
    const spread = node.primaryAxisAlignItems === "SPACE_BETWEEN";
    if (node.layoutWrap === "WRAP") {
      // в Figma перенос строк задаётся отдельно, как и расстояние между рядами
      s.flexWrap = "wrap";
      if (node.itemSpacing && !spread) s.columnGap = px(node.itemSpacing);
      if (node.counterAxisSpacing) s.rowGap = px(node.counterAxisSpacing);
    } else if (node.itemSpacing > 0 && !spread) {
      s.gap = px(node.itemSpacing);
    }
    if (node.primaryAxisAlignItems) s.justifyContent = ALIGN[node.primaryAxisAlignItems];
    // В Figma по умолчанию дети прижаты к началу поперечной оси, в CSS — растянуты.
    // Без явного значения колонка растянется на высоту ряда и уедет по центру.
    s.alignItems = ALIGN[node.counterAxisAlignItems] ?? "flex-start";
  }
  const [pt, pr, pb, pl] = [node.paddingTop, node.paddingRight, node.paddingBottom, node.paddingLeft];
  if (pt || pr || pb || pl) s.padding = `${px(pt || 0)} ${px(pr || 0)} ${px(pb || 0)} ${px(pl || 0)}`;

  // Заливки в Figma лежат снизу вверх. Сплошные под картинкой — цвет фона; сплошные
  // поверх картинки (затемнение чертежа на Ostral) в CSS ушли бы под неё, поэтому они
  // становятся отдельным слоем над картинкой.
  const visible = (node.fills || []).filter((f) => f.visible !== false);
  const imgAt = visible.findIndex((f) => f.type === "IMAGE");
  const img = imageFill(node, assets, assetMap);
  const overImage = img && !img.crop && imgAt !== -1 ? visible.slice(imgAt + 1).filter((f) => f.type === "SOLID") : [];

  // У TEXT заливка описывает цвет букв — её ставит textStyle, не фон
  const bg = node.type === "TEXT" ? null : solidFill({ fills: imgAt !== -1 && img && !img.crop ? visible.slice(0, imgAt) : visible });
  if (bg) s.background = bg;

  // Слои фона: картинка снизу, градиенты и заливки поверх неё — как в Figma
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
  // «Прокрутка по горизонтали» в макете (POT: ряды телефонов на телефоне) — ряд листается
  // пальцем, полосы прокрутки не видно. Вертикальную не переносим: она стоит на корневых
  // фреймах брейкпоинтов, это прокрутка самой страницы.
  if (node.clipsContent && node.overflowDirection === "HORIZONTAL_SCROLLING") {
    delete s.overflow;
    s.overflowX = "auto";
    s.overflowY = "hidden";
    s.scrollbarWidth = "none";
    s.overscrollBehaviorX = "contain";
  }

  // Обводка в Figma не занимает места: она рисуется поверх блока и не сдвигает
  // содержимое. CSS-border сдвинул бы, поэтому рисуем её тенью без размытия.
  const shadows = [];
  const stroke = (node.strokes || []).find((x) => x.visible !== false && x.type === "SOLID");
  const weight = node.strokeWeight ?? 1; // по умолчанию 1, в выгрузке значение по умолчанию опущено
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
  // Размытие слоя (свечение на обложке VV). Радиус Figma — это примерно два «сигмы»
  // CSS-размытия, поэтому делим пополам; без размытия свечение выходило резкой фигурой.
  const blur = (node.effects || []).find((e) => e.visible !== false && e.type === "LAYER_BLUR" && e.radius);
  if (blur) s.filter = `blur(${px(blur.radius / 2)})`;
  const backdrop = (node.effects || []).find((e) => e.visible !== false && e.type === "BACKGROUND_BLUR" && e.radius);
  if (backdrop) s.backdropFilter = `blur(${px(backdrop.radius / 2)})`;
  if (node.opacity != null && node.opacity !== 1) s.opacity = node.opacity;
  return s;
}

/** Ключ шрифта в таблице `fonts` выгрузки: «Семейство:Начертание» */
export const fontKey = (st = {}) => `${st.fontFamily}:${st.fontStyle}`;

/**
 * Высота строки. «Авто» в Figma — высота из самого шрифта: оригинал отдаёт её
 * браузеру (`normal`), а если задан процент от неё — множит кегль на этот процент.
 */
function lineHeightOf(st) {
  if (st.lineHeightUnit === "INTRINSIC_%") {
    const pct = st.lineHeightPercent;
    return pct && Math.abs(pct - 100) > 0.01 ? `${Math.round(pct * 100) / 100}%` : "normal";
  }
  return st.lineHeightPx ? px(st.lineHeightPx) : undefined;
}

/**
 * Типографика по стилю Figma.
 *
 * Вес и оси вариативного шрифта берём из таблицы `fonts` выгрузки — так же,
 * как оригинал: у SF Pro Semibold вес 590 и оптический размер 28, из имени
 * начертания этого не узнать.
 */
function fontStyleOf(st = {}, fonts = {}) {
  const f = fonts[fontKey(st)];
  const s = {
    fontSize: px(st.fontSize),
    // «Авто» в Figma — высота строки из самого шрифта; оригинал отдаёт её браузеру
    lineHeight: lineHeightOf(st),
    fontWeight: f?.weight ?? fontWeight(st),
  };
  // основной шрифт сайта задан на странице; остальные — шрифты макетов в кейсах
  if (st.fontFamily && st.fontFamily !== "Open Sans") {
    s.fontFamily = `"${st.fontFamily}", var(--font-open-sans), sans-serif`;
    const axes = (f?.variationAxes || []).filter((a) => a.tag !== "wght");
    if (axes.length) s.fontVariationSettings = axes.map((a) => `"${a.tag}" ${a.value}`).join(", ");
  }
  if (st.italic) {
    s.fontStyle = "italic";
    // курсив Open Sans подключён отдельным семейством, чтобы не грузить его на всех страницах
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

/** Стили текстового узла */
export function textStyle(node, fonts = {}) {
  const st = node.style || {};
  const s = fontStyleOf(st, fonts);
  const align = st.textAlignHorizontal;
  if (align && align !== "LEFT") s.textAlign = align === "JUSTIFIED" ? "justify" : align.toLowerCase();
  const color = solidFill(node);
  if (color) s.color = color;
  // обрезка с многоточием
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
 * Стиль фрагмента внутри текста: то, чем он отличается от стиля всего узла.
 * В Figma у части текста может быть свой цвет, вес или размер — в выгрузке
 * это номер стиля на каждый символ и таблица стилей.
 */
export function spanStyle(node, override, fonts = {}) {
  const base = textStyle(node, fonts);
  const own = fontStyleOf({ ...(node.style || {}), ...override }, fonts);
  if (override.fills) {
    const color = solidFill({ fills: override.fills });
    if (color) own.color = color;
  }
  // регистр задаётся на весь узел: оригинал не меняет его у отдельных фрагментов
  delete own.textTransform;
  const diff = {};
  for (const [k, v] of Object.entries(own)) if (v !== undefined && v !== base[k]) diff[k] = v;
  if (base.textDecoration && !own.textDecoration) diff.textDecoration = "none";
  if (base.fontStyle && !own.fontStyle) diff.fontStyle = "normal";
  return diff;
}

/** По каким осям узел обнимает содержимое, а не имеет заданный размер */
export function hugs(node) {
  const row = node.layoutMode === "HORIZONTAL";
  const col = node.layoutMode === "VERTICAL";
  const auto = node.type === "TEXT" ? node.textAutoResize : null;
  return {
    w: (row && node.primaryAxisSizingMode !== "FIXED") || (col && node.counterAxisSizingMode !== "FIXED") || auto === "WIDTH_AND_HEIGHT",
    h: (col && node.primaryAxisSizingMode !== "FIXED") || (row && node.counterAxisSizingMode !== "FIXED") || auto === "HEIGHT" || auto === "WIDTH_AND_HEIGHT",
  };
}

/** Размеры: что зафиксировано, что тянется, что растёт */
export function sizing(node, parent, autoAxes = hugs(node)) {
  const s = {};
  const horizontal = parent?.layoutMode === "HORIZONTAL";
  const vertical = parent?.layoutMode === "VERTICAL";
  const auto = node.textAutoResize;

  if (node.layoutGrow === 1) {
    // растущий блок занимает остаток и не раздувается содержимым — как в оригинале
    s.flex = "1 0 0px";
    if (horizontal) s.minWidth = "1px";
    if (vertical) s.minHeight = "1px";
  }
  if (node.layoutAlign === "STRETCH") s.alignSelf = "stretch";
  // Текст на всю ширину колонки не должен её распирать: колонка, которая обнимает
  // содержимое, берёт ширину от картинки рядом, а не от самой длинной строки.
  if (node.type === "TEXT" && vertical && node.layoutAlign === "STRETCH" && auto !== "WIDTH_AND_HEIGHT") {
    s.width = "min-content";
    s.minWidth = "100%";
  }

  // Auto-layout фрейм по умолчанию обнимает содержимое: размер по оси задан,
  // только если режим FIXED. Оригинал так и верстает — без высоты, поэтому при
  // другой разбивке текста на строки блок подстраивается, а не обрезает и не
  // оставляет дыру.
  const { w: hugW, h: hugH } = autoAxes;

  const fixedW = !hugW && node.layoutGrow !== 1 && !(vertical && node.layoutAlign === "STRETCH");
  const fixedH = !hugH && !(horizontal && node.layoutAlign === "STRETCH");

  if (fixedW && !s.width && node.size?.x != null) s.width = px(node.size.x);
  if (fixedH && node.size?.y != null) s.height = px(node.size.y);
  // внутри flex фиксированный размер не должен ужиматься соседями
  if ((horizontal && fixedW) || (vertical && fixedH)) s.flexShrink = 0;
  if (node.maxWidth != null) s.maxWidth = px(node.maxWidth);
  return s;
}

/**
 * Абсолютно позиционированный ребёнок.
 *
 * Смещение лежит в матрице трансформации, но привязываться к левому верхнему
 * углу нельзя: в Figma у каждого узла есть constraints. Большая часть блоков
 * привязана к центру, часть растягивается по ширине, часть — к правому краю.
 * Без этого на ширине, отличной от 1280, всё разъезжается.
 */
/**
 * Угол поворота узла в градусах. В матрице Figma [[a, b, tx], [c, d, ty]]
 * поворот — это a = cos, c = sin.
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
  // У повёрнутого узла смещение в матрице — это положение его исходного угла,
  // а не левого верхнего края. Берём центр повёрнутого прямоугольника и
  // отступаем на половину размера: поворот вокруг центра встанет точно.
  let x = t[0][2];
  let y = t[1][2];
  if (rotation(node) && w != null && h != null) {
    const cx = t[0][2] + (t[0][0] * w + t[0][1] * h) / 2;
    const cy = t[1][2] + (t[1][0] * w + t[1][1] * h) / 2;
    x = cx - w / 2;
    y = cy - h / 2;
  }
  // Смещения детей посчитаны для размера родителя в мастер-компоненте. Если инстанс
  // другой ширины, привязку нужно считать от исходного размера — иначе блок,
  // стоявший по центру, уедет.
  const pw = parent?.layoutSize?.x ?? parent?.size?.x;
  const ph = parent?.layoutSize?.y ?? parent?.size?.y;
  const pct = (v, base) => `${Math.round((v / base) * 1e4) / 100}%`;
  const c = node.constraints || {};
  const s = { position: "absolute" };

  // Блок без заданного размера привязан к центру своей серединой: если текст
  // внутри встанет в одну строку вместо двух, блок останется по центру.
  const hug = rotation(node) ? { w: false, h: false } : autoAxes;
  const shift = [];

  // по горизонтали
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

  // по вертикали
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
