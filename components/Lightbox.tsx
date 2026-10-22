"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Увеличение схем и экранов по клику — как на оригинале.
 *
 * Блок с `data-lightbox` открывается поверх страницы: тёмная подложка,
 * копия блока по центру, вписанная в 94% окна (в оригинале 80%; увеличено по просьбе Ивана 2026-10-06). Закрывается кликом по
 * подложке, крестиком или Esc.
 *
 * Если блок — слайд карусели (внутри `data-state`), по бокам стоят стрелки
 * (и ←/→ на клавиатуре). Они листают и саму карусель на странице: нажимают её
 * стрелку, так что после закрытия карусель стоит на том же слайде.
 */
/** Какую долю окна занимает увеличенный блок по той стороне, в которую он упирается */
const FILL = 0.94;

type Shot = { html: string; width: number; height: number };

/** Копия блока для показа: без положения на странице и без слоёв, скрытых в текущем состоянии */
const capture = (opener: HTMLElement): Shot => {
  // подпись над картинкой («Типографика») в увеличенном виде не нужна — только сама картинка
  const kids = [...opener.children].filter((c) => getComputedStyle(c).display !== "none");
  const art = kids.filter((c) => c.tagName !== "P");
  const el = kids.length > 1 && art.length === 1 ? (art[0] as HTMLElement) : opener;
  const copy = el.cloneNode(true) as HTMLElement;
  // слои других состояний карусели скрывают правила вида `.sg-N[data-state] .sn-N-k`,
  // а копия стоит вне карусели — убираем то, что сейчас не видно
  const prune = (src: Element, dst: Element) => {
    const kids = [...dst.children];
    [...src.children].forEach((c, i) => {
      if (getComputedStyle(c).display === "none") kids[i].remove();
      else prune(c, kids[i]);
    });
  };
  prune(el, copy);
  copy.removeAttribute("data-lightbox");
  copy.removeAttribute("role");
  copy.removeAttribute("tabindex");
  Object.assign(copy.style, {
    position: "relative", left: "0", top: "0", right: "auto", bottom: "auto",
    margin: "0", transform: "none", cursor: "auto", flex: "none",
    width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px`,
  });
  copy.querySelectorAll("img").forEach((img) => img.setAttribute("loading", "eager"));
  return { html: copy.outerHTML, width: el.offsetWidth, height: el.offsetHeight };
};

/** Увеличиваемые слайды той же карусели, по порядку */
const slidesOf = (el: HTMLElement) => {
  const root = el.closest<HTMLElement>("[data-state]");
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>("[data-lightbox]")].filter((n) => getComputedStyle(n).display !== "none");
};

/** Стрелка карусели, которая сейчас листает в нужную сторону: −1 — назад, 1 — вперёд */
const arrowOf = (el: HTMLElement, dir: number) => {
  const root = el.closest<HTMLElement>("[data-state]");
  if (!root) return null;
  const box = root.getBoundingClientRect();
  const mid = box.left + box.width / 2;
  return [...root.querySelectorAll<HTMLElement>("[data-swap-map]:not([data-toggle])")].find((a) => {
    let map: Record<string, string> = {};
    try { map = JSON.parse(a.dataset.swapMap || "{}"); } catch {}
    const r = a.getBoundingClientRect();
    if (!r.width || !map[root.dataset.state || ""]) return false;
    return dir < 0 ? r.left + r.width / 2 < mid : r.left + r.width / 2 > mid;
  }) ?? null;
};

const navOf = (el: HTMLElement) => {
  const slides = slidesOf(el);
  const at = slides.indexOf(el);
  return { prev: at > 0, next: at >= 0 && at < slides.length - 1 };
};

/** Стрелка «назад/вперёд» в увеличенном виде — того же вида, что крестик */
function NavArrow({ dir, shown, onClick }: { dir: -1 | 1; shown: boolean; onClick: () => void }) {
  return (
    <div style={{ position: "absolute", top: "50%", [dir < 0 ? "left" : "right"]: 0, zIndex: 1, boxSizing: "content-box", width: "max(10vh, 10vw)", maxWidth: 56, padding: "min(2vw, 16px)", transform: "translateY(-50%)", opacity: shown ? 1 : 0, transition: "opacity 200ms ease-out" }}>
      <button
        type="button"
        aria-label={dir < 0 ? "Previous" : "Next"}
        onClick={onClick}
        className="lightbox-arrow"
        style={{ position: "relative", display: "block", width: "100%", aspectRatio: "1 / 1", borderRadius: "9999px", color: "#fff", cursor: "pointer" }}
      >
        <svg viewBox="0 0 15 15" fill="none" aria-hidden="true" style={{ position: "absolute", inset: "20%" }}>
          <path d={dir < 0 ? "M9.5 2L4 7.5L9.5 13" : "M5.5 2L11 7.5L5.5 13"} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

export default function Lightbox() {
  const [open, setOpen] = useState<Shot | null>(null);
  // соседние слайды карусели: есть ли куда листать
  const [nav, setNav] = useState({ prev: false, next: false });
  const [fading, setFading] = useState(false);
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
      opener.current = el;
      setOpen(capture(el));
      setNav(navOf(el));
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

  const go = useCallback((dir: -1 | 1) => {
    const el = opener.current;
    if (!el) return;
    const slides = slidesOf(el);
    const at = slides.indexOf(el);
    if (at < 0 || !slides[at + dir]) return;
    // листаем карусель на странице: состояние меняется сразу, слои встают по нему
    arrowOf(el, dir)?.click();
    const to = slidesOf(el)[at + dir] ?? slides[at + dir];
    opener.current = to;
    setFading(true);
    window.setTimeout(() => {
      setOpen(capture(to));
      setNav(navOf(to));
      setFading(false);
    }, 120);
  }, []);

  useEffect(() => {
    if (!open) return;
    const fit = () => {
      // по бокам место под стрелки листания, чтобы они не ложились на картинку
      const arrow = Math.min(Math.max(window.innerWidth, window.innerHeight) * 0.1, 56) + 2 * Math.min(window.innerWidth * 0.02, 16);
      const room = window.innerWidth - (nav.prev || nav.next ? 2 * arrow : 0);
      // почти во весь экран: по 3% полей с каждой стороны (в оригинале было 80% окна)
      setScale(Math.min((room * FILL) / open.width, (window.innerHeight * FILL) / open.height));
    };
    fit();
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("resize", fit);
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, nav, close, go]);

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
      {nav.prev && <NavArrow dir={-1} shown={shown} onClick={() => go(-1)} />}
      {nav.next && <NavArrow dir={1} shown={shown} onClick={() => go(1)} />}
      <div
        className="figma-page"
        style={{ position: "relative", width: open.width, height: open.height, flex: "none", pointerEvents: "none", transform: `scale(${shown ? scale : scale * 0.6})`, opacity: shown && !fading ? 1 : 0, transition: "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease-out" }}
        dangerouslySetInnerHTML={{ __html: open.html }}
      />
    </div>
  );
}
