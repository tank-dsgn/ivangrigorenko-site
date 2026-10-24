"use client";

import { useRef, type MouseEvent } from "react";
import { mailtoHref, type Lang } from "@/lib/site";
import { reachGoal } from "@/components/Analytics";

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
 * Вид — контурная кнопка из макета. При наведении она заливается индиго из той точки,
 * где курсор зашёл на кнопку, текст становится белым; когда курсор уходит, заливка
 * стягивается туда, где он вышел. С клавиатуры заливка идёт из центра.
 * Вариант «A — Fill from cursor», выбран Иваном 2026-10-06 (до него были бегунок по обводке,
 * бегунок по кольцу, переливающийся ореол и кольцо, которое рисуется один раз).
 * На телефоне и планшете (уже 1280px) наведения нет, поэтому кнопка сразу выделена — как
 * кнопка сайта «Посетить сайт» под курсором: обводка и текст индиго (просьба Ивана 2026-10-22).
 * Положение курсора нужно знать в браузере, поэтому компонент клиентский.
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
  // точка, где курсор вошёл в кнопку или вышел из неё, — в переменные --x и --y
  const ref = useRef<HTMLAnchorElement>(null);
  const track = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - box.left}px`);
    el.style.setProperty("--y", `${e.clientY - box.top}px`);
  };

  const size = compact
    ? "h-10 px-4 text-[16px] leading-6"
    : "h-10 px-8 text-[16px] leading-6 md:h-12 md:px-10 md:text-[18px] md:leading-7";
  return (
    <a
      ref={ref}
      href={mail ? mailtoHref(lang) : "#contacts"}
      // цель «Нажал Связаться» в Метрике (Целевое событие contact_button) и событие в GA4
      onClick={() => reachGoal("contact_button")}
      onMouseEnter={track}
      onMouseLeave={track}
      className={`group text-muted ease-figma relative items-center justify-center overflow-hidden rounded-full bg-white font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_#94a3b8] transition-colors duration-300 hover:text-white focus-visible:text-white max-xl:text-accent max-xl:shadow-[inset_0_0_0_1px_#4f46e5] ${size} ${full ? "flex w-full" : "inline-flex"}`}
    >
      {/* заливка: круг с центром в точке курсора, вырастает от нуля и накрывает всю кнопку */}
      <span
        aria-hidden="true"
        className="bg-accent ease-figma pointer-events-none absolute aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full transition-transform duration-500 group-hover:scale-100 group-focus-visible:scale-100"
        style={{ left: "var(--x, 50%)", top: "var(--y, 50%)" }}
      />
      <span className="relative">{label[lang]}</span>
    </a>
  );
}
