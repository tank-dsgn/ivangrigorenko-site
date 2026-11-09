"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";

/**
 * Click to enlarge a diagram or a screen, as on the original site.
 *
 * A block carrying `data-lightbox` opens over the page: a dark backdrop and a
 * copy of the block in the middle, fitted into 94% of the window (the original
 * used 80%; raised at Ivan's request on 2026-10-06). It closes on a click on
 * the backdrop, on the close mark, or on Esc.
 *
 * If the block is a carousel slide (inside `data-state`), arrows sit on either
 * side, with ← and → on the keyboard. They page the carousel on the page as
 * well, by pressing its own arrow, so the carousel is left on the same slide
 * once the lightbox closes.
 *
 * Phone and tablet (2026-10-22). The design file defines the zoom on desktop
 * only; for narrow widths the matching blocks are found by their images
 * (`mirrorZoom`). On a phone the block already fills almost the full width, so
 * the enlarged view takes gestures instead: two fingers or a double tap to zoom
 * in, one finger to pan a zoomed block, a swipe for the neighbouring slide. On
 * a narrow screen the arrows sit at the bottom so they do not eat the image's
 * width.
 */
/** How much of the window the enlarged block takes along whichever side it meets first */
const FILL = 0.94;

type Shot = { html: string; width: number; height: number };

/** The copy that gets shown: no page position, and none of the layers hidden in the current state */
const capture = (opener: HTMLElement): Shot => {
  // the caption above the image is not wanted in the enlarged view, only the image itself
  const kids = [...opener.children].filter((c) => getComputedStyle(c).display !== "none");
  const art = kids.filter((c) => c.tagName !== "P");
  const el = kids.length > 1 && art.length === 1 ? (art[0] as HTMLElement) : opener;
  const copy = el.cloneNode(true) as HTMLElement;
  // layers belonging to other carousel states are hidden by rules shaped like
  // `.sg-N[data-state] .sn-N-k`, and the copy lives outside the carousel, so
  // whatever is not visible right now is dropped here
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
 * Zoom on narrow widths: the blocks holding the same images as the desktop
 * block that zooms. The outermost such block wins. The set may also be a subset
 * of the desktop one, down to two images: a desktop carousel slide carries the
 * images of every state, while a phone slide carries only its own.
 */
const mirrorZoom = () => {
  const desk = [...document.querySelectorAll<HTMLElement>(".figma-page.xl\\:block")];
  const narrow = [...document.querySelectorAll<HTMLElement>(".figma-page:not(.xl\\:block)")];
  const memo = new Map<Element, string>();
  const sig = (el: Element) => {
    let v = memo.get(el);
    if (v == null) {
      // images, video and background images from the design file
      const srcs = [...el.querySelectorAll("img, video")].map((m) => m.getAttribute("src") || m.getAttribute("poster") || "");
      for (const b of [el, ...el.querySelectorAll<HTMLElement>("[style*='url(']")]) {
        for (const m of (b as HTMLElement).style.backgroundImage.matchAll(/url\(["']?([^"')]+)/g)) srcs.push(m[1]);
      }
      v = [...new Set(srcs)].filter(Boolean).sort().join("|");
      memo.set(el, v);
    }
    return v;
  };
  // for each desktop block: its images and how many paragraphs it holds
  const wanted = desk
    .flatMap((d) => [...d.querySelectorAll("[data-lightbox]")])
    .map((el) => ({ media: new Set(sig(el).split("|").filter(Boolean)), texts: el.querySelectorAll("p").length }))
    .filter((w) => w.media.size);
  if (!wanted.length) return;
  // no more text than the desktop block plus one caption above it; beyond that it is a section with a heading, not a block
  const fits = (el: Element) => {
    const items = sig(el).split("|").filter(Boolean);
    if (!items.length) return false;
    const texts = el.querySelectorAll("p").length;
    return wanted.some((w) => items.every((i) => w.media.has(i)) && (items.length === w.media.size || items.length >= 2) && texts <= w.texts + 1);
  };
  for (const page of narrow) {
    for (const media of page.querySelectorAll("img, video, [style*='url(']")) {
      // walk up from the image to the outermost block carrying the right set
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

/** Narrow screen: paging arrows at the bottom rather than at the sides */
const isNarrow = () => window.innerWidth < 768;

/** The furthest a gesture can zoom in */
const MAX_ZOOM = 4;

/** The zoomable slides of the same carousel, in order */
const slidesOf = (el: HTMLElement) => {
  const root = el.closest<HTMLElement>("[data-state]");
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>("[data-lightbox]")].filter((n) => getComputedStyle(n).display !== "none");
};

/** The carousel arrow that currently pages the wanted way: −1 back, 1 forward */
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

/** The back/forward arrow in the enlarged view, drawn like the close mark */
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
  // neighbouring carousel slides: is there anywhere to page to
  const [nav, setNav] = useState({ prev: false, next: false });
  const [fading, setFading] = useState(false);
  const [shown, setShown] = useState(false);
  const [scale, setScale] = useState(1);
  const [narrow, setNarrow] = useState(false);
  // gesture zoom on top of the fitted size, and the pan of a zoomed block
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
    // page the carousel on the page: the state changes at once and the layers follow it
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
      // room for the paging arrows so they do not sit on the image: at the sides, or below on a narrow screen
      const arrow = Math.min(Math.max(window.innerWidth, window.innerHeight) * 0.1, 56) + 2 * Math.min(window.innerWidth * 0.02, 16);
      const room = window.innerWidth - (arrows && !thin ? 2 * arrow : 0);
      const tall = window.innerHeight - (arrows && thin ? 2 * 72 : 0);
      setNarrow(thin);
      // almost the whole screen: 3% margin on each side (the original used 80% of the window)
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

  /** Pan of a zoomed block, never past its own edges */
  const clampPan = (z: number, x: number, y: number) => {
    if (!open) return { z, x, y };
    const w = open.width * scale * z, h = open.height * scale * z;
    const mx = Math.max(0, (w - window.innerWidth) / 2), my = Math.max(0, (h - window.innerHeight) / 2);
    return { z, x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  };

  const insideArt = (x: number, y: number) => {
    // the inner block: it carries both the fit and the zoom
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
      // the point between the fingers stays under the fingers
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
      // one finger left after a pinch: from here it pans
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
        // double tap: zoom 2.5× towards the tapped point, or go back
        const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
        setZoom(zoom.z > 1 ? { z: 1, x: 0, y: 0 } : clampPan(2.5, -(e.clientX - cx) * 1.5, -(e.clientY - cy) * 1.5));
      }
      return;
    }
    // a swipe on an unzoomed block moves to the neighbouring slide
    if (zoom.z === 1 && !g.pinch && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  // on a phone a tap on the image itself does not close: it may be the start of a double tap
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
          className="lightbox-close"
          style={{ position: "relative", display: "block", width: "100%", aspectRatio: "1 / 1", borderRadius: "9999px", cursor: "pointer" }}
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
