import Image from "next/image";
import { type Lang } from "@/lib/site";
import { TelegramIcon, contactData, ext } from "./shared";

/**
 * Вариант A — «один экран»: блок «Свяжитесь со мной» из футера, выросший
 * до целой страницы. Крупная почта по центру, под ней иконки.
 */
export default function VariantA({ lang }: { lang: Lang }) {
  const d = contactData(lang);
  return (
    <section className="flex flex-1 flex-col items-center justify-center bg-white px-5 py-12 text-center md:px-10 xl:px-14">
      <p className="text-muted text-[20px] leading-7 md:text-[28px] md:leading-9 xl:text-[36px] xl:leading-10">
        {d.s.footer.subtitle}
      </p>
      <h1 className="text-ink mt-3 text-[32px] leading-10 font-bold md:mt-4 md:text-[40px] md:leading-[48px] xl:text-[48px]">
        {d.s.footer.title}
      </h1>

      <a
        href={d.email.href}
        className="text-accent ease-figma mt-8 text-[18px] leading-7 font-semibold break-all transition-opacity duration-200 hover:opacity-70 md:mt-10 md:text-[24px] md:leading-8 xl:text-[30px] xl:leading-9"
      >
        {d.email.value}
      </a>

      <ul className="mt-8 flex items-center gap-8 md:mt-10 xl:gap-10">
        <li>
          <a href={d.telegram.href} {...ext} aria-label="Telegram" className="text-faint ease-figma block h-8 w-8 transition-opacity duration-200 hover:opacity-70">
            <TelegramIcon className="h-full w-full" />
          </a>
        </li>
        {d.socials.map((x) => (
          <li key={x.name}>
            <a href={x.href} {...ext} aria-label={x.name} className="ease-figma flex h-8 w-8 items-center justify-center transition-opacity duration-200 hover:opacity-70">
              <Image src={x.icon} alt="" aria-hidden="true" width={x.w} height={x.h} className="h-auto w-full" />
            </a>
          </li>
        ))}
      </ul>

      <a
        href={d.resume.href}
        {...ext}
        className="text-muted hover:text-accent ease-figma mt-8 inline-flex h-10 items-center rounded-full bg-white px-4 text-[16px] leading-6 font-semibold shadow-[inset_0_0_0_1px_#94a3b8] transition-colors duration-200 hover:shadow-[inset_0_0_0_1px_#4f46e5] md:mt-10"
      >
        {d.resume.value}
      </a>
    </section>
  );
}
