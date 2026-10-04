"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Переключатель состояний секции.
 *
 * В макете карусели и переключатель темы сделаны вариантами компонента:
 * клик по стрелке меняет вариант `step=1` на `step=2`, клик по тумблеру —
 * `mode=light` на `mode=dark`. Генератор выводит все варианты слоями,
 * а этот компонент показывает нужный. Переход — 300 мс, как в оригинале.
 *
 * Элемент, по клику на который нужно переключиться, помечен `data-swap-to`.
 */
export default function VariantGroup({
  initial,
  style,
  children,
}: {
  initial: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const [active, setActive] = useState(initial);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>("[data-swap-to]");
    const next = target?.dataset.swapTo;
    if (next) setActive(next);
  };

  return (
    <div style={style} onClick={onClick}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const el = child as ReactElement<{ "data-variant"?: string; style?: CSSProperties; "aria-hidden"?: boolean }>;
        const on = el.props["data-variant"] === active;
        return cloneElement(el, {
          "aria-hidden": !on,
          style: {
            ...el.props.style,
            // активное состояние стоит в потоке и задаёт высоту секции,
            // остальные лежат поверх него невидимыми
            position: on ? "relative" : "absolute",
            ...(on ? {} : { top: 0, left: 0, height: "100%" }),
            opacity: on ? 1 : 0,
            pointerEvents: on ? "auto" : "none",
            transition: "opacity 300ms linear",
          },
        });
      })}
    </div>
  );
}
