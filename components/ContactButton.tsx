import type { Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

/**
 * Кнопка «Связаться со мной»: прокручивает к блоку контактов внизу страницы.
 * Стоит в первом экране главной.
 * В оригинале её нет (добавлена 2026-10-05), в страницы её вставляет генератор —
 * см. `additions` в tools/figma/overrides.json.
 *
 * Вид — контурная кнопка из макета (как «Скачать моё резюме»). При наведении
 * обводка и текст плавно становятся индиго, а справа от подписи выезжает стрелка —
 * та самая «Arrow Right», что лежит в компоненте кнопки в макете. Длительность
 * и кривая — как у переходов в макете: 300 мс.
 */
export default function ContactButton({ lang, full }: { lang: Lang; /** на всю ширину блока */ full?: boolean }) {
  return (
    <a
      href="#contacts"
      className={`group text-muted ease-figma h-10 items-center justify-center rounded-full bg-white px-6 text-[16px] leading-6 font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_#94a3b8] transition-[color,box-shadow] duration-300 hover:text-accent hover:shadow-[inset_0_0_0_1px_#4f46e5] focus-visible:text-accent focus-visible:shadow-[inset_0_0_0_1px_#4f46e5] motion-reduce:transition-none ${full ? "flex w-full" : "inline-flex"}`}
    >
      {label[lang]}
      <span
        aria-hidden="true"
        className="ease-figma flex w-0 -translate-x-2 items-center justify-end overflow-hidden opacity-0 transition-all duration-300 group-hover:w-7 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:w-7 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 motion-reduce:transition-none"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
          <path
            d="M15 13.333L18.333 10L15 6.667M18.333 10H1.667"
            stroke="currentColor"
            strokeWidth="1.667"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </a>
  );
}
