export type Lang = "ru" | "en";

import assetMap from "@/lib/asset-map.json";

/**
 * Ассеты с оригинального сайта лежат в /public/a под своим хешем из Figma Sites.
 * Тяжёлые PNG переведены в WebP — подмену держит карта, поэтому в коде
 * везде остаётся исходное имя из выгрузки.
 */
export const asset = (hash: string) =>
  `/a/${(assetMap as Record<string, string>)[hash] ?? hash}`;

export const EMAIL = "Ivan.Grigorenko.dsgn@gmail.com";

export const mailtoHref = (lang: Lang) =>
  "mailto:ivan.grigorenko.dsgn@gmail.com" +
  "?subject=Let's%20Work%20Together" +
  "&body=Hi%20Ivan,%0A%0AI%20just%20checked%20your%20portfolio%20and%20really%20liked%20your%20work." +
  "%0AI'm%20interested%20in%20collaborating%20with%20you.%0A%0ARegards,%0A[Your%20Name]";

/**
 * Иконки блока контактов — в одном стиле: залитый круг 32px, знак вырезан.
 * В оригинале они были разными (надпись Behance, квадрат LinkedIn, контурный мяч
 * Dribbble); 2026-10-05 приведены к одному виду по просьбе Ивана. Знаки взяты из
 * исходных иконок, файлы — в public/icons.
 */
export const socials = [
  { name: "Behance", href: "https://www.behance.net/ivangrigorenko", icon: "/icons/behance.svg", w: 32, h: 32 },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/ivan-grigorenko-1382b0156/", icon: "/icons/linkedin.svg", w: 32, h: 32 },
  { name: "Dribbble", href: "https://dribbble.com/ivangrigorenko", icon: "/icons/dribbble.svg", w: 32, h: 32 },
  { name: "Telegram", href: "https://t.me/ivan_grigorenko", icon: "/icons/telegram.svg", w: 32, h: 32 },
];

/** Главная у русской версии — /home-ru, у английской — корень сайта */
export const homeHref = (lang: Lang) => (lang === "ru" ? "/home-ru" : "/");
export const aboutHref = (lang: Lang) => (lang === "ru" ? "/about-ru" : "/about-en");

export const t = {
  ru: {
    nav: { work: "Проекты", about: "Обо мне" },
    footer: {
      title: "Свяжитесь со мной",
      subtitle: "Открыт к новым проектам и сотрудничеству",
    },
    menuOpen: "Открыть меню",
    menuClose: "Закрыть меню",
    toHome: "На главную",
  },
  en: {
    nav: { work: "Work", about: "About" },
    footer: {
      title: "Let’s connect",
      subtitle: "Open to new projects and collaborations",
    },
    menuOpen: "Open menu",
    menuClose: "Close menu",
    toHome: "Go to homepage",
  },
} as const;
