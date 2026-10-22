"use client";

import { useState, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Сколько длится превращение бургера в крестик и обратно, мс */
const MS = 200;

/**
 * Кнопка меню на узких экранах: бургер в шапке и крестик на экране меню.
 *
 * Меню — отдельная страница, поэтому сначала иконка перестраивается на месте
 * (верхняя и нижняя полоски поворачиваются в крестик, средняя гаснет — и обратно),
 * а потом открывается ссылка. Просьба Ивана 2026-10-22.
 * Полоски 20×2 с шагом 7px — как в бургере из макета; крестик из них — около 14×14, как в макете.
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
