"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const GA_ID = "G-LDDGV5J7M3";
const METRIKA_ID = 113221499;

/** Count on the production domain only: preview deploys must not reach the stats */
const PRODUCTION_HOST = "ivangrigorenko.com";

/** A localStorage flag: on the owner's devices the counters are not loaded; set it with ?notrack=1 */
const NOTRACK_KEY = "ig:notrack";

declare global {
  interface Window {
    dataLayer?: unknown[];
    ym?: (id: number, action: string, ...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * A custom event, for the actions the counters cannot see by themselves, such
 * as scrolling to the contacts from the contact button. In Metrica it is backed
 * by a target event with the same identifier, in GA4 by an event with this
 * name. Off the production domain there are no counters, so nothing is sent.
 */
export function reachGoal(name: string) {
  window.ym?.(METRIKA_ID, "reachGoal", name);
  window.gtag?.("event", name);
}

/**
 * Next.js moves between pages without a reload.
 *
 * GA4 catches those itself, through enhanced measurement on history events;
 * Metrica does not, so every move sends a hit by hand. The original site does
 * the same.
 */
function RouteHits() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const url = pathname + (query ? `?${query}` : "");

    // Metrica counts the first view itself, at initialisation
    if (previous.current === null) {
      previous.current = url;
      return;
    }
    if (previous.current === url) return;

    window.ym?.(METRIKA_ID, "hit", url, { referer: previous.current });
    previous.current = url;
  }, [pathname, searchParams]);

  return null;
}

/**
 * GA4 does not count a mailto: click by itself — outbound clicks cover links to
 * other sites only. It is sent as contact_click, the same key event as Telegram
 * and the social links, whose contact_click GA builds from click. Metrica sees
 * the email on its own, through the Gmail click goal.
 */
function MailClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="mailto:"]');
      if (a) window.gtag?.("event", "contact_click", { link_url: a.href.split("?")[0] });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

/**
 * GA4 builds the prototype_open key event from clicks whose link_url contains
 * prototype.vercel.app. The VV Foundations showcase lives at
 * vv-foundations.vercel.app and falls outside that rule, so the site sends that
 * click itself.
 */
function PrototypeClicks() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href*="vv-foundations.vercel.app"]');
      if (a) window.gtag?.("event", "prototype_open", { link_url: a.href });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}

export default function Analytics() {
  return (
    <>
      {/*
        Both counters load from one script and only on the production domain,
        which is why preview deploys and local runs do not even fetch
        gtag.js.
      */}
      <Script id="analytics" strategy="afterInteractive">
        {`(function () {
  if (location.hostname !== ${JSON.stringify(PRODUCTION_HOST)}) return;

  // Own devices: ?notrack=1 turns both counters off in this browser, ?notrack=0 turns them back on
  var flag = new URLSearchParams(location.search).get('notrack');
  var off = false;
  try {
    if (flag === '1') localStorage.setItem('${NOTRACK_KEY}', '1');
    if (flag === '0') localStorage.removeItem('${NOTRACK_KEY}');
    off = localStorage.getItem('${NOTRACK_KEY}') === '1';
  } catch (e) {}
  if (flag === '1' || flag === '0') {
    var ru = /-ru$/.test(location.pathname);
    var note = document.createElement('div');
    note.textContent = off
      ? (ru ? 'Статистика на этом устройстве выключена' : 'Analytics is off on this device')
      : (ru ? 'Статистика на этом устройстве снова включена' : 'Analytics is on again on this device');
    note.setAttribute('role', 'status');
    note.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483647;width:max-content;max-width:calc(100% - 32px);padding:12px 16px;border-radius:12px;background:#1c1917;color:#fff;font:15px/20px system-ui,-apple-system,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.2)';
    document.body.appendChild(note);
    setTimeout(function () { note.remove(); }, 4000);
  }
  if (off) return;

  var s = document.createElement('script');
  s.async = 1;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=${GA_ID}';
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', '${GA_ID}');

  (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for (var j = 0; j < document.scripts.length; j++) { if (document.scripts[j].src === r) return; }
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
  (window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}', 'ym');

  ym(${METRIKA_ID}, 'init', { ssr: true, webvisor: true, clickmap: true, trackLinks: true, accurateTrackBounce: true });
})();`}
      </Script>

      <Suspense fallback={null}>
        <RouteHits />
      </Suspense>
      <MailClicks />
      <PrototypeClicks />
    </>
  );
}
