"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinkBase =
  "px-3 py-2 text-[16px] leading-6 font-semibold transition-colors duration-200 ease-figma";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Меню на узких экранах перекрывает страницу — блокируем прокрутку под ним
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between bg-white px-5 md:px-10 xl:h-20 xl:px-14"
        // высота: 56px на mobile/tablet, 80px на desktop — как в оригинале
      >
        {/* Логотип */}
        <Link href="/home-ru" aria-label="На главную" className="flex items-center">
          <Image
            src="/img/logo-small.svg"
            alt="ivan.grigorenko.dsgn"
            width={32}
            height={22}
            priority
            className="block xl:hidden"
          />
          <Image
            src="/img/logo-desktop.svg"
            alt="ivan.grigorenko.dsgn"
            width={40}
            height={27}
            priority
            className="hidden xl:block"
          />
        </Link>

        {/* Навигация — только desktop */}
        <nav className="hidden items-center gap-3 xl:flex">
          <a href="#projects" className={`${navLinkBase} text-accent`}>
            Проекты
          </a>
          <Link href="/about-ru" prefetch={false} className={`${navLinkBase} text-muted hover:text-accent`}>
            Обо мне
          </Link>
          <a href="#contacts" className={`${navLinkBase} text-muted hover:text-accent`}>
            Контакты
          </a>
        </nav>

        {/* Переключатель языка — только desktop */}
        <div className="hidden items-center xl:flex">
          <Link href="/" className="px-1 py-2 text-[16px] leading-6 font-semibold text-muted transition-colors duration-200 ease-figma hover:text-accent">
            EN
          </Link>
          <span className="px-1 text-[16px] leading-6 font-semibold text-muted">/</span>
          <span className="px-1 py-2 text-[16px] leading-6 font-semibold text-accent">RU</span>
        </div>

        {/* Бургер — mobile и tablet */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
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

      {/* Оверлей меню для узких экранов */}
      {menuOpen && (
        <div className="fixed inset-0 top-14 z-40 bg-white px-5 pt-8 xl:hidden">
          <nav className="flex flex-col gap-6">
            <a
              href="#projects"
              onClick={() => setMenuOpen(false)}
              className="text-[20px] leading-7 font-semibold text-accent"
            >
              Проекты
            </a>
            <Link
              href="/about-ru"
              prefetch={false}
              onClick={() => setMenuOpen(false)}
              className="text-[20px] leading-7 font-semibold text-muted"
            >
              Обо мне
            </Link>
            <a
              href="#contacts"
              onClick={() => setMenuOpen(false)}
              className="text-[20px] leading-7 font-semibold text-muted"
            >
              Контакты
            </a>
            <div className="mt-2 flex items-center gap-1 text-[20px] leading-7 font-semibold">
              <Link href="/" onClick={() => setMenuOpen(false)} className="text-muted">
                EN
              </Link>
              <span className="text-muted">/</span>
              <span className="text-accent">RU</span>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
