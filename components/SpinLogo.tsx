"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

/**
 * Логотип под курсором делает один полный оборот вокруг вертикальной оси —
 * по образцу логотипа designsystems.surf (просьба Ивана 2026-10-30): 360° за 1,8 с,
 * медленно в начале и в конце. Анимация запускается из кода, а не через :hover,
 * чтобы оборот доигрывал, даже если курсор ушёл раньше, и не начинался заново на середине.
 * На сенсорных экранах наведения нет — там логотип не вращается.
 */
export default function SpinLogo({ children }: { children: ReactNode }) {
  const box = useRef<HTMLSpanElement>(null);
  const spin = useRef<Animation | null>(null);

  const onPointerEnter = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || spin.current?.playState === "running") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    spin.current = box.current?.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(360deg)" }], {
      duration: 1800,
      easing: "cubic-bezier(0.45, 0, 0.55, 1)",
    }) ?? null;
  };

  return (
    <span ref={box} onPointerEnter={onPointerEnter} className="inline-flex items-center">
      {children}
    </span>
  );
}
