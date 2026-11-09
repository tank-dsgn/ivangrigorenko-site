"use client";

import { useEffect } from "react";

/**
 * Parallax on the case covers. The design file gives a block a speed — 0.75
 * means it travels a quarter slower than the page; the generator writes how far
 * it lags into `data-parallax`, and the offset arrives in the `--parallax`
 * variable.
 */
export default function ScrollEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      // skip the hidden copies that belong to the other breakpoints
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
