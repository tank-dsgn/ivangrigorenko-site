"use client";

import { useEffect } from "react";

/**
 * Переключение состояний каруселей.
 *
 * Карусель выведена одним деревом, а её состояния (слайд 1, 2, 3) заданы правилами
 * CSS по атрибуту `data-state` на корне — так лента слайдов плавно едет, как в макете.
 * У стрелки в `data-swap-map` записано, куда она ведёт из каждого состояния:
 * на первом слайде «назад» не ведёт никуда. Здесь по клику меняется атрибут.
 *
 * Ещё здесь две доделки стрелок (2026-10-21, просьба Ивана):
 * — стрелке, которая в текущем состоянии никуда не ведёт, ставится `data-swap-off`:
 *   она не подсвечивается и курсор над ней обычный;
 * — у левой стрелки в макете нет состояния «наведение» (это повёрнутая копия правой без
 *   варианта), поэтому при первом наведении в неё копируется индиго-картинка из варианта
 *   «наведение» правой стрелки. Стрелка повёрнута на 180°, так что картинка ложится как надо.
 *   Показывает слой CSS в app/globals.css (`.swap-hover-layer`).
 */
const parse = (el: HTMLElement): Record<string, string> => {
  try {
    return JSON.parse(el.dataset.swapMap || "{}");
  } catch {
    return {};
  }
};

/** Группа снаружи стрелки, в текущем состоянии которой стрелка что-то переключает */
const targetGroup = (trigger: HTMLElement, map: Record<string, string>) => {
  for (let g = trigger.closest<HTMLElement>("[data-state]"); g; g = g.parentElement?.closest<HTMLElement>("[data-state]") ?? null) {
    if (map[g.dataset.state || ""]) return g;
  }
  return null;
};

/** Отметить стрелки, которые сейчас никуда не ведут */
const markIdle = () => {
  for (const t of document.querySelectorAll<HTMLElement>("[data-swap-map]")) {
    t.toggleAttribute("data-swap-off", !targetGroup(t, parse(t)));
  }
};

/** Левой стрелке — слой «наведение» из соседней стрелки, у которой он есть */
const lendHover = (trigger: HTMLElement) => {
  if (trigger.querySelector(":scope > .swap-hover-layer, [data-hover-to]")) return;
  const twin = [...(trigger.parentElement?.querySelectorAll<HTMLElement>(":scope > [data-swap-map]") ?? [])].find((el) => el !== trigger);
  const hoverPanel = twin?.querySelector<HTMLElement>("[data-variant][data-lazy]");
  const art = hoverPanel?.firstElementChild;
  if (!art) return;
  const layer = art.cloneNode(true) as HTMLElement;
  layer.classList.add("swap-hover-layer");
  layer.setAttribute("aria-hidden", "true");
  trigger.appendChild(layer);
};
export default function StateGroups() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-swap-map]");
      if (!trigger) return;
      const map = parse(trigger);
      const g = targetGroup(trigger, map);
      if (!g) return;
      g.dataset.state = map[g.dataset.state || ""];
      markIdle();
    };
    const onOver = (e: MouseEvent) => {
      const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-swap-map]");
      if (trigger) lendHover(trigger);
    };
    markIdle();
    document.addEventListener("click", onClick);
    document.addEventListener("mouseover", onOver);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", onOver);
    };
  }, []);

  return null;
}
