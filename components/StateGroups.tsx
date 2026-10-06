"use client";

import { useEffect } from "react";

/**
 * Переключение состояний каруселей.
 *
 * Карусель выведена одним деревом, а её состояния (слайд 1, 2, 3) заданы правилами
 * CSS по атрибуту `data-state` на корне — так лента слайдов плавно едет, как в макете.
 * У стрелки в `data-swap-map` записано, куда она ведёт из каждого состояния:
 * на первом слайде «назад» не ведёт никуда. Здесь по клику меняется атрибут.
 */
export default function StateGroups() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-swap-map]");
      if (!trigger) return;
      let map: Record<string, string>;
      try {
        map = JSON.parse(trigger.dataset.swapMap || "{}");
      } catch {
        return;
      }
      // блок, в текущем состоянии которого эта стрелка что-то переключает
      for (let g = trigger.closest<HTMLElement>("[data-state]"); g; g = g.parentElement?.closest<HTMLElement>("[data-state]") ?? null) {
        const next = map[g.dataset.state || ""];
        if (next) {
          g.dataset.state = next;
          break;
        }
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
