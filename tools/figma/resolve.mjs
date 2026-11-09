// Builds a page tree out of the Figma Sites export.
//
// In the export children are a list of ids and component instances come
// unexpanded: an instance carries a reference to its main component, a scale
// factor and a list of overrides. To get at what is actually drawn on the site
// the instance has to be expanded here:
//
//   1. take the main component's children;
//   2. multiply their sizes by the instance's scale (`uniformScaleFactor`);
//   3. apply the `overrides` — text, fills, sizes, visibility, and the
//      substitution of a nested component;
//   4. put in the image belonging to this very instance (`stablePathToAssetInfo`).
//
// A node's address inside an override is a path of layer names, each with its
// index among same-named siblings: ["Frame0", "Levels0", "Wifi0"].

const SCALED = [
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "itemSpacing", "counterAxisSpacing", "cornerRadius", "strokeWeight",
  "maxWidth", "maxHeight", "minWidth", "minHeight",
];

/** The instance's geometry: on a variant swap it stays with the instance */
const GEOMETRY = [
  "id", "name", "type", "relativeTransform", "size", "constraints", "constraintValues",
  "layoutPositioning", "layoutAlign", "layoutGrow", "overrides", "uniformScaleFactor",
  "absoluteBoundingBox", "isolatedAbsoluteRenderBounds", "interactions", "visible",
];

const mul = (v, f) => (typeof v === "number" ? v * f : v);

/** A copy of a node's properties with its sizes multiplied by the scale */
function scaleProps(src, f) {
  if (f === 1) return { ...src };
  const n = { ...src };
  if (n.size) n.size = { x: n.size.x * f, y: n.size.y * f };
  if (n.relativeTransform) {
    const [a, b] = n.relativeTransform;
    n.relativeTransform = [[a[0], a[1], a[2] * f], [b[0], b[1], b[2] * f]];
  }
  for (const k of SCALED) if (n[k] != null) n[k] = mul(n[k], f);
  // the default stroke weight is 1 and the export leaves it out
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
  // a nested instance's overrides are given in the main component's coordinates, so they are scaled too
  if (Array.isArray(n.overrides)) {
    n.overrides = n.overrides.map((o) => ({ ...o, value: scaleProps(o.value, f) }));
  }
  return n;
}

/**
 * In the data, the `overrides` of a scaled instance are already final — a font
 * size of 8.58 is 12 × 0.71 — but the Figma Sites site applies the overrides
 * first and scales the whole content afterwards, multiplying them by the scale
 * a second time. On the Autotor page the badge text comes out at 6.1 rather
 * than 8.58. That is reproduced here, because the goal is to match the
 * published site. `false` means "as in the Figma file".
 */
const RESCALE_OVERRIDES = true;

export function createResolver({ nodeById, stablePathToAssetInfo = {} }) {
  // children of library components are addressed by overrideKey, not by id
  const byKey = {};
  for (const n of Object.values(nodeById)) if (n.overrideKey) byKey[n.overrideKey] = n;

  const lookup = (id) => {
    const last = String(id).split(";").pop();
    return nodeById[id] || nodeById[last] || byKey[last] || null;
  };
  const keyOf = (n) => n.overrideKey ?? n.id;

  /**
   * Apply one override value to a node. A nested instance's list of overrides
   * adds to its own rather than replacing it: the button in the main component
   * already has its text colour and its outline, and all that arrives from
   * outside is a new label.
   */
  function applyOverride(node, value) {
    const { overrides, ...rest } = value;
    Object.assign(node, rest);
    if (overrides) node.overrides = [...(node.overrides || []), ...overrides];
  }

  /**
   * Component properties. A node in the main component records which property
   * drives its visibility, its text or its nested component, while the values
   * live on the instance.
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
   * @param raw       the node from the export
   * @param ctx       instance context: { path, scale, overrides }, or null outside an instance
   * @param forceMain expand the instance as a different variant of the component
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

    // the size the children's offsets were computed against: before the instance's overrides
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

      // The component has been swapped, by an override or by a change of
      // variant: the root's properties come from the new main component and
      // only the geometry is left from the instance.
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
    /** The tree starting at the node with this id */
    resolve: (id) => build(nodeById[id] || lookup(id), null),
    /** The same instance, expanded as another variant of its set */
    resolveVariant: (node, variantId) =>
      node.__src ? build(node.__src.raw, node.__src.ctx, 0, variantId) : null,
  };
}
