// Сборка дерева страницы из выгрузки Figma Sites.
//
// В выгрузке дети лежат списком id, а инстансы компонентов — «неразвёрнутыми»:
// у инстанса есть ссылка на мастер-компонент, коэффициент масштаба и список
// переопределений. Чтобы получить то, что реально нарисовано на сайте, инстанс
// нужно развернуть самим:
//
//   1. взять детей мастер-компонента;
//   2. умножить их размеры на масштаб инстанса (`uniformScaleFactor`);
//   3. наложить переопределения (`overrides`) — тексты, заливки, размеры,
//      видимость, замену вложенного компонента;
//   4. подставить картинку именно этого инстанса (`stablePathToAssetInfo`).
//
// Адрес узла в переопределении — путь из имён слоёв с номером среди
// одноимённых соседей: ["Frame0", "Levels0", "Wifi0"].

const SCALED = [
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "itemSpacing", "counterAxisSpacing", "cornerRadius", "strokeWeight",
  "maxWidth", "maxHeight", "minWidth", "minHeight",
];

/** Геометрия инстанса: при смене варианта она остаётся от самого инстанса */
const GEOMETRY = [
  "id", "name", "type", "relativeTransform", "size", "constraints", "constraintValues",
  "layoutPositioning", "layoutAlign", "layoutGrow", "overrides", "uniformScaleFactor",
  "absoluteBoundingBox", "isolatedAbsoluteRenderBounds", "interactions", "visible",
];

const mul = (v, f) => (typeof v === "number" ? v * f : v);

/** Копия свойств узла с размерами, умноженными на масштаб */
function scaleProps(src, f) {
  if (f === 1) return { ...src };
  const n = { ...src };
  if (n.size) n.size = { x: n.size.x * f, y: n.size.y * f };
  if (n.relativeTransform) {
    const [a, b] = n.relativeTransform;
    n.relativeTransform = [[a[0], a[1], a[2] * f], [b[0], b[1], b[2] * f]];
  }
  for (const k of SCALED) if (n[k] != null) n[k] = mul(n[k], f);
  // толщина обводки по умолчанию — 1, в выгрузке она опущена
  if (n.strokeWeight == null && !n.individualStrokeWeights && n.strokes?.length) n.strokeWeight = f;
  if (n.constraintValues) {
    n.constraintValues = Object.fromEntries(
      Object.entries(n.constraintValues).map(([k, v]) => [k, v && { ...v, pixelOffset: mul(v.pixelOffset, f) }])
    );
  }
  if (Array.isArray(n.rectangleCornerRadii)) n.rectangleCornerRadii = n.rectangleCornerRadii.map((v) => mul(v, f));
  if (n.style) {
    n.style = { ...n.style };
    for (const k of ["fontSize", "lineHeightPx", "letterSpacing", "letterSpacingValue", "paragraphSpacing"]) {
      if (n.style[k] != null) n.style[k] = mul(n.style[k], f);
    }
  }
  if (Array.isArray(n.effects)) {
    n.effects = n.effects.map((e) => ({
      ...e,
      radius: mul(e.radius, f),
      spread: mul(e.spread, f),
      offset: e.offset ? { x: e.offset.x * f, y: e.offset.y * f } : e.offset,
    }));
  }
  // переопределения вложенного инстанса заданы в координатах мастера — масштабируем и их
  if (Array.isArray(n.overrides)) {
    n.overrides = n.overrides.map((o) => ({ ...o, value: scaleProps(o.value, f) }));
  }
  return n;
}

/**
 * Значения в `overrides` масштабированного инстанса в данных уже конечные
 * (кегль 8.58 = 12 × 0.71), но сайт на Figma Sites сначала накладывает
 * переопределения, а потом масштабирует всё содержимое — и умножает их на
 * масштаб ещё раз. В макете Autotor текст бейджа выходит 6.1 вместо 8.58.
 * Повторяем это, потому что цель — совпасть с опубликованным сайтом.
 * `false` — «как в макете Figma».
 */
const RESCALE_OVERRIDES = true;

