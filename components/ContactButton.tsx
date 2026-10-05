import type { Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

/**
 * Кнопка «Связаться со мной»: прокручивает к блоку контактов внизу страницы.
 * Стоит в первом экране главной, по центру под заголовком.
 * В оригинале её нет (добавлена 2026-10-05), в страницу её вставляет генератор —
 * см. `additions` в tools/figma/overrides.json.
 *
 * Вид — контурная кнопка из макета (как «Скачать моё резюме»), поля 24px.
 * При наведении индиго-обводка прорисовывается по контуру кнопки, текст
 * становится индиго; при уходе курсора обводка так же убирается.
 */
export default function ContactButton({ lang }: { lang: Lang }) {
  return (
    <a
      href="#contacts"
      className="group text-muted ease-figma hover:text-accent focus-visible:text-accent relative inline-flex h-10 items-center justify-center rounded-full bg-white px-6 text-[16px] leading-6 font-semibold whitespace-nowrap transition-colors duration-300 motion-reduce:transition-none"
    >
      {label[lang]}
      {/* обводка: серая всегда, поверх неё индиго, которая рисуется по контуру */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-[0.5px] h-[calc(100%-1px)] w-[calc(100%-1px)] overflow-visible" fill="none">
        <rect width="100%" height="100%" rx="19.5" stroke="#94a3b8" />
        <rect
          width="100%"
          height="100%"
          rx="19.5"
          stroke="#4f46e5"
          pathLength={1}
          strokeDasharray={1}
          className="ease-figma transition-[stroke-dashoffset] duration-500 [stroke-dashoffset:1] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0] motion-reduce:transition-none"
        />
      </svg>
    </a>
  );
}
