"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";

/**
 * Кнопка сайта — контурная, 40px: «Скачать моё резюме», «Посетить сайт», «Открыть прототип».
 *
 * В макете это компонент «Button» (Type=outlined). Страницы вызывают её из
 * сгенерированной вёрстки (tools/figma/emit.mjs, siteButton).
 * Поведение как у «Связаться» (ContactButton, просьба Ивана 2026-11-04): под курсором кнопка
 * заливается индиго из точки, где курсор зашёл, текст белый; когда курсор уходит, заливка
 * стягивается туда, где он вышел. С клавиатуры — из центра. На телефоне и планшете (уже 1280px)
 * наведения нет, поэтому обводка и текст сразу индиго. Положение курсора нужно знать
 * в браузере, поэтому компонент клиентский.
 */
export default function Button({
  href,
  label,
  newTab,
  width,
  wideLabel,
}: {
  href: string;
  label: string;
  /** открыть в новой вкладке — для внешних ссылок */
  newTab?: boolean;
  /** ширина: по тексту (по умолчанию), "fill" — на всю ширину блока, либо точное значение ("335px").
   *  "fill" — только до 1024px: планшетная вёрстка идёт до 1280, а с 1024 кнопка как на десктопе —
   *  по тексту и слева (просьба Ивана 2026-10-22) */
  width?: string;
  /** подпись занимает всю кнопку — так в макете у «Посетить сайт» на узких экранах; стоит по центру (в макете слева, поправлено по просьбе Ивана 2026-10-22) */
  wideLabel?: boolean;
}) {
  // точка, где курсор вошёл в кнопку или вышел из неё, — в переменные --x и --y
  const box = useRef<HTMLDivElement>(null);
  const track = (e: MouseEvent) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--x", `${e.clientX - r.left}px`);
    el.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  const wide = Boolean(width);
  const fill = width === "fill";
  // ссылка по размеру кнопки: иначе в блочном родителе она растягивается и ховер срабатывает на всю строку
  const className = `group flex flex-row items-start ${fill ? "self-stretch lg:self-start lg:w-fit" : wide ? "" : "w-fit"}`;
  const style = width && width !== "fill" ? { width } : undefined;
  const body = (
    <div
      ref={box}
      onMouseEnter={track}
      onMouseLeave={track}
      className={`relative flex h-10 flex-row items-center justify-center gap-2 overflow-hidden rounded-full bg-white px-4 py-2 shadow-[inset_0_0_0_1px_#94a3b8] max-xl:shadow-[inset_0_0_0_1px_#4f46e5] ${wide ? `min-w-px flex-[1_0_0px] ${fill ? "lg:flex-none" : ""}` : ""}`}
    >
      {/* заливка: круг с центром в точке курсора, вырастает от нуля и накрывает всю кнопку */}
      <span
        aria-hidden="true"
        className="bg-accent ease-figma pointer-events-none absolute aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full transition-transform duration-500 group-hover:scale-100 group-focus-visible:scale-100"
        style={{ left: "var(--x, 50%)", top: "var(--y, 50%)" }}
      />
      <p
        className={`text-muted max-xl:text-accent ease-figma relative text-[16px] leading-6 font-semibold transition-colors duration-300 group-hover:text-white group-focus-visible:text-white ${wideLabel ? "min-w-px flex-[1_0_0px] text-center lg:flex-none lg:whitespace-nowrap" : "whitespace-nowrap"}`}
      >
        {label}
      </p>
    </div>
  );

  // свои страницы — через Link; файлы с сайта (резюме в PDF) — обычной ссылкой
  if (href.startsWith("/") && !/\.\w+$/.test(href)) {
    return (
      <Link href={href} className={className} style={style}>
        {body}
      </Link>
    );
  }
  return (
    <a href={href} className={className} style={style} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {body}
    </a>
  );
}
