"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LOGO_SMALL, LOGO_WIDE, aboutHref, homeHref, t, type Lang } from "@/lib/site";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const s = t[lang];
  const other: Lang = lang === "ru" ? "en" : "ru";

  // ссылка на ту же страницу в другом языке
  const altHref = active === "about" ? aboutHref(other) : homeHref(other);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const langSwitch = (
    <>
      {lang === "ru" ? (
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
      )}
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-white px-5 md:px-10 xl:h-20 xl:px-14">
        <Link href={homeHref(lang)} aria-label={s.toHome} className="flex items-center">
          <Image src={LOGO_SMALL} alt="ivan.grigorenko.dsgn" width={32} height={22} priority className="block xl:hidden" />
          <Image src={LOGO_WIDE} alt="ivan.grigorenko.dsgn" width={40} height={27} priority className="hidden xl:block" />
        </Link>

        <nav className="hidden items-center gap-3 xl:flex">
          {active === "work" ? (
            <a href="#projects" className={`${linkBase} text-accent`}>
              {s.nav.work}
            </a>
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

          <a href="#contacts" className={`${linkBase} text-muted hover:text-accent`}>
            {s.nav.contacts}
          </a>
        </nav>

        <div className="hidden items-center xl:flex">{langSwitch}</div>

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? s.menuClose : s.menuOpen}
          aria-expanded={menuOpen}
          className="flex h-6 w-6 items-center justify-center xl:hidden"
        >
          {menuOpen ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 3L17 17M17 3L3 17" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
              <path d="M1 1H19M1 8H19M1 15H19" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 top-14 z-40 bg-white px-5 pt-8 xl:hidden">
          <nav className="flex flex-col gap-6 text-[20px] leading-7 font-semibold">
            <Link href={homeHref(lang)} onClick={() => setMenuOpen(false)} className={active === "work" ? "text-accent" : "text-muted"}>
              {s.nav.work}
            </Link>
            <Link href={aboutHref(lang)} onClick={() => setMenuOpen(false)} className={active === "about" ? "text-accent" : "text-muted"}>
              {s.nav.about}
            </Link>
            <a href="#contacts" onClick={() => setMenuOpen(false)} className="text-muted">
              {s.nav.contacts}
            </a>
            <div className="mt-2 flex items-center gap-1">{langSwitch}</div>
          </nav>
        </div>
      )}
    </>
  );
}
