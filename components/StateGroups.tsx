"use client";

import { useEffect } from "react";

/**
 * Switching carousel states.
 *
 * A carousel is rendered as a single tree, and its states — slide 1, 2, 3 — are
 * CSS rules keyed on the `data-state` attribute at the root, which is what lets
 * the strip of slides glide the way it does in the design file.
 * An arrow's `data-swap-map` records where it leads from each state: on the
 * first slide, back leads nowhere. All this file does on a click is change the
 * attribute.
 *
 * Theme switch (`data-toggle`): on hover it takes an outline in the colour of
 * the circle on its knob.
 *
 * Two fixes to the arrows also live here (2026-10-21, Ivan's request):
 * — an arrow that leads nowhere in the current state gets `data-swap-off`: it
 *   does not light up, and the cursor over it stays ordinary;
 * — the left arrow has no hover state in the design file, being a rotated copy
 *   of the right one without its variant, so on first hover the indigo image
 *   from the right arrow's hover variant is copied into it. The arrow is turned
 *   180°, so the image lands the right way round. A CSS layer in
 *   app/globals.css shows it (`.swap-hover-layer`).
 */
const parse = (el: HTMLElement): Record<string, string> => {
  try {
    return JSON.parse(el.dataset.swapMap || "{}");
  } catch {
    return {};
  }
};

/** The group around an arrow whose current state the arrow actually switches */
const targetGroup = (trigger: HTMLElement, map: Record<string, string>) => {
  for (let g = trigger.closest<HTMLElement>("[data-state]"); g; g = g.parentElement?.closest<HTMLElement>("[data-state]") ?? null) {
    if (map[g.dataset.state || ""]) return g;
  }
  return null;
};

/**
 * The hover outline of a theme switch takes the colour of the circle on its
 * knob: the sun's green in the light theme, the moon's darker green in the dark
 * one. On every switch the dark theme puts the knob on the right, which is how
 * it is told apart.
 */
const paintToggle = (toggle: HTMLElement) => {
  const box = toggle.getBoundingClientRect();
  const knob = [...toggle.querySelectorAll<HTMLElement>("img, svg")].find((el) => {
    const r = el.getBoundingClientRect();
    const panel = el.closest<HTMLElement>("[data-variant]");
    return r.width > 0 && r.width < box.width && getComputedStyle(el).display !== "none" && (!panel || getComputedStyle(panel).opacity !== "0");
  });
  if (!knob) return;
  const r = knob.getBoundingClientRect();
  const dark = r.left + r.width / 2 > box.left + box.width / 2;
  toggle.style.setProperty("--toggle-ring", dark ? "#047033" : "#039844");
};

/** Mark the arrows that currently lead nowhere */
const markIdle = () => {
  for (const t of document.querySelectorAll<HTMLElement>("[data-swap-map]")) {
    t.toggleAttribute("data-swap-off", !targetGroup(t, parse(t)));
  }
};

/** Give the left arrow the hover layer from the neighbouring arrow that has one */
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
      // Switching theme is instant (Ivan's request): movement is left to paging
      // alone. Transitions are taken off the block while it switches.
      if (trigger.hasAttribute("data-toggle")) {
        g.setAttribute("data-instant", "");
        requestAnimationFrame(() => requestAnimationFrame(() => g.removeAttribute("data-instant")));
      }
      g.dataset.state = map[g.dataset.state || ""];
      markIdle();
    };
    const onOver = (e: MouseEvent) => {
      const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-swap-map]");
      if (trigger) lendHover(trigger);
      const toggle = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-toggle]");
      if (toggle) paintToggle(toggle);
    };
    // After a click the knob has moved, or a switch from another state has taken
    // its place; layers take up to 300 ms to swap, so everything is recoloured
    // once it has settled.
    const paintAll = () => document.querySelectorAll<HTMLElement>("[data-toggle]").forEach(paintToggle);
    const onClickAfter = (e: MouseEvent) => {
      if (!(e.target as HTMLElement | null)?.closest("[data-toggle], [data-swap-to], [data-swap-map]")) return;
      requestAnimationFrame(paintAll);
      window.setTimeout(paintAll, 400);
    };
    paintAll();
    window.addEventListener("resize", paintAll);
    markIdle();
    document.addEventListener("click", onClick);
    document.addEventListener("click", onClickAfter);
    document.addEventListener("mouseover", onOver);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("click", onClickAfter);
      document.removeEventListener("mouseover", onOver);
      window.removeEventListener("resize", paintAll);
    };
  }, []);

  return null;
}
