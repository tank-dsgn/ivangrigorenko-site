"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** How long the burger takes to turn into a cross and back, in ms */
const MS = 200;

/**
 * The menu button on narrow screens: a burger in the header, a cross on the menu screen.
 *
 * The menu is a separate page, so the icon first rebuilds in place — the top
 * and bottom bars rotate into a cross and the middle one fades, then back —
 * and only then does the link open. Ivan's request, 2026-10-22.
 * The bars are 20×2 at a 7px pitch, as in the design file's burger; the cross
 * they form is about 14×14, also as in the design file.
 */
export default function MenuToggle({ href, label, open, className = "" }: { href: string; label: string; open: boolean; className?: string }) {
  const router = useRouter();
  const [shown, setShown] = useState(open);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    setShown(!open);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => router.push(href), reduce ? 0 : MS);
  };

  const bar = "absolute left-0.5 h-0.5 w-5 rounded-full bg-[#6366F1] transition-[translate,rotate,scale,opacity] ease-figma motion-reduce:transition-none";
  return (
    <Link href={href} aria-label={label} onClick={onClick} className={`relative flex h-6 w-6 items-center justify-center ${className}`}>
      <span aria-hidden="true" className={`${bar} top-1 ${shown ? "translate-y-[7px] rotate-45" : ""}`} style={{ transitionDuration: `${MS}ms` }} />
      <span aria-hidden="true" className={`${bar} top-[11px] ${shown ? "scale-x-0 opacity-0" : ""}`} style={{ transitionDuration: `${MS}ms` }} />
      <span aria-hidden="true" className={`${bar} top-[18px] ${shown ? "-translate-y-[7px] -rotate-45" : ""}`} style={{ transitionDuration: `${MS}ms` }} />
    </Link>
  );
}
