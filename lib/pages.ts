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
  ...pair("/eazychange-ru", "/eazychange-en", 0.9),
  ...pair("/autotor-ru", "/autotor-en", 0.9),
  ...pair("/pot-ru", "/pot-en", 0.9),
  ...pair("/ostral-ru", "/ostral-en", 0.9),
  ...pair("/vv-ru", "/vv-en", 0.9),
  ...pair("/mikulich-ru", "/mikulich-en", 0.9),
  ...pair("/home-menu-ru", "/home-menu-en", 0.1, false),
];

export const findPage = (path: string) => sitePages.find((p) => p.path === path);

export const SITE_URL = "https://ivangrigorenko.com";
