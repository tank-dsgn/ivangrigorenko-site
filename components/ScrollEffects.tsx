"use client";

import { useEffect } from "react";

/**
 * Параллакс обложек кейсов. В макете у блока задана скорость (0.75 — блок
 * едет на четверть медленнее страницы); генератор кладёт в `data-parallax`
 * долю отставания, а сдвиг приходит в переменную `--parallax`.
 */
export default function ScrollEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      // невидимые копии под другие брейкпоинты пропускаем
      document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
        if (!el.offsetParent) return;
        el.style.setProperty("--parallax", `${Math.round(y * Number(el.dataset.parallax) * 100) / 100}px`);
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
