"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

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
 *
 * Телефон и планшет (2026-10-22). В макете увеличение задано только на десктопе;
 * узким ширинам те же блоки находим по картинкам (`mirrorZoom`). На телефоне блок и так
 * почти во всю ширину, поэтому в увеличенном виде работают жесты: два пальца или
 * двойной тап — приблизить, одним пальцем — двигать приближенное, свайп — соседний
 * слайд карусели. Стрелки на узком экране — внизу, чтобы не отнимать ширину у картинки.
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
    margin: "0", transform: "none", cursor: "inherit", flex: "none",
    width: `${el.offsetWidth}px`, height: `${el.offsetHeight}px`,
  });
  copy.querySelectorAll("img").forEach((img) => img.setAttribute("loading", "eager"));
  return { html: copy.outerHTML, width: el.offsetWidth, height: el.offsetHeight };
};

/**
 * Увеличение на узких ширинах: блоки с теми же картинками, что у увеличиваемого
 * блока десктопа. Берём самый внешний такой блок. Набор может быть и частью
 * десктопного (не меньше двух картинок): в слайде карусели на десктопе лежат
 * картинки всех её состояний, а на телефоне — только свои.
 */
const mirrorZoom = () => {
  const desk = [...document.querySelectorAll<HTMLElement>(".figma-page.xl\\:block")];
  const narrow = [...document.querySelectorAll<HTMLElement>(".figma-page:not(.xl\\:block)")];
  const memo = new Map<Element, string>();
  const sig = (el: Element) => {
    let v = memo.get(el);
    if (v == null) {
      // картинки, видео и фоновые картинки из макета
      const srcs = [...el.querySelectorAll("img, video")].map((m) => m.getAttribute("src") || m.getAttribute("poster") || "");
      for (const b of [el, ...el.querySelectorAll<HTMLElement>("[style*='url(']")]) {
        for (const m of (b as HTMLElement).style.backgroundImage.matchAll(/url\(["']?([^"')]+)/g)) srcs.push(m[1]);
      }
      v = [...new Set(srcs)].filter(Boolean).sort().join("|");
      memo.set(el, v);
    }
    return v;
  };
  // у каждого блока десктопа — его картинки и сколько в нём абзацев
  const wanted = desk
    .flatMap((d) => [...d.querySelectorAll("[data-lightbox]")])
    .map((el) => ({ media: new Set(sig(el).split("|").filter(Boolean)), texts: el.querySelectorAll("p").length }))
    .filter((w) => w.media.size);
  if (!wanted.length) return;
  // текста — не больше, чем в блоке десктопа, и ещё одна подпись сверху: иначе это уже раздел с заголовком
  const fits = (el: Element) => {
    const items = sig(el).split("|").filter(Boolean);
    if (!items.length) return false;
    const texts = el.querySelectorAll("p").length;
    return wanted.some((w) => items.every((i) => w.media.has(i)) && (items.length === w.media.size || items.length >= 2) && texts <= w.texts + 1);
  };
  for (const page of narrow) {
    for (const media of page.querySelectorAll("img, video, [style*='url(']")) {
      // поднимаемся от картинки к самому внешнему блоку с нужным набором
      let hit: HTMLElement | null = null;
      for (let a = /^(IMG|VIDEO)$/.test(media.tagName) ? media.parentElement : (media as HTMLElement); a && a !== page; a = a.parentElement) {
        if (fits(a)) hit = a;
        else if (hit) break;
      }
      if (!hit || hit.hasAttribute("data-lightbox") || hit.closest("a, [data-lightbox]") || hit.querySelector("[data-lightbox]")) continue;
      hit.setAttribute("data-lightbox", "");
      hit.setAttribute("role", "button");
      hit.tabIndex = 0;
      hit.style.cursor = "zoom-in";
    }
  }
};

/** Узкий экран: стрелки листания внизу, а не по бокам */
const isNarrow = () => window.innerWidth < 768;

/** Наибольшее приближение жестом */
const MAX_ZOOM = 4;

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
function NavArrow({ dir, shown, narrow, onClick }: { dir: -1 | 1; shown: boolean; narrow: boolean; onClick: () => void }) {
  const place = narrow ? { bottom: 0 } : { top: "50%", transform: "translateY(-50%)" };
  return (
    <div style={{ position: "absolute", ...place, [dir < 0 ? "left" : "right"]: 0, zIndex: 1, boxSizing: "content-box", width: narrow ? 40 : "max(10vh, 10vw)", maxWidth: 56, padding: narrow ? 16 : "min(2vw, 16px)", opacity: shown ? 1 : 0, transition: "opacity 200ms ease-out" }}>
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
  const [narrow, setNarrow] = useState(false);
  // приближение жестом поверх вписанного размера и сдвиг приближенного
  const [zoom, setZoom] = useState({ z: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const art = useRef<HTMLDivElement | null>(null);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x0: number; y0: number; t0: number; moved: boolean; pinch?: { d0: number; z0: number; mx: number; my: number; px: number; py: number } } | null>(null);
  const lastTap = useRef({ t: 0, x: 0, y: 0 });
  const wasTouch = useRef(false);

  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(() => setOpen(null), 200);
    opener.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    mirrorZoom();
    const activate = (target: EventTarget | null) => {
      const el = (target as HTMLElement | null)?.closest<HTMLElement>("[data-lightbox]");
      if (!el) return false;
      opener.current = el;
      setOpen(capture(el));
      setNav(navOf(el));
      setZoom({ z: 1, x: 0, y: 0 });
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
      setZoom({ z: 1, x: 0, y: 0 });
      setOpen(capture(to));
      setNav(navOf(to));
      setFading(false);
    }, 120);
  }, []);

  useEffect(() => {
    if (!open) return;
    const fit = () => {
      const thin = isNarrow();
      const arrows = nav.prev || nav.next;
      // место под стрелки листания, чтобы они не ложились на картинку: по бокам, а на узком экране — снизу
      const arrow = Math.min(Math.max(window.innerWidth, window.innerHeight) * 0.1, 56) + 2 * Math.min(window.innerWidth * 0.02, 16);
      const room = window.innerWidth - (arrows && !thin ? 2 * arrow : 0);
      const tall = window.innerHeight - (arrows && thin ? 2 * 72 : 0);
      setNarrow(thin);
      // почти во весь экран: по 3% полей с каждой стороны (в оригинале было 80% окна)
      setScale(Math.min((room * FILL) / open.width, (tall * FILL) / open.height));
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

  /** Сдвиг приближенного блока — не дальше его краёв */
  const clampPan = (z: number, x: number, y: number) => {
    if (!open) return { z, x, y };
    const w = open.width * scale * z, h = open.height * scale * z;
    const mx = Math.max(0, (w - window.innerWidth) / 2), my = Math.max(0, (h - window.innerHeight) / 2);
    return { z, x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  };

  const insideArt = (x: number, y: number) => {
    // внутренний блок: у него и вписывание, и приближение
    const r = art.current?.firstElementChild?.getBoundingClientRect();
    return Boolean(r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    wasTouch.current = e.pointerType === "touch";
    if (e.pointerType !== "touch" || (e.target as HTMLElement).closest("button")) return;
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...touches.current.values()];
    if (pts.length === 1) {
      gesture.current = { x0: e.clientX, y0: e.clientY, t0: Date.now(), moved: false };
    } else if (pts.length === 2 && gesture.current) {
      const [a, b] = pts;
      gesture.current.moved = true;
      gesture.current.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: zoom.z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, px: zoom.x, py: zoom.y };
    }
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    const prev = touches.current.get(e.pointerId);
    const g = gesture.current;
    if (!prev || !g) return;
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...touches.current.values()];
    if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > 8) g.moved = true;
    if (pts.length >= 2 && g.pinch) {
      const [a, b] = pts;
      const p = g.pinch;
      const z = Math.max(1, Math.min(MAX_ZOOM, (p.z0 * Math.hypot(a.x - b.x, a.y - b.y)) / p.d0));
      // точка между пальцами остаётся под пальцами
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const k = z / p.z0;
      setZoom(clampPan(z, mx - cx - (p.mx - cx - p.px) * k, my - cy - (p.my - cy - p.py) * k));
    } else if (pts.length === 1 && zoom.z > 1) {
      setZoom((s) => clampPan(s.z, s.x + e.clientX - prev.x, s.y + e.clientY - prev.y));
    }
  };

  const onPointerUp = (e: ReactPointerEvent) => {
    if (!touches.current.has(e.pointerId)) return;
    touches.current.delete(e.pointerId);
    const g = gesture.current;
    if (touches.current.size) {
      // один палец остался после щипка — дальше он двигает
      if (g) g.pinch = undefined;
      return;
    }
    setDragging(false);
    gesture.current = null;
    if (!g) return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.moved && Date.now() - g.t0 < 300) {
      const tap = lastTap.current;
      const double = Date.now() - tap.t < 300 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 30;
      lastTap.current = { t: double ? 0 : Date.now(), x: e.clientX, y: e.clientY };
      if (double && insideArt(e.clientX, e.clientY)) {
        // двойной тап: приблизить в 2,5 раза к точке тапа или вернуть как было
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        setZoom(zoom.z > 1 ? { z: 1, x: 0, y: 0 } : clampPan(2.5, -(e.clientX - cx) * 1.5, -(e.clientY - cy) * 1.5));
      }
      return;
    }
    // свайп по неприближенному блоку — соседний слайд карусели
    if (zoom.z === 1 && !g.pinch && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  // на телефоне тап по самой картинке не закрывает — он может быть началом двойного тапа
  const onBackdrop = (e: ReactMouseEvent) => {
    if (wasTouch.current && insideArt(e.clientX, e.clientY)) return;
    close();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ position: "fixed", inset: 0, zIndex: 2147483647, display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none", touchAction: "none" }}
    >
      <div
        onClick={onBackdrop}
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
      {nav.prev && <NavArrow dir={-1} shown={shown && zoom.z === 1} narrow={narrow} onClick={() => go(-1)} />}
      {nav.next && <NavArrow dir={1} shown={shown && zoom.z === 1} narrow={narrow} onClick={() => go(1)} />}
      <div
        ref={art}
        style={{ position: "relative", flex: "none", pointerEvents: "none", transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.z})`, transition: dragging ? "none" : "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
      >
        <div
          className="figma-page"
          style={{ position: "relative", width: open.width, height: open.height, transform: `scale(${shown ? scale : scale * 0.6})`, opacity: shown && !fading ? 1 : 0, transition: "transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 200ms ease-out" }}
          dangerouslySetInnerHTML={{ __html: open.html }}
        />
      </div>
    </div>
  );
}
