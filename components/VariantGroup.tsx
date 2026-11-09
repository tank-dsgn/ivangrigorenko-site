"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

type PanelProps = {
  "data-variant"?: string;
  "data-lazy"?: boolean | string;
  "aria-hidden"?: boolean;
  style?: CSSProperties;
};

/**
 * Whether the visitor has a mouse. Hover states are only of use with one, so
 * they stay out of the page until the mouse first moves.
 */
let hasMouse = false;
const listeners = new Set<() => void>();
function subscribe(notify: () => void) {
  listeners.add(notify);
  if (!hasMouse && listeners.size === 1) {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hasMouse = true;
      window.removeEventListener("pointermove", onMove);
      listeners.forEach((l) => l());
    };
    window.addEventListener("pointermove", onMove, { passive: true });
  }
  return () => {
    listeners.delete(notify);
  };
}

/**
 * The state switch for a block.
 *
 * In the design file the carousels, the theme toggle and the button states are
 * all component variants: a click on an arrow turns `step=1` into `step=2`,
 * hovering a button turns `default` into `hover`. The generator emits the
 * variants as layers and this component shows the right one. The transition
 * duration comes from the design file.
 *
 * A switching element is marked `data-swap-to` for a click or `data-hover-to`
 * for a hover, where the state returns once the cursor leaves.
 */
export default function VariantGroup({
  initial,
  style,
  children,
  ...rest
}: {
  initial: string;
  style?: CSSProperties;
  children: ReactNode;
  /** a block can itself switch the block around it */
  "data-swap-to"?: string;
  "data-swap-ms"?: string;
  "data-hover-to"?: string;
  "data-hover-ms"?: string;
  /** or be part of a carousel switched through the data-state attribute */
  "data-swap-map"?: string;
  className?: string;
}) {
  const [active, setActive] = useState(initial);
  const [hover, setHover] = useState<string | null>(null);
  const [ms, setMs] = useState(0);
  const mouse = useSyncExternalStore(subscribe, () => hasMouse, () => false);

  const panels = Children.toArray(children).filter(isValidElement) as ReactElement<PanelProps>[];
  const ids = panels.map((p) => p.props["data-variant"]);

  /** The nearest switch that leads into a state of this very block */
  const trigger = (e: MouseEvent<HTMLDivElement>, key: "swapTo" | "hoverTo") => {
    for (let el = e.target as HTMLElement | null; el; el = el.parentElement) {
      const to = el.dataset?.[key];
      if (to && ids.includes(to)) return el;
      if (el === e.currentTarget) break;
    }
    return null;
  };

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const el = trigger(e, "swapTo");
    if (!el) return;
    // the theme switch changes the screens at once, with no cross-fade
    setMs(el.hasAttribute("data-toggle") ? 0 : Number(el.dataset.swapMs) || 0);
    setActive(el.dataset.swapTo!);
    setHover(null);
  };

  const onMouseOver = (e: MouseEvent<HTMLDivElement>) => {
    // a carousel arrow that currently leads nowhere does not light up (see
    // StateGroups); the theme switch has a hover of its own, the outline in
    // app/globals.css, because the design file's hover variant was drawn for
    // the light theme and showed the wrong knob in the dark one
    if (!mouse || e.currentTarget.hasAttribute("data-swap-off") || e.currentTarget.hasAttribute("data-toggle")) return;
    const el = trigger(e, "hoverTo");
    if (!el) return;
    setMs(Number(el.dataset.hoverMs) || 0);
    setHover(el.dataset.hoverTo!);
  };

  // A carousel arrow under the cursor has reached the last slide: StateGroups
  // sets data-swap-off only after the click, and the cursor never left, so the
  // highlight is cleared here and at once, as it is for the left arrow
  const box = useRef<HTMLDivElement>(null);
  const isArrow = Boolean(rest["data-swap-map"]);
  useEffect(() => {
    const el = box.current;
    if (!isArrow || !el) return;
    const watch = new MutationObserver(() => {
      if (!el.hasAttribute("data-swap-off")) return;
      setMs(0);
      setHover(null);
    });
    watch.observe(el, { attributes: true, attributeFilter: ["data-swap-off"] });
    return () => watch.disconnect();
  }, [isArrow]);

  const shown = hover ?? active;

  return (
    <div {...rest} ref={box} style={style} onClick={onClick} onMouseOver={onMouseOver} onMouseLeave={() => setHover(null)}>
      {panels.map((panel) => {
        const id = panel.props["data-variant"];
        const on = id === shown;
        if (panel.props["data-lazy"] !== undefined && !mouse && !on) return null;
        return cloneElement(panel, {
          key: id,
          "aria-hidden": !on,
          style: {
            ...panel.props.style,
            // the shown state sits in the flow and sets the block's size; the
            // rest lie over it, out of sight
            position: on ? "relative" : "absolute",
            // width follows the shown state: out of the flow a panel would
            // otherwise contract to its own content, and a row of phones would
            // stretch it wider than the screen (POT, the sign-in screen, 375)
            ...(on ? {} : { top: 0, left: 0, height: "100%", width: panel.props.style?.width ?? "100%" }),
            opacity: on ? 1 : 0,
            pointerEvents: on ? "auto" : "none",
            transition: ms ? `opacity ${ms}ms cubic-bezier(0, 0, 0.58, 1)` : "none",
          },
        });
      })}
    </div>
  );
}
