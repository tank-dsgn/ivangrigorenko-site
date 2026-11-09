import type { Metadata } from "next";
import { DEPLOY_URL, SITE_URL, findPage } from "@/lib/pages";

/**
 * The description and the social image are shared across the site, exactly as
 * in the original, where they are set once in the settings.
 */
export const SITE_NAME = "IvanGrigorenko";
export const SITE_DESCRIPTION =
  "Ivan Grigorenko, UX/UI designer. I design web, desktop and mobile interfaces. Design systems, tokens, Design QA, clickable prototypes in code.";

/**
 * Page metadata: the canonical URL and the link to the other language.
 * The title is the project name; everything else is shared.
 */
/** Link-preview image, the same as the original: 1200×630 */
const OG_IMAGE = { url: `${DEPLOY_URL}/og.png`, width: 1200, height: 630, alt: SITE_NAME };

export function pageMetadata({ path, title }: { path: string; title?: string }): Metadata {
  const page = findPage(path);
  const url = `${SITE_URL}${path}`;
  const fullTitle = title ? `${SITE_NAME} — ${title}` : SITE_NAME;

  const languages = page
    ? {
        ru: `${SITE_URL}${page.lang === "ru" ? page.path : page.counterpart}`,
        en: `${SITE_URL}${page.lang === "en" ? page.path : page.counterpart}`,
      }
    : undefined;

  return {
    title: fullTitle,
    description: SITE_DESCRIPTION,
    alternates: { canonical: url, languages },
    robots: page?.indexable === false ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: SITE_DESCRIPTION,
      url,
      siteName: SITE_NAME,
      images: [OG_IMAGE],
      type: "website",
      locale: page?.lang === "en" ? "en_US" : "ru_RU",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: SITE_DESCRIPTION,
      images: [OG_IMAGE],
    },
  };
}
