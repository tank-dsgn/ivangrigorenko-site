import type { Lang } from "@/lib/site";

/**
 * Реестр страниц сайта.
 *
 * Отсюда строятся sitemap, канонические адреса и связки hreflang между
 * русской и английской версиями — чтобы не держать три одинаковых списка.
 */
export type SitePage = {
  /** путь на сайте */
  path: string;
  lang: Lang;
  /** та же страница на другом языке */
  counterpart: string;
  /** страницы меню нужны только узким экранам и в поиске не нужны */
  indexable: boolean;
  /** приоритет для sitemap */
  priority: number;
};

const pair = (ru: string, en: string, priority: number, indexable = true): SitePage[] => [
  { path: ru, lang: "ru", counterpart: en, indexable, priority },
  { path: en, lang: "en", counterpart: ru, indexable, priority },
];

export const sitePages: SitePage[] = [
  ...pair("/home-ru", "/", 1),
  ...pair("/about-ru", "/about-en", 0.8),
  ...pair("/contacts-ru", "/contacts-en", 0.7),
  ...pair("/eazychange-ru", "/eazychange-en", 0.9),
  ...pair("/autotor-ru", "/autotor-en", 0.9),
  ...pair("/pot-ru", "/pot-en", 0.9),
  ...pair("/ostral-ru", "/ostral-en", 0.9),
  ...pair("/vv-ru", "/vv-en", 0.9),
  ...pair("/mikulich-ru", "/mikulich-en", 0.9),
];

// экраны меню: в поиске не нужны, но маршруты существуют
sitePages.push(
  ...[
    ["home"], ["about"], ["contacts"], ["eazychange"], ["autotor"],
    ["pot"], ["ostral"], ["vv"], ["mikulich"],
  ].flatMap(([slug]) =>
    pair(`/${slug}-menu-ru`, `/${slug}-menu-en`, 0.1, false)
  )
);

export const findPage = (path: string) => sitePages.find((p) => p.path === path);

/**
 * Разделы сайта и их экраны меню.
 *
 * В оригинале у каждого раздела своё меню: `/<раздел>-menu-<язык>`.
 * Отсюда строятся и маршруты меню, и ссылка в бургере.
 */
export const sections = [
  { slug: "home", ru: "/home-ru", en: "/", active: "work" as const },
  { slug: "about", ru: "/about-ru", en: "/about-en", active: "about" as const },
  { slug: "contacts", ru: "/contacts-ru", en: "/contacts-en", active: "contacts" as const },
  { slug: "eazychange", ru: "/eazychange-ru", en: "/eazychange-en" },
  { slug: "autotor", ru: "/autotor-ru", en: "/autotor-en" },
  { slug: "pot", ru: "/pot-ru", en: "/pot-en" },
  { slug: "ostral", ru: "/ostral-ru", en: "/ostral-en" },
  { slug: "vv", ru: "/vv-ru", en: "/vv-en" },
  { slug: "mikulich", ru: "/mikulich-ru", en: "/mikulich-en" },
];

/** Адрес меню для страницы: /eazychange-ru → /eazychange-menu-ru */
export function menuHref(path: string) {
  const s = sections.find((x) => x.ru === path || x.en === path);
  if (!s) return null;
  return s.ru === path ? `/${s.slug}-menu-ru` : `/${s.slug}-menu-en`;
}

export const SITE_URL = "https://ivangrigorenko.com";
