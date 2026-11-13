import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Lightbox from "@/components/Lightbox";
import ScrollEffects from "@/components/ScrollEffects";
import SmoothScroll from "@/components/SmoothScroll";
import StateGroups from "@/components/StateGroups";
import type { Lang } from "@/lib/site";

/** The breakpoints at which the design file shows a piece of the shell */
export type ShellPresence = {
  readonly mobile: boolean;
  readonly tablet: boolean;
  readonly desktop: boolean;
};

/**
 * The page wrapper: header, the body from the generator, footer.
 * The contact footer shows at every width as soon as the design file has it at
 * any one of them. It was missing from the English home page on tablet and from
 * the English EazyChange page on phone, while the Russian versions had it —
 * an oversight, and without the footer the contact button has nowhere to scroll
 * (2026-10-22).
 */
export default function SitePage({
  lang,
  shell,
  active,
  children,
}: {
  lang: Lang;
  shell: { header: ShellPresence; footer: ShellPresence };
  /** which navigation item to light */
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
      <SmoothScroll />
      <ScrollEffects />
      <StateGroups />
      <Lightbox />
    </>
  );
}
