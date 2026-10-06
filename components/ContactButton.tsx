import { mailtoHref, type Lang } from "@/lib/site";

const label = { ru: "Связаться со мной", en: "Contact me" } as const;

/**
 * Кнопка «Связаться со мной». В оригинале её нет (добавлена 2026-10-05),
 * в страницы её вставляет генератор — см. `additions` в tools/figma/overrides.json.
 *
 * Стоит в первом экране главной, под заголовком, по левому краю текста: крупная (48px, текст
 * 18px; на телефоне 40px и 16px), прокручивает к блоку контактов внизу.
 * Свойства `mail`, `compact`, `full` остались от варианта для «Обо мне» (кнопка
 * размером с «Скачать моё резюме», открывает письмо) — сейчас он не используется.
 *
 * Вид — контурная кнопка из макета. При наведении выделяется целиком: обводка
 * и текст становятся индиго, вокруг мягкое индиго-свечение, всё за 300 мс.
 * Пока курсор на кнопке, по обводке по кругу бежит участок более светлого индиго —
 * неяркий, без свечения наружу.
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
      // тень из трёх слоёв: обводка, кольцо свечения, мягкая тень снизу; в покое два последних прозрачны
      className={`group relative text-muted ease-figma hover:text-accent focus-visible:text-accent items-center justify-center rounded-full bg-white font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_#94a3b8,0_0_0_0_rgba(79,70,229,0),0_8px_24px_-8px_rgba(79,70,229,0)] transition-[color,box-shadow] duration-300 hover:shadow-[inset_0_0_0_2px_#4f46e5,0_0_0_4px_rgba(79,70,229,0.12),0_8px_24px_-8px_rgba(79,70,229,0.45)] focus-visible:shadow-[inset_0_0_0_2px_#4f46e5,0_0_0_4px_rgba(79,70,229,0.12),0_8px_24px_-8px_rgba(79,70,229,0.45)] motion-reduce:transition-none ${size} ${full ? "flex w-full" : "inline-flex"}`}
    >
      {label[lang]}
      {/* бегущий по обводке участок: тот же индиго, только светлее */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-px h-[calc(100%-2px)] w-[calc(100%-2px)] overflow-visible" fill="none" strokeWidth="2" strokeLinecap="round">
        <rect
          width="100%"
          height="100%"
          rx="19"
          stroke="#a5b4fc"
          pathLength={1}
          strokeDasharray="0.22 0.78"
          className={`opacity-0 transition-opacity duration-300 group-hover:animate-[border-run_2.4s_linear_infinite] group-hover:opacity-100 group-focus-visible:animate-[border-run_2.4s_linear_infinite] group-focus-visible:opacity-100 motion-reduce:hidden ${compact ? "" : "md:[rx:23px]"}`}
        />
      </svg>
    </a>
  );
}
