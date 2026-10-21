"use client";

import {
  Children,
  cloneElement,
  isValidElement,
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
 * Есть ли у посетителя мышь. Состояния «по наведению» нужны только с ней,
 * поэтому до первого движения мыши они в страницу не попадают.
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
 * Переключатель состояний блока.
 *
 * В макете карусели, тумблер темы и состояния кнопок сделаны вариантами
 * компонента: клик по стрелке меняет `step=1` на `step=2`, наведение на кнопку —
 * `default` на `hover`. Генератор выводит варианты слоями, а этот компонент
 * показывает нужный. Длительность перехода берётся из макета.
 *
 * Элемент-переключатель помечен `data-swap-to` (клик) или `data-hover-to`
 * (наведение; при уходе курсора состояние возвращается).
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
  /** блок сам может быть переключателем для блока снаружи */
  "data-swap-to"?: string;
  "data-swap-ms"?: string;
  "data-hover-to"?: string;
  "data-hover-ms"?: string;
  /** или частью карусели, которая переключается атрибутом data-state */
  "data-swap-map"?: string;
  className?: string;
}) {
  const [active, setActive] = useState(initial);
  const [hover, setHover] = useState<string | null>(null);
  const [ms, setMs] = useState(0);
  const mouse = useSyncExternalStore(subscribe, () => hasMouse, () => false);

  const panels = Children.toArray(children).filter(isValidElement) as ReactElement<PanelProps>[];
  const ids = panels.map((p) => p.props["data-variant"]);

  /** Ближайший переключатель, который ведёт в состояние именно этого блока */
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
    setMs(Number(el.dataset.swapMs) || 0);
    setActive(el.dataset.swapTo!);
    setHover(null);
  };

  const onMouseOver = (e: MouseEvent<HTMLDivElement>) => {
    // стрелка карусели, которая сейчас никуда не ведёт, не подсвечивается (см. StateGroups)
    // у переключателя темы своё наведение (обводка в app/globals.css): вариант «наведение»
    // из макета нарисован для светлой темы и в тёмной показывал не тот ползунок
    if (!mouse || e.currentTarget.hasAttribute("data-swap-off") || e.currentTarget.hasAttribute("data-toggle")) return;
    const el = trigger(e, "hoverTo");
    if (!el) return;
    setMs(Number(el.dataset.hoverMs) || 0);
    setHover(el.dataset.hoverTo!);
  };

  const shown = hover ?? active;

  return (
    <div {...rest} style={style} onClick={onClick} onMouseOver={onMouseOver} onMouseLeave={() => setHover(null)}>
      {panels.map((panel) => {
        const id = panel.props["data-variant"];
        const on = id === shown;
        if (panel.props["data-lazy"] !== undefined && !mouse && !on) return null;
        return cloneElement(panel, {
          key: id,
          "aria-hidden": !on,
          style: {
            ...panel.props.style,
            // показанное состояние стоит в потоке и задаёт размер блока,
            // остальные лежат поверх него невидимыми
            position: on ? "relative" : "absolute",
            ...(on ? {} : { top: 0, left: 0, height: "100%" }),
            opacity: on ? 1 : 0,
            pointerEvents: on ? "auto" : "none",
            transition: ms ? `opacity ${ms}ms cubic-bezier(0, 0, 0.58, 1)` : "none",
          },
        });
      })}
    </div>
  );
}
