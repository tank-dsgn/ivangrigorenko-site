"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

const GA_ID = "G-LDDGV5J7M3";
const METRIKA_ID = 113221499;

/** Считаем только на боевом домене — превью-деплои не должны попадать в статистику */
const PRODUCTION_HOST = "ivangrigorenko.com";

declare global {
  interface Window {
    dataLayer?: unknown[];
    ym?: (id: number, action: string, ...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Своё событие — для действий, которые счётчики сами не видят (прокрутка к контактам
 * по «Связаться»). В Метрике под него цель типа «Целевое событие» с тем же
 * идентификатором, в GA4 — событие с этим именем. Вне боевого домена счётчиков нет — ничего не уходит.
 */
export function reachGoal(name: string) {
  window.ym?.(METRIKA_ID, "reachGoal", name);
  window.gtag?.("event", name);
}

/**
 * Next.js переключает страницы без перезагрузки.
 *
 * GA4 ловит такие переходы сам (enhanced measurement по history-событиям),
 * а Метрика — нет, поэтому на каждый переход шлём хит вручную. Так же
 * сделано на оригинале сайта.
 */
function RouteHits() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previous = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const url = pathname + (query ? `?${query}` : "");

    // первый просмотр Метрика засчитывает сама при инициализации
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
 * Нажатие на почту (mailto:) GA4 сам не считает: «исходящие клики» — только ссылки на другие сайты.
 * Отправляем его как contact_click — то же ключевое событие, что Telegram и соцсети
 * (их contact_click собирает GA из click). Метрика почту видит сама — цель «Клик Gmail».
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

export default function Analytics() {
  return (
    <>
      {/*
        Оба счётчика подключаются из одного скрипта и только на боевом домене.
        Поэтому на превью-деплоях и локально не грузится даже gtag.js.
      */}
      <Script id="analytics" strategy="afterInteractive">
        {`(function () {
  if (location.hostname !== ${JSON.stringify(PRODUCTION_HOST)}) return;

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
    </>
  );
}
