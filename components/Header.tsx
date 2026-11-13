"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { aboutHref, homeHref, t, type Lang } from "@/lib/site";
import { findPage, menuHref } from "@/lib/pages";
import MenuToggle from "@/components/MenuToggle";
import Logo from "@/components/Logo";
import { scrollToTop } from "@/components/SmoothScroll";

const linkBase =
  "px-3 py-2 text-[16px] leading-6 font-semibold transition-colors duration-200 ease-figma";

export default function Header({
  lang,
  active,
}: {
  lang: Lang;
  /** which item is lit in indigo */
  active?: "work" | "about";
}) {
  const pathname = usePathname();
  const s = t[lang];
  const other: Lang = lang === "ru" ? "en" : "ru";

  // link to the same page in the other language
  const altHref = findPage(pathname)?.counterpart ?? homeHref(other);

  // A link to the page we are already on leads nowhere, so it scrolls to the
  // top instead. That is how the logo and Work behave on the home page.
  const toTop = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (href !== pathname || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    scrollToTop();
  };

  // on narrow screens the burger opens a separate menu screen, as in the original
  const menu = menuHref(pathname) ?? menuHref(homeHref(lang))!;

  const langSwitch =
    lang === "ru" ? (
      <>
        <Link href={altHref} className="text-muted hover:text-accent ease-figma px-1 py-2 text-[16px] leading-6 font-semibold transition-colors duration-200">
          EN
        </Link>
        <span className="text-muted px-1 text-[16px] leading-6 font-semibold">/</span>
        <span className="text-accent px-1 py-2 text-[16px] leading-6 font-semibold">RU</span>
      </>
    ) : (
      <>
        <span className="text-accent px-1 py-2 text-[16px] leading-6 font-semibold">EN</span>
        <span className="text-muted px-1 text-[16px] leading-6 font-semibold">/</span>
        <Link href={altHref} className="text-muted hover:text-accent ease-figma px-1 py-2 text-[16px] leading-6 font-semibold transition-colors duration-200">
          RU
        </Link>
      </>
    );

  return (
    // a soft shadow below (shadow-header), matched to Ivan's sample on 2026-10-22, on every page
    <header className="shadow-header fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-white px-5 md:px-10 xl:h-20 xl:px-14">
      <Link href={homeHref(lang)} onClick={toTop(homeHref(lang))} aria-label={s.toHome} className="flex items-center">
        <Logo className="w-8 xl:w-10" />
      </Link>

      <nav className="hidden items-center gap-3 xl:flex">
        {active === "work" ? (
          <Link href={homeHref(lang)} onClick={toTop(homeHref(lang))} className={`${linkBase} text-accent`}>
            {s.nav.work}
          </Link>
        ) : (
          <Link href={homeHref(lang)} className={`${linkBase} text-muted hover:text-accent`}>
            {s.nav.work}
          </Link>
        )}

        {active === "about" ? (
          <span className={`${linkBase} text-accent`}>{s.nav.about}</span>
        ) : (
          <Link href={aboutHref(lang)} className={`${linkBase} text-muted hover:text-accent`}>
            {s.nav.about}
          </Link>
        )}

      </nav>

      <div className="hidden items-center xl:flex">{langSwitch}</div>

      <MenuToggle href={menu} label={s.menuOpen} open={false} className="xl:hidden" />
    </header>
  );
}
