import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Lightbox from "@/components/Lightbox";
import ScrollEffects from "@/components/ScrollEffects";
import StateGroups from "@/components/StateGroups";
import type { Lang } from "@/lib/site";

/** На каких брейкпоинтах макет показывает элемент оболочки */
export type ShellPresence = {
  readonly mobile: boolean;
  readonly tablet: boolean;
  readonly desktop: boolean;
};

/**
 * Обёртка страницы: шапка, тело из генератора, футер.
 * Футер с контактами — на всех ширинах, если он есть в макете хоть на одной.
 * В макете его не было на главной EN на планшете и на EazyChange EN на телефоне — в русских
 * версиях он есть, это пропуск; без футера кнопке «Связаться» некуда прокручивать (2026-10-22).
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
  active?: "work" | "about";
  children: React.ReactNode;
}) {
  const { mobile, tablet, desktop } = shell.footer;
  const hasFooter = mobile || tablet || desktop;

  return (
    <>
      <Header lang={lang} active={active} />
      <main className="pt-14 xl:pt-20">{children}</main>
      {hasFooter && <Footer lang={lang} />}
      <ScrollEffects />
      <StateGroups />
      <Lightbox />
    </>
  );
}