export function createResolver({ nodeById, stablePathToAssetInfo = {} }) {
  // у компонентов из библиотеки дети адресуются не по id, а по overrideKey
  const byKey = {};
  for (const n of Object.values(nodeById)) if (n.overrideKey) byKey[n.overrideKey] = n;

  const lookup = (id) => {
    const last = String(id).split(";").pop();
    return nodeById[id] || nodeById[last] || byKey[last] || null;
  };
  const keyOf = (n) => n.overrideKey ?? n.id;

  /**
   * Наложить значение переопределения на узел. Список переопределений вложенного
   * инстанса не заменяет его собственный, а дополняет: у кнопки в мастере уже
   * заданы цвет текста и обводка, а снаружи приходит только новая подпись.
   */
  function applyOverride(node, value) {
    const { overrides, ...rest } = value;
    Object.assign(node, rest);
    if (overrides) node.overrides = [...(node.overrides || []), ...overrides];
  }

  /**
   * Свойства компонента. У узла в мастере записано, какое свойство управляет его
   * видимостью, текстом или вложенным компонентом, а значения лежат в инстансе.
   */
  function applyProps(node, raw, props) {
    const refs = raw.componentPropertyReferences;
    if (!refs || !props) return;
    const value = (name) => props[name]?.value;
    if (refs.visible && typeof value(refs.visible) === "boolean") node.visible = value(refs.visible);
    const text = refs.characters && value(refs.characters);
    if (typeof text === "string") node.characters = text;
    else if (text && typeof text === "object") Object.assign(node, text);
    const main = refs.mainComponent && value(refs.mainComponent);
    if (typeof main === "string" && nodeById[main]) node.mainComponentId = main;
  }

  /**
   * @param raw       узел из выгрузки
   * @param ctx       контекст инстанса: { path, scale, overrides } или null вне инстансов
   * @param forceMain развернуть инстанс как другой вариант компонента
   */
  function build(raw, ctx, depth = 0, forceMain = null) {
    if (!raw || depth > 80) return null;

    let node;
    if (ctx) {
      node = scaleProps(raw, ctx.scale);
      node.stablePath = `I${[...ctx.path, keyOf(raw)].join(";")}`;
      const info = stablePathToAssetInfo[node.stablePath];
      if (info?.hash) node.hash = info.hash;
      applyProps(node, raw, ctx.props);
      for (const o of ctx.overrides) if (o.key.length === 0) applyOverride(node, o.value);
    } else {
      node = { ...raw };
    }
    node.__src = { raw, ctx };

    const deeper = ctx ? ctx.overrides.filter((o) => o.key.length > 0) : [];
    let childIds = raw.children || [];
    let childCtx = ctx ? { ...ctx, overrides: deeper } : null;

    // размер, для которого посчитаны смещения детей: до переопределений инстанса
    let layoutSize = raw.size && ctx ? { x: raw.size.x * ctx.scale, y: raw.size.y * ctx.scale } : raw.size;

    const mainId = forceMain ?? node.mainComponentId;
    const master = node.type === "INSTANCE" && mainId ? nodeById[mainId] : null;
    if (master) {
      const factor = node.uniformScaleFactor ?? 1;
      const scale = (ctx?.scale ?? 1) * factor;
      const own =
        RESCALE_OVERRIDES && factor !== 1
          ? (node.overrides || []).map((o) => (o.key.length ? { ...o, value: scaleProps(o.value, factor) } : o))
          : node.overrides || [];

      // Компонент заменён (переопределением или сменой варианта): свойства корня
      // берём от нового мастера, от инстанса остаётся только геометрия.
      if (mainId !== raw.mainComponentId) {
        const keep = {};
        for (const k of GEOMETRY) if (node[k] !== undefined) keep[k] = node[k];
        const { children: _c, overrideKey: _k, componentSetId: _s, ...base } = scaleProps(master, scale);
        node = { ...base, ...keep, stablePath: node.stablePath, __src: node.__src };
        if (ctx) for (const o of ctx.overrides) if (o.key.length === 0) applyOverride(node, o.value);
      }
      for (const o of own) if (o.key.length === 0) Object.assign(node, { ...o.value, overrides: node.overrides });
      node.type = "INSTANCE";
      node.mainComponentId = mainId;

      if (master.size) layoutSize = { x: master.size.x * scale, y: master.size.y * scale };
      childIds = master.children || [];
      childCtx = {
        path: [...(ctx?.path ?? []), ctx ? keyOf(raw) : raw.id],
        scale,
        props: node.componentProperties,
        overrides: [...own.filter((o) => o.key.length > 0), ...deeper],
      };
    }

    if (layoutSize && node.size && (Math.abs(layoutSize.x - node.size.x) > 0.01 || Math.abs(layoutSize.y - node.size.y) > 0.01)) {
      node.layoutSize = layoutSize;
    }

    const counts = {};
    node.children = childIds
      .map((cid) => {
        const child = lookup(cid);
        if (!child) return null;
        const i = (counts[child.name] = (counts[child.name] ?? -1) + 1);
        const seg = `${child.name}${i}`;
        const sub = childCtx && {
          ...childCtx,
          overrides: childCtx.overrides
            .filter((o) => o.key[0] === seg)
            .map((o) => ({ ...o, key: o.key.slice(1) })),
        };
        return build(child, sub, depth + 1);
      })
      .filter(Boolean);

    return node;
  }

  return {
    /** Дерево от узла с данным id */
    resolve: (id) => build(nodeById[id] || lookup(id), null),
    /** Тот же инстанс, развёрнутый как другой вариант своего набора */
    resolveVariant: (node, variantId) =>
      node.__src ? build(node.__src.raw, node.__src.ctx, 0, variantId) : null,
  };
}
