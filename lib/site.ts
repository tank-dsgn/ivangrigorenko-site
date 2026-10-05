export type Lang = "ru" | "en";

import assetMap from "@/lib/asset-map.json";

/**
 * Ассеты с оригинального сайта лежат в /public/a под своим хешем из Figma Sites.
 * Тяжёлые PNG переведены в WebP — подмену держит карта, поэтому в коде
 * везде остаётся исходное имя из выгрузки.
 */
export const asset = (hash: string) =>
  `/a/${(assetMap as Record<string, string>)[hash] ?? hash}`;

export const LOGO_WIDE = asset("a1576d14b0113138eb9b3cc4048c7c7909f4d72c.svg");
export const LOGO_SMALL = asset("848bd3970b66f72b3bd1f6a9616c471f5a5d254f.svg");

export const EMAIL = "Ivan.Grigorenko.dsgn@gmail.com";

export const mailtoHref = (lang: Lang) =>
  "mailto:ivan.grigorenko.dsgn@gmail.com" +
  "?subject=Let's%20Work%20Together" +
  "&body=Hi%20Ivan,%0A%0AI%20just%20checked%20your%20portfolio%20and%20really%20liked%20your%20work." +
  "%0AI'm%20interested%20in%20collaborating%20with%20you.%0A%0ARegards,%0A[Your%20Name]";

/**
 * Иконки соцсетей рисуются в своих пропорциях и центрируются в квадрате 32×32:
 * у Behance знак шире и ниже остальных (32×20), квадратом его тянуть нельзя.
 */
export const socials = [
  { name: "Behance", href: "https://www.behance.net/ivangrigorenko", icon: asset("d218d31b95457388456f4f51da47d5014d56e74c.svg"), w: 32, h: 20 },
  { name: "LinkedIn", href: "https://www.linkedin.com/in/ivan-grigorenko-1382b0156/", icon: asset("d788591286bc66c6bc1cf78678eb2ca467468a9d.svg"), w: 32, h: 32 },
  { name: "Dribbble", href: "https://dribbble.com/ivangrigorenko", icon: asset("e02e8e9375f55e998afbec75fa12d3a26769b60d.svg"), w: 32, h: 32 },
  // в оригинале Telegram нет; знак нарисован в том же цвете и размере, что остальные
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
