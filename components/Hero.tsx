import Image from "next/image";
import { cursorArrow, hero } from "@/lib/content/home";
import type { Lang } from "@/lib/site";

export default function Hero({ lang }: { lang: Lang }) {
  const c = hero[lang];
  const [before, accent, after] = c.headline;

  return (
    <section
      className="px-5 pt-10 pb-10 md:px-10 md:pt-14 md:pb-14 xl:px-14 xl:pt-30 xl:pb-[var(--hero-pb)]"
      style={{ ["--hero-pb" as string]: `${c.desktopBottomPad}px` }}
    >
      {/* ширина блока зафиксирована, чтобы переносы строк совпадали с оригиналом */}
      <div className="relative mx-auto w-full max-w-[350px] md:max-w-[720px] xl:max-w-[898px]">
        <p className="text-muted text-[17px] leading-[normal] md:text-[28px] md:leading-9 xl:text-[36px] xl:leading-10">
          <span className="hidden md:inline">{c.eyebrow}</span>
          <span className="md:hidden">{c.eyebrowShort}</span>
        </p>

        <h1 className="text-ink mt-2 text-[20px] leading-[normal] font-bold md:mt-3 md:text-[35px] md:leading-10 xl:mt-5 xl:text-[48px] xl:leading-12">
          {before}
          <span className="text-accent">{accent}</span>
          {after}
        </h1>

        {/* декоративный курсор поверх заголовка — только на десктопе */}
        <Image
          src={cursorArrow}
          alt=""
          aria-hidden="true"
          width={47}
          height={54}
          className="pointer-events-none absolute hidden xl:block"
          style={{ left: c.arrow.left, top: c.arrow.top }}
        />
      </div>
    </section>
  );
}
