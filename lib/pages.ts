import type { Lang } from "@/lib/site";

/**
 * The site's page registry.
 *
 * The sitemap, the canonical URLs and the hreflang pairs between the Russian
 * and English versions are all built from here, so there are not three copies
 * of the same list.
 */
export type SitePage = {
  /** path on the site */
  path: string;
  lang: Lang;
  /** the same page in the other language */
  counterpart: string;
  /** menu pages serve narrow screens only and do not belong in search */
  indexable: boolean;
  /** sitemap priority */
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
];

// menu screens: no place in search, but the routes exist
sitePages.push(
  ...[
    ["home"], ["about"], ["eazychange"], ["autotor"],
    ["pot"], ["ostral"], ["vv"], ["mikulich"],
  ].flatMap(([slug]) =>
    pair(`/${slug}-menu-ru`, `/${slug}-menu-en`, 0.1, false)
  )
);

export const findPage = (path: string) => sitePages.find((p) => p.path === path);

/**
 * The sections of the site and their menu screens.
 *
 * In the original every section has its own menu: `/<section>-menu-<language>`.
 * Both the menu routes and the link behind the burger are built from here.
 */
export const sections = [
  { slug: "home", ru: "/home-ru", en: "/", active: "work" as const },
  { slug: "about", ru: "/about-ru", en: "/about-en", active: "about" as const },
  { slug: "eazychange", ru: "/eazychange-ru", en: "/eazychange-en" },
  { slug: "autotor", ru: "/autotor-ru", en: "/autotor-en" },
  { slug: "pot", ru: "/pot-ru", en: "/pot-en" },
  { slug: "ostral", ru: "/ostral-ru", en: "/ostral-en" },
  { slug: "vv", ru: "/vv-ru", en: "/vv-en" },
  { slug: "mikulich", ru: "/mikulich-ru", en: "/mikulich-en" },
];

/** The menu URL for a page: /eazychange-ru → /eazychange-menu-ru */
export function menuHref(path: string) {
  const s = sections.find((x) => x.ru === path || x.en === path);
  if (!s) return null;
  return s.ru === path ? `/${s.slug}-menu-ru` : `/${s.slug}-menu-en`;
}

export const SITE_URL = "https://ivangrigorenko.com";

/**
 * Where the site is actually served from. Until the domain is switched this is
 * the Vercel address: a messenger fetches the link-preview image from here, and
 * ivangrigorenko.com does not have it yet — that is still the Figma Sites
 * version. Vercel fills in its own domain as soon as it becomes the primary
 * one.
 */
export const DEPLOY_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : SITE_URL;
