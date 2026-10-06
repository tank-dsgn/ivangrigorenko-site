import type { Metadata } from "next";
import { DEPLOY_URL, SITE_URL, findPage } from "@/lib/pages";

/**
 * Описание и картинка для соцсетей — общие для всего сайта,
 * ровно как на оригинале: там они заданы один раз в настройках.
 */
export const SITE_NAME = "ivangrigorenko";
export const SITE_DESCRIPTION =
  "Ivan Grigorenko, UX/UI designer. I design web, desktop and mobile interfaces. Design systems, tokens, Design QA, clickable prototypes in code.";

/**
 * Метаданные страницы: канонический адрес и связка с версией на другом языке.
 * Заголовок — название проекта, остальное общее.
 */
/** Картинка превью ссылки — та же, что на оригинале: 1200×630 */
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
