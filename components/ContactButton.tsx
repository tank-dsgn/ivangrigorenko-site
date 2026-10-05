import type { Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

/**
 * Кнопка «Связаться со мной»: прокручивает к блоку контактов внизу страницы.
 * Стоит в первом экране главной, по центру под заголовком.
 * В оригинале её нет (добавлена 2026-10-05), в страницу её вставляет генератор —
 * см. `additions` в tools/figma/overrides.json.
 *
 * Вид — контурная кнопка из макета (как «Скачать моё резюме»), поля 32px.
 * При наведении по контуру прорисовывается индиго-обводка толщиной 2px, текст
 * становится индиго, а по обводке всё время, пока курсор на кнопке, бежит светлый
 * блик. При уходе курсора обводка сворачивается обратно.
 */
export default function ContactButton({ lang }: { lang: Lang }) {
  return (
    <a
      href="#contacts"
      className="group text-muted ease-figma hover:text-accent focus-visible:text-accent relative inline-flex h-10 items-center justify-center rounded-full bg-white px-8 text-[16px] leading-6 font-semibold whitespace-nowrap transition-colors duration-300 motion-reduce:transition-none"
    >
      {label[lang]}
      {/* серая обводка — всегда */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-[0.5px] h-[calc(100%-1px)] w-[calc(100%-1px)] overflow-visible" fill="none">
        <rect width="100%" height="100%" rx="19.5" stroke="#94a3b8" />
      </svg>
      {/* индиго рисуется по контуру, по ней бежит блик */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-px h-[calc(100%-2px)] w-[calc(100%-2px)] overflow-visible" fill="none" strokeWidth="2" strokeLinecap="round">
        <rect
          width="100%"
          height="100%"
          rx="19"
          stroke="#4f46e5"
          pathLength={1}
          strokeDasharray={1}
          className="ease-figma transition-[stroke-dashoffset] duration-700 [stroke-dashoffset:1] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0] motion-reduce:transition-none"
        />
        <rect
          width="100%"
          height="100%"
          rx="19"
          stroke="#c7d2fe"
          pathLength={1}
          strokeDasharray="0.12 0.88"
          className="opacity-0 transition-opacity delay-0 duration-200 group-hover:animate-[border-run_1.6s_linear_infinite] group-hover:opacity-100 group-hover:delay-500 group-focus-visible:animate-[border-run_1.6s_linear_infinite] group-focus-visible:opacity-100 motion-reduce:hidden"
        />
      </svg>
    </a>
  );
}
