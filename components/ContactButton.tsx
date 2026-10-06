import { mailtoHref, type Lang } from "@/lib/site";

// русская подпись сокращена 06.10 по просьбе Ивана: глагол остался, «со мной» убрано
const label = { ru: "Связаться", en: "Contact me" } as const;

/**
 * Кнопка «Связаться со мной». В оригинале её нет (добавлена 2026-10-05),
 * в страницы её вставляет генератор — см. `additions` в tools/figma/overrides.json.
 *
 * Стоит в первом экране главной, под заголовком, по левому краю текста: крупная (48px, текст
 * 18px; на телефоне 40px и 16px), прокручивает к блоку контактов внизу.
 * Свойства `mail`, `compact`, `full` остались от варианта для «Обо мне» (кнопка
 * размером с «Скачать моё резюме», открывает письмо) — сейчас он не используется.
 *
 * Вид — контурная кнопка из макета. При наведении обводка и текст становятся индиго,
 * а вокруг кнопки один раз рисуется кольцо: полупрозрачный индиго, 4px снаружи обводки,
 * за 700 мс обходит кнопку и остаётся. Когда курсор уходит, кольцо так же убирается.
 * Ничего не крутится по кругу. Вариант «E — Draw once», выбран Иваном 2026-10-06
 * после бегунка по обводке, бегунка по кольцу и переливающегося ореола.
 */
export default function ContactButton({
  lang,
  mail,
  compact,
  full,
}: {
  lang: Lang;
  /** открыть письмо, а не прокручивать к блоку контактов */
  mail?: boolean;
  /** размер обычной кнопки сайта: 40px, текст 16px, поля 16px */
  compact?: boolean;
  /** на всю ширину блока — в столбике на телефоне */
  full?: boolean;
}) {
  const size = compact
    ? "h-10 px-4 text-[16px] leading-6"
    : "h-10 px-8 text-[16px] leading-6 md:h-12 md:px-10 md:text-[18px] md:leading-7";
  return (
    <a
      href={mail ? mailtoHref(lang) : "#contacts"}
      className={`group text-muted ease-figma hover:text-accent focus-visible:text-accent relative items-center justify-center rounded-full font-semibold whitespace-nowrap transition-colors duration-300 ${size} ${full ? "flex w-full" : "inline-flex"}`}
    >
      {/* лицо кнопки: белая заливка и обводка — серая 1px, под курсором индиго 2px */}
      <span
        aria-hidden="true"
        className="ease-figma absolute inset-0 rounded-full bg-white shadow-[inset_0_0_0_1px_#94a3b8] transition-shadow duration-300 group-hover:shadow-[inset_0_0_0_2px_#4f46e5] group-focus-visible:shadow-[inset_0_0_0_2px_#4f46e5]"
      />
      {/* кольцо: рамка стоит по середине полосы в 4px снаружи кнопки и рисуется штрихом от нуля до полной длины */}
      <svg aria-hidden="true" className="pointer-events-none absolute -inset-0.5 h-[calc(100%+4px)] w-[calc(100%+4px)] overflow-visible" fill="none" strokeWidth="4" strokeLinecap="round">
        <rect
          width="100%"
          height="100%"
          rx="22"
          stroke="#4f46e5"
          strokeOpacity="0.22"
          pathLength={1}
          className={`[stroke-dasharray:1_1] [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(0.3,0,0.2,1)] group-hover:[stroke-dashoffset:0] group-focus-visible:[stroke-dashoffset:0] ${compact ? "" : "md:[rx:26px]"}`}
        />
      </svg>
      <span className="relative">{label[lang]}</span>
    </a>
  );
}
