"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";

/**
 * The site button: outlined, 40px, and 48px on desktop to match the contact
 * button (Ivan's request, 2026-11-05). It carries "Download my CV", "Visit the
 * site" and "Open the prototype".
 *
 * In the design file this is the "Button" component (Type=outlined). Pages call
 * it from the generated markup (tools/figma/emit.mjs, siteButton).
 * It behaves like the contact button (ContactButton, Ivan's request
 * 2026-11-04): on hover indigo floods in from where the cursor entered and the
 * text turns white; when the cursor leaves, the flood shrinks back to where it
 * left. From the keyboard it starts at the centre. On phone and tablet (under
 * 1280px) there is no hover, so the outline and the text are indigo from the
 * start. The cursor position is only known in the browser, so this is a client
 * component.
 */
export default function Button({
  href,
  label,
  newTab,
  width,
  wideLabel,
}: {
  href: string;
  label: string;
  /** open in a new tab, for external links */
  newTab?: boolean;
  /** width: to the text by default, "fill" for the full width of the block, or
   *  an exact value such as "335px".
   *  "fill" applies below 1024px only: the tablet layout runs to 1280, but from
   *  1024 the button behaves as on desktop — sized to its text and left-aligned
   *  (Ivan's request, 2026-10-22) */
  width?: string;
  /** the label fills the button, as "Visit the site" does on narrow screens in
   *  the design file; centred here, where the design file had it left-aligned
   *  (corrected at Ivan's request, 2026-10-22) */
  wideLabel?: boolean;
}) {
  // the point where the cursor entered or left the button goes into --x and --y
  const box = useRef<HTMLDivElement>(null);
  const track = (e: MouseEvent) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  const wide = Boolean(width);
  const fill = width === "fill";
  // the link is sized to the button: inside a block parent it would otherwise stretch and hover would fire across the whole line
  const className = `group flex flex-row items-start ${fill ? "self-stretch lg:self-start lg:w-fit" : wide ? "" : "w-fit"}`;
  const style = width && width !== "fill" ? { width } : undefined;
  const body = (
    <div
      ref={box}
      onMouseEnter={track}
      onMouseLeave={track}
      className={`relative flex h-10 flex-row items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-4 py-2 xl:h-12 xl:px-6 shadow-[inset_0_0_0_1px_#94a3b8] max-xl:shadow-[inset_0_0_0_1px_#4f46e5] ${wide ? `min-w-px flex-[1_0_0px] ${fill ? "lg:flex-none" : ""}` : ""}`}
    >
      {/* the flood: a circle centred on the cursor, growing from nothing until it covers the button */}
      <span
        aria-hidden="true"
        className="bg-accent ease-figma pointer-events-none absolute aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full transition-transform duration-500 group-hover:scale-100 group-focus-visible:scale-100"
        style={{ left: "var(--x, 50%)", top: "var(--y, 50%)" }}
      />
      <p
        className={`text-muted max-xl:text-accent ease-figma relative text-[16px] leading-6 font-semibold transition-colors duration-300 group-hover:text-white group-focus-visible:text-white ${wideLabel ? "min-w-px flex-[1_0_0px] text-center lg:flex-none lg:whitespace-nowrap" : "whitespace-nowrap"}`}
      >
        {label}
      </p>
    </div>
  );

  // internal pages go through Link; files served by the site, such as the CV in PDF, use a plain link
  if (href.startsWith("/") && !/\.\w+$/.test(href)) {
    return (
      <Link href={href} className={className} style={style}>
        {body}
      </Link>
    );
  }
  return (
    <a href={href} className={className} style={style} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {body}
    </a>
  );
}
