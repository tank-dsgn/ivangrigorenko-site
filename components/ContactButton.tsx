import type { Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

// блик бежит по контуру, пока курсор на кнопке; появляется после того, как обводка дорисована
const RUN =
  "opacity-0 transition-opacity duration-200 group-hover:animate-[border-run_1.8s_linear_infinite] group-hover:opacity-100 group-hover:delay-500 group-focus-visible:animate-[border-run_1.8s_linear_infinite] group-focus-visible:opacity-100 motion-reduce:hidden";

/**
 * Кнопка «Связаться со мной»: прокручивает к блоку контактов внизу страницы.
 * Стоит в первом экране главной, по центру под заголовком.
 * В оригинале её нет (добавлена 2026-10-05), в страницу её вставляет генератор —
 * см. `additions` в tools/figma/overrides.json.
 *
 * Вид — контурная кнопка из макета (как «Скачать моё резюме»), поля 32px.
 * При наведении:
 *   - индиго-обводка 2px прорисовывается по контуру, текст становится индиго;
 *   - под кнопкой проступает мягкая индиго-тень;
 *   - по контуру бежит блик с размытым ореолом — он выходит за границы обводки.
 * При уходе курсора всё сворачивается обратно.
 */
export default function ContactButton({ lang }: { lang: Lang }) {
  return (
    <a
      href="#contacts"
      className="group text-muted ease-figma hover:text-accent focus-visible:text-accent relative isolate inline-flex h-10 items-center justify-center rounded-full px-8 text-[16px] leading-6 font-semibold whitespace-nowrap transition-[color,box-shadow] duration-300 hover:shadow-[0_8px_24px_-8px_rgba(79,70,229,0.45)] focus-visible:shadow-[0_8px_24px_-8px_rgba(79,70,229,0.45)] motion-reduce:transition-none"
    >
      {/* ореол блика: под кнопкой, размытый, виден только снаружи */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-px -z-10 h-[calc(100%-2px)] w-[calc(100%-2px)] overflow-visible blur-[5px]" fill="none" strokeWidth="8" strokeLinecap="round">
        <rect width="100%" height="100%" rx="19" stroke="#6366f1" pathLength={1} strokeDasharray="0.16 0.84" className={RUN} />
      </svg>
      {/* белый фон кнопки отдельным слоем: он закрывает ореол изнутри */}
      <span aria-hidden="true" className="absolute inset-0 -z-[5] rounded-full bg-white" />
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
        <rect width="100%" height="100%" rx="19" stroke="#c7d2fe" pathLength={1} strokeDasharray="0.12 0.88" className={RUN} />
      </svg>
    </a>
  );
}
