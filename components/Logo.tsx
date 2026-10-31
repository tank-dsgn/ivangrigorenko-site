"use client";

import { useRef, type PointerEvent } from "react";

/**
 * Логотип под курсором: G делает оборот в плоскости, точка невысоко подпрыгивает, при касании
 * сплющивается и пружинит обратно, I стоит (выбор Ивана 2026-10-31). Логотип встроен как SVG,
 * а не картинкой, иначе буквы и точку не сдвинуть по отдельности. Анимация запускается из кода,
 * а не через :hover, чтобы доигрывала, когда курсор ушёл. На сенсорных экранах наведения нет.
 */
export default function Logo({ className = "" }: { className?: string }) {
  const letter = useRef<SVGPathElement>(null);
  const dot = useRef<SVGPathElement>(null);
  const hop = useRef<Animation | null>(null);

  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || hop.current?.playState === "running") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    letter.current?.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
      duration: 800,
      easing: "cubic-bezier(0.65, 0, 0.35, 1)",
    });
    hop.current = dot.current?.animate(
      [
        { transform: "translateY(0) scale(1, 1)", easing: "ease-out" },
        { transform: "translateY(-6px) scale(0.97, 1.03)", offset: 0.25, easing: "ease-in" },
        { transform: "translateY(0) scale(1, 1)", offset: 0.5, easing: "ease-out" },
        { transform: "translateY(0) scale(1.3, 0.65)", offset: 0.68, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
        { transform: "translateY(0) scale(1, 1)" },
      ],
      { duration: 640, delay: 320 },
    ) ?? null;
  };

  return (
    <svg
      viewBox="0 0 40 27.3171"
      role="img"
      aria-label="IvanGrigorenko"
      onPointerEnter={onPointerEnter}
      className={`block h-auto fill-accent ${className}`}
    >
      <path
        ref={letter}
        className="[transform-box:fill-box] [transform-origin:center]"
        d="M21.4157 0C23.6466 8.65056e-06 25.6691 0.412794 27.4832 1.23818C29.3218 2.06363 30.842 3.20208 32.0433 4.65281L28.1089 8.66821C27.2753 7.56759 26.2945 6.7422 25.1668 6.19186C24.039 5.64152 22.764 5.3664 21.342 5.3664C19.8221 5.36642 18.4615 5.71617 17.2602 6.41654C16.059 7.0919 15.1151 8.05502 14.4287 9.30563C13.7668 10.5313 13.4354 11.97 13.4354 13.6209C13.4354 15.272 13.7667 16.7231 14.4287 17.9738C15.0906 19.2245 15.9974 20.2001 17.1496 20.9005C18.3019 21.601 19.6263 21.9516 21.1218 21.9516C22.6415 21.9516 23.9284 21.6637 24.9825 21.0886C26.0611 20.4883 26.8825 19.6375 27.4464 18.537C27.6915 18.068 27.8846 17.5571 28.0276 17.0057L20.5699 16.8861V11.8948H34.2132V12.7579C34.2132 15.9348 33.6492 18.6114 32.5215 20.7877C31.4182 22.939 29.8736 24.5655 27.8877 25.6662C25.9265 26.7667 23.659 27.317 21.085 27.3171C19.1972 27.3171 17.419 26.9674 15.7518 26.2669C14.1093 25.5665 12.6756 24.6026 11.4498 23.3769C10.2241 22.1262 9.25552 20.6757 8.54456 19.0249C7.85809 17.3489 7.51441 15.5471 7.51441 13.6209C7.51443 11.6948 7.87047 9.90645 8.58142 8.25549C9.29241 6.60446 10.2731 5.16595 11.5235 3.94019C12.7983 2.68949 14.2814 1.72649 15.973 1.0511C17.6646 0.350666 19.4789 0 21.4157 0Z"
      />
      <path d="M5.77356 26.9043H0V0.412726H5.77356V26.9043Z" />
      <path
        ref={dot}
        className="[transform-box:fill-box] [transform-origin:50%_100%]"
        d="M36.6534 19.9921C37.6341 19.9922 38.4306 20.3302 39.0436 21.0056C39.681 21.656 40 22.4814 40 23.482C40 24.4325 39.681 25.2454 39.0436 25.9207C38.4307 26.5961 37.6341 26.9342 36.6534 26.9342C35.6973 26.9342 34.9007 26.5961 34.2633 25.9207C33.6259 25.2454 33.3069 24.4325 33.3069 23.482C33.3069 22.4814 33.6259 21.656 34.2633 21.0056C34.9007 20.3302 35.6973 19.9921 36.6534 19.9921Z"
      />
    </svg>
  );
}
