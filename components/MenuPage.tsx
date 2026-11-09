import Image from "next/image";
import Link from "next/link";
import MenuToggle from "@/components/MenuToggle";
import Logo from "@/components/Logo";
import { aboutHref, asset, homeHref, t, type Lang } from "@/lib/site";

const CHEVRON = asset("3da0fc8f089163f811ba928a9a57d20e869f8486.svg");

/**
 * The menu screen for narrow widths.
 *
 * In the original each section has its own page: `/<section>-menu-<language>`.
 * They differ only in which item is lit and where the cross goes back to, so
 * one component covers all sixteen.
 */
export default function MenuPage({
  lang,
  active,
  back,
  altMenu,
}: {
  lang: Lang;
  /** the lit item; case pages have none */
  active?: "work" | "about";
  /** where the cross goes back to: the page we came from */
  back: string;
  /** the same menu in the other language */
  altMenu: string;
}) {
  const s = t[lang];

  // in the English menu the original calls the first item Projects, not Work as in the header
  const rows = [
    { key: "work" as const, label: lang === "en" ? "Projects" : s.nav.work, href: homeHref(lang) },
    { key: "about" as const, label: s.nav.about, href: aboutHref(lang) },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      <header className="shadow-header flex h-14 items-center justify-between px-5 md:px-10">
        <Link href={homeHref(lang)} aria-label={s.toHome}>
          <Logo className="w-8" />
        </Link>

        <MenuToggle href={back} label={s.menuClose} open />
      </header>

      <nav className="mt-6 flex flex-col gap-3 px-5 md:px-10">
        {rows.map((row) => {
          const isActive = row.key === active;
          const text = "text-[16px] leading-6 font-semibold";

          // in the original the active item is neither a link nor carries an arrow
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

      {/* "EN" carries its own 4px padding for the tap target; the block to its left is narrower by the same amount, so the text lines up with the menu items */}
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
