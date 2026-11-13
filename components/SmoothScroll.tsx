"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

/**
 * Smooth wheel scrolling, the way seed.bytedance.com does it (2026-11-13, at
 * Ivan's request: the native wheel felt "hard"). The same library and version
 * as there, Lenis 1.3.25, with its defaults: each frame the page covers a tenth
 * of the distance left (lerp 0.1), so a wheel step glides and settles instead
 * of jumping.
 *
 * Only the mouse wheel and trackpad are smoothed; touch scrolling on phones and
 * tablets stays native. Off when the visitor asks for reduced motion.
 *
 * - `anchors`: a link to `#contacts` glides with the same motion; Lenis honours
 *   the header offset set as `scroll-margin-top` on the footer.
 * - `allowNestedScroll`: the horizontal strips in the Pot case keep scrolling
 *   sideways on a trackpad.
 */
let instance: Lenis | null = null;

/** Scroll to the top with the page's own motion (the logo and "Work" on the page they lead to) */
export function scrollToTop() {
  if (instance) instance.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, anchors: true, allowNestedScroll: true });
    instance = lenis;
    return () => {
      lenis.destroy();
      if (instance === lenis) instance = null;
    };
  }, []);

  return null;
}
