"use client";

import type { MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOGO_SMALL, LOGO_WIDE, aboutHref, homeHref, t, type Lang } from "@/lib/site";
import { findPage, menuHref } from "@/lib/pages";
import MenuToggle from "@/components/MenuToggle";
import SpinLogo from "@/components/SpinLogo";

const linkBase =
  "px-3 py-2 text-[16px] leading-6 font-semibold transition-colors duration-200 ease-figma";

export default function Header({
  lang,
  active,
}: {
  lang: Lang;
  /** какой пункт подсвечен индиго */
  active?: "work" | "about";
}) {
  const pathname = usePathname();
  const s = t[lang];
  const other: Lang = lang === "ru" ? "en" : "ru";

  // ссылка на ту же страницу в другом языке
  const altHref = findPage(pathname)?.counterpart ?? homeHref(other);

  // Ссылка на страницу, на которой мы уже стоим, никуда не ведёт — прокручиваем к началу.
  // Так логотип и «Проекты» на главной возвращают наверх.
  const toTop = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (href !== pathname || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // на узких экранах бургер ведёт на отдельный экран меню, как в оригинале
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
    // мягкая тень снизу (shadow-header) — по образцу Ивана 2026-10-22, на всех страницах
    <header className="shadow-header fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-white px-5 md:px-10 xl:h-20 xl:px-14">
      <Link href={homeHref(lang)} onClick={toTop(homeHref(lang))} aria-label={s.toHome} className="flex items-center">
        <SpinLogo>
          <Image src={LOGO_SMALL} alt="IvanGrigorenko" width={32} height={22} priority className="block xl:hidden" />
          <Image src={LOGO_WIDE} alt="IvanGrigorenko" width={40} height={27} priority className="hidden xl:block" />
        </SpinLogo>
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
