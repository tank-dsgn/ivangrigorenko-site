"use client";

import { useRef, type MouseEvent } from "react";
import { mailtoHref, type Lang } from "@/lib/site";
import { reachGoal } from "@/components/Analytics";

// the Russian label was shortened on 2026-10-06 at Ivan's request: the verb stayed, "with me" went
const label = { ru: "Связаться", en: "Contact me" } as const;

/**
 * The "Contact me" button. The original site has none; it was added on
 * 2026-10-05 and the generator inserts it into the pages — see `additions` in
 * tools/figma/overrides.json.
 *
 * It sits in the first screen of the home page, under the heading, flush with
 * the text: large (48px, 18px text; 40px and 16px on a phone), and it scrolls
 * to the contact block at the bottom.
 * The `mail`, `compact` and `full` props are left over from the About variant —
 * a button the size of "Download my CV" that opens an email — which is not in
 * use at the moment.
 *
 * It looks like the outlined button in the design file. On hover indigo floods
 * in from the point where the cursor entered and the text turns white; when the
 * cursor leaves, the flood shrinks back towards where it left. From the
 * keyboard the flood starts at the centre.
 * This is variant "A — Fill from cursor", chosen by Ivan on 2026-10-06; before
 * it there were a dot running along the outline, a dot circling the button, a
 * shifting halo, and an outline drawn once.
 * On phone and tablet (under 1280px) there is no hover, so the button is
 * highlighted from the start, like the site button on hover: indigo outline and
 * indigo text (Ivan's request, 2026-10-22).
 * The cursor position is only known in the browser, so this is a client
 * component.
 */
export default function ContactButton({
  lang,
  mail,
  compact,
  full,
}: {
  lang: Lang;
  /** open an email instead of scrolling to the contact block */
  mail?: boolean;
  /** the size of an ordinary site button: 40px, 16px text, 16px padding */
  compact?: boolean;
  /** full width of its block, for the single column on a phone */
  full?: boolean;
}) {
  // the point where the cursor entered or left the button goes into --x and --y
  const ref = useRef<HTMLAnchorElement>(null);
  const track = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - box.left}px`);
    el.style.setProperty("--y", `${e.clientY - box.top}px`);
  };

  const size = compact
    ? "h-10 px-4 text-[16px] leading-6"
    : "h-10 px-8 text-[16px] leading-6 md:h-12 md:px-10 md:text-[18px] md:leading-7";
  return (
    <a
      ref={ref}
      href={mail ? mailtoHref(lang) : "#contacts"}
      // the "contact button pressed" goal in Metrica (target event contact_button) and the GA4 event
      onClick={() => reachGoal("contact_button")}
      onMouseEnter={track}
      onMouseLeave={track}
      className={`group text-muted ease-figma relative items-center justify-center overflow-hidden rounded-full bg-white font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_#94a3b8] transition-colors duration-300 hover:text-white focus-visible:text-white max-xl:text-accent max-xl:shadow-[inset_0_0_0_1px_#4f46e5] ${size} ${full ? "flex w-full" : "inline-flex"}`}
    >
      {/* the flood: a circle centred on the cursor, growing from nothing until it covers the button */}
      <span
        aria-hidden="true"
        className="bg-accent ease-figma pointer-events-none absolute aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full transition-transform duration-500 group-hover:scale-100 group-focus-visible:scale-100"
        style={{ left: "var(--x, 50%)", top: "var(--y, 50%)" }}
      />
      <span className="relative">{label[lang]}</span>
    </a>
  );
}
