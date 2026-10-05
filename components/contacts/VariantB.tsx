import { type Lang } from "@/lib/site";
import { contactData, ext } from "./shared";

/**
 * Вариант B — «карточки»: каждый способ связи — белая карточка, как карточки
 * проектов на главной. Почта крупнее остальных.
 */
export default function VariantB({ lang }: { lang: Lang }) {
  const d = contactData(lang);
  const card =
    "group ease-figma flex flex-col justify-between rounded-2xl bg-white p-6 shadow-[0_8px_20px_0_rgba(0,0,0,0.1)] transition-shadow duration-200 hover:shadow-[0_8px_24px_0_rgba(64,62,92,0.3)] md:rounded-3xl md:p-8";
  const label = "text-muted text-[14px] leading-5 uppercase";
  const value = "text-ink group-hover:text-accent ease-figma font-semibold break-all transition-colors duration-200";
  const arrow = (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="text-faint group-hover:text-accent ease-figma h-4 w-4 shrink-0 transition-colors duration-200">
      <path d="M4 12L12 4M12 4H5.5M12 4V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const small = [d.telegram, d.linkedin, d.behance, d.dribbble, d.resume];

  return (
    <section className="flex-1 bg-[#fafaf9] px-5 py-8 md:px-10 md:py-10 xl:px-14 xl:py-20">
      <div className="mx-auto max-w-[920px]">
        <h1 className="text-ink text-[24px] leading-8 font-bold xl:text-[30px] xl:leading-9">{d.s.footer.title}</h1>
        <p className="text-body mt-2 text-[16px] leading-6 md:text-[18px] md:leading-7 xl:mt-3">{d.s.footer.subtitle}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 md:gap-6 xl:mt-10 xl:grid-cols-3">
          <a href={d.email.href} className={`${card} min-h-[160px] md:col-span-2 xl:col-span-3 xl:min-h-[200px]`}>
            <span className="flex items-start justify-between gap-4">
              <span className={label}>{d.email.label}</span>
              {arrow}
            </span>
            <span className={`${value} text-[16px] leading-6 md:text-[30px] md:leading-9 xl:text-[36px] xl:leading-10`}>{d.email.value}</span>
          </a>
          {small.map((x) => (
            <a key={x.label} href={x.href} {...ext} className={`${card} min-h-[120px] xl:min-h-[140px]`}>
              <span className="flex items-start justify-between gap-4">
                <span className={label}>{x.label}</span>
                {arrow}
              </span>
              <span className={`${value} text-[18px] leading-7 md:text-[20px]`}>{x.value}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
