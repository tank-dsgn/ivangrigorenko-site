import Image from "next/image";
import Link from "next/link";
import MenuToggle from "@/components/MenuToggle";
import { LOGO_SMALL, aboutHref, asset, homeHref, t, type Lang } from "@/lib/site";

const CHEVRON = asset("3da0fc8f089163f811ba928a9a57d20e869f8486.svg");

/**
 * Экран меню для узких экранов.
 *
 * В оригинале это отдельная страница у каждого раздела: `/<раздел>-menu-<язык>`.
 * Отличаются они только тем, какой пункт подсвечен и куда возвращает крестик,
 * поэтому здесь один компонент на все шестнадцать.
 */
export default function MenuPage({
  lang,
  active,
  back,
  altMenu,
}: {
  lang: Lang;
  /** подсвеченный пункт; у страниц кейсов активного нет */
  active?: "work" | "about";
  /** куда возвращает крестик — страница, с которой пришли */
  back: string;
  /** это же меню на другом языке */
  altMenu: string;
}) {
  const s = t[lang];

  // в английском меню первый пункт в оригинале называется Projects, а не Work, как в шапке
  const rows = [
    { key: "work" as const, label: lang === "en" ? "Projects" : s.nav.work, href: homeHref(lang) },
    { key: "about" as const, label: s.nav.about, href: aboutHref(lang) },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="shadow-header flex h-14 items-center justify-between px-5 md:px-10">
        <Link href={homeHref(lang)} aria-label={s.toHome}>
          <Image src={LOGO_SMALL} alt="IvanGrigorenko" width={32} height={22} priority />
        </Link>

        <MenuToggle href={back} label={s.menuClose} open />
      </header>

      <nav className="mt-6 flex flex-col gap-3 px-5 md:px-10">
        {rows.map((row) => {
          const isActive = row.key === active;
          const text = "text-[16px] leading-6 font-semibold";

          // активный пункт в оригинале не ссылка и без стрелки
          if (isActive) {
            return (
              <span key={row.key} className={`text-accent flex h-10 items-center ${text}`}>
                {row.label}
              </span>
            );
          }

          return (
            <Link
              key={row.key}
              href={row.href}
              className={`text-muted hover:text-accent ease-figma flex h-10 items-center justify-between transition-colors duration-200 ${text}`}
            >
              {row.label}
              <Image src={CHEVRON} alt="" aria-hidden="true" width={7} height={12} className="mr-1.5" />
            </Link>
          );
        })}
      </nav>

      {/* у «EN» свои поля 4px для нажатия — слева блок на столько же меньше, текст по краю пунктов меню */}
      <div className="mt-6 flex items-center pr-5 pl-4 text-[16px] leading-6 font-semibold md:pr-10 md:pl-9">
        {lang === "ru" ? (
          <>
            <Link href={altMenu} className="text-muted hover:text-accent ease-figma px-1 py-2 transition-colors duration-200">
              EN
            </Link>
            <span className="text-muted px-1">/</span>
            <span className="text-accent px-1 py-2">RU</span>
          </>
        ) : (
          <>
            <span className="text-accent px-1 py-2">EN</span>
            <span className="text-muted px-1">/</span>
            <Link href={altMenu} className="text-muted hover:text-accent ease-figma px-1 py-2 transition-colors duration-200">
              RU
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
