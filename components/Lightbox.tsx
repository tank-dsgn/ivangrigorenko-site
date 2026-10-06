"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Увеличение схем и экранов по клику — как на оригинале.
 *
 * Блок с `data-lightbox` открывается поверх страницы: тёмная подложка,
 * копия блока по центру, вписанная в 94% окна (в оригинале 80%; увеличено по просьбе Ивана 2026-10-06). Закрывается кликом по
 * подложке, крестиком или Esc.
 */
/** Какую долю окна занимает увеличенный блок по той стороне, в которую он упирается */
const FILL = 0.94;

export default function Lightbox() {
  const [open, setOpen] = useState<{ html: string; width: number; height: number } | null>(null);
  const [shown, setShown] = useState(false);
  const [scale, setScale] = useState(1);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(() => setOpen(null), 200);
    opener.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const activate = (target: EventTarget | null) => {
      const el = (target as HTMLElement | null)?.closest<HTMLElement>("[data-lightbox]");
      if (!el) return false;
      const copy = el.cloneNode(true) as HTMLElement;
      // копия стоит в своей коробке: положение на странице ей не нужно
      copy.removeAttribute("data-lightbox");
      copy.removeAttribute("role");
      copy.removeAttribute("tabindex");
      Object.assign(copy.style, {
        position: "relative", left: "0", top: "0", right: "auto", bottom: "auto",
        margin: "0", transform: "none", cursor: "auto", flex: "none",
        width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px`,
      });
      copy.querySelectorAll("img").forEach((img) => img.setAttribute("loading", "eager"));
      opener.current = el;
      setOpen({ html: copy.outerHTML, width: el.offsetWidth, height: el.offsetHeight });
      return true;
    };
    const onClick = (e: MouseEvent) => {
      activate(e.target);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!(e.target as HTMLElement | null)?.matches?.("[data-lightbox]")) return;
      if (activate(e.target)) e.preventDefault();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const fit = () =>
      // почти во весь экран: по 3% полей с каждой стороны (в оригинале было 80% окна)
      setScale(Math.min((window.innerWidth * FILL) / open.width, (window.innerHeight * FILL) / open.height));
    fit();
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("resize", fit);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
    >
      <div
        onClick={close}
        style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.75)", cursor: "pointer", opacity: shown ? 1 : 0, transition: "opacity 200ms ease-out" }}
      />
      <div style={{ position: "absolute", top: 0, right: 0, zIndex: 1, boxSizing: "content-box", width: "max(10vh, 10vw)", maxWidth: 56, padding: "min(2vw, 16px)", opacity: shown ? 1 : 0, transition: "opacity 200ms ease-out" }}>
        <button
          type="button"
          aria-label="Close"
          autoFocus
          onClick={close}
          style={{ position: "relative", display: "block", width: "100%", aspectRatio: "1 / 1", borderRadius: "9999px", color: "#fff", opacity: 0.75, cursor: "pointer" }}
        >
          <svg viewBox="0 0 15 15" fill="none" aria-hidden="true" style={{ position: "absolute", inset: "28%" }}>
            <path d="M2 2L13 13M13 2L2 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div
        className="figma-page"
        style={{ position: "relative", width: open.width, height: open.height, flex: "none", pointerEvents: "none", transform: `scale(${shown ? scale : scale * 0.6})`, opacity: shown ? 1 : 0, transition: "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease-out" }}
        dangerouslySetInnerHTML={{ __html: open.html }}
      />
    </div>
  );
}
