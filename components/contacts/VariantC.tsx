import Image from "next/image";
import { asset, type Lang } from "@/lib/site";
import { TelegramIcon, contactData, ext } from "./shared";

const PHOTO = asset("30fdd29f713c9d310a3815868a1edfb5ca53a84b.png");

/**
 * Вариант C — «с лицом»: как «Обо мне». Слева текст и две кнопки
 * (написать на почту и в Telegram), справа фото, под кнопками иконки.
 */
export default function VariantC({ lang }: { lang: Lang }) {
  const d = contactData(lang);
  const write = lang === "ru" ? "Написать на почту" : "Send an email";
  const tg = lang === "ru" ? "Написать в Telegram" : "Message on Telegram";

  return (
    <section className="flex-1 bg-[#fafaf9] px-5 py-8 md:px-10 md:py-10 xl:px-14 xl:py-20">
      <div className="mx-auto flex max-w-[960px] flex-col-reverse gap-8 md:flex-row md:items-center md:justify-between md:gap-10 xl:gap-16">
        <div className="md:max-w-[520px] md:flex-1">
          <h1 className="text-ink text-[24px] leading-8 font-bold xl:text-[30px] xl:leading-9">{d.s.footer.title}</h1>
          <p className="text-body mt-4 text-[16px] leading-6 md:text-[18px] md:leading-7 xl:mt-6">{d.s.footer.subtitle}</p>
          <a href={d.email.href} className="text-ink hover:text-accent ease-figma mt-4 block text-[18px] leading-7 font-semibold break-all transition-colors duration-200 md:text-[20px] xl:mt-6">
            {d.email.value}
          </a>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:flex-wrap">
            <a href={d.email.href} className="bg-accent ease-figma inline-flex h-10 items-center justify-center rounded-full px-4 text-[16px] leading-6 font-semibold text-white transition-opacity duration-200 hover:opacity-80">
              {write}
            </a>
            <a href={d.telegram.href} {...ext} className="text-muted hover:text-accent ease-figma inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-[16px] leading-6 font-semibold shadow-[inset_0_0_0_1px_#94a3b8] transition-colors duration-200 hover:shadow-[inset_0_0_0_1px_#4f46e5]">
              <TelegramIcon className="h-5 w-5" />
              {tg}
            </a>
            <a href={d.resume.href} {...ext} className="text-muted hover:text-accent ease-figma inline-flex h-10 items-center justify-center rounded-full bg-white px-4 text-[16px] leading-6 font-semibold shadow-[inset_0_0_0_1px_#94a3b8] transition-colors duration-200 hover:shadow-[inset_0_0_0_1px_#4f46e5]">
              {d.resume.value}
            </a>
          </div>

          <ul className="mt-8 flex items-center gap-8">
            {d.socials.map((x) => (
              <li key={x.name}>
                <a href={x.href} {...ext} aria-label={x.name} className="ease-figma flex h-7 w-7 items-center justify-center transition-opacity duration-200 hover:opacity-70">
                  <Image src={x.icon} alt="" aria-hidden="true" width={x.w} height={x.h} className="h-auto w-full" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative h-[292px] w-[264px] shrink-0 overflow-hidden rounded-2xl md:h-[365px] md:w-[330px] md:rounded-3xl">
          <Image src={PHOTO} alt="Ivan Grigorenko" fill sizes="330px" className="object-cover" />
        </div>
      </div>
    </section>
  );
}
