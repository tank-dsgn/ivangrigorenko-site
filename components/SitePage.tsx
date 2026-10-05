import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Lightbox from "@/components/Lightbox";
import ScrollEffects from "@/components/ScrollEffects";
import type { Lang } from "@/lib/site";

/** На каких брейкпоинтах макет показывает элемент оболочки */
export type ShellPresence = {
  readonly mobile: boolean;
  readonly tablet: boolean;
  readonly desktop: boolean;
};

/** Классы видимости под присутствие в макете (брейкпоинты: <800 / 800–1279 / ≥1280) */
function visibility({ mobile, tablet, desktop }: ShellPresence) {
  if (mobile && tablet && desktop) return "";
  if (!mobile && !tablet && !desktop) return "hidden";
  const parts = [mobile ? "block" : "hidden"];
  if (tablet !== mobile) parts.push(tablet ? "md:block" : "md:hidden");
  if (desktop !== tablet) parts.push(desktop ? "xl:block" : "xl:hidden");
  return parts.join(" ");
}

/**
 * Обёртка страницы: шапка, тело из генератора, футер.
 * Наличие футера берётся из макета — на одной из страниц его нет на телефоне.
 */
export default function SitePage({
  lang,
  shell,
  active,
  children,
}: {
  lang: Lang;
  shell: { header: ShellPresence; footer: ShellPresence };
  /** какой пункт навигации подсветить */
  active?: "work" | "about" | "contacts";
  children: React.ReactNode;
}) {
  const footerClass = visibility(shell.footer);

  return (
    <>
      <Header lang={lang} active={active} />
      <main className="pt-14 xl:pt-20">{children}</main>
      {footerClass !== "hidden" && (
        <div className={footerClass}>
          <Footer lang={lang} />
        </div>
      )}
      <ScrollEffects />
      <Lightbox />
    </>
  );
}
