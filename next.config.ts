import type { NextConfig } from "next";

/**
 * Короткие адреса для мест, где ссылка видна текстом (hh «О себе», описание Telegram,
 * сопроводительное письмо): ivangrigorenko.com/hh выглядит аккуратно, а метку UTM
 * Метрика и GA получают после перенаправления. Список всех ссылок — job-search/UTM_LINKS.md.
 * Перенаправление временное (307): поисковики не подменяют им адрес главной.
 */
const short: Record<string, string> = {
  "/hh": "/home-ru?utm_source=hh&utm_medium=profile",
  "/rabota": "/home-ru?utm_source=rabotaby&utm_medium=profile",
  "/getmatch": "/home-ru?utm_source=getmatch&utm_medium=profile",
  "/tg": "/home-ru?utm_source=telegram&utm_medium=profile",
  "/letter": "/home-ru?utm_source=cover&utm_medium=letter",
  "/letter-en": "/?utm_source=cover&utm_medium=letter",
  "/behance": "/?utm_source=behance&utm_medium=profile",
  "/dribbble": "/?utm_source=dribbble&utm_medium=profile",
  "/linkedin": "/?utm_source=linkedin&utm_medium=profile",
};

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return Object.entries(short).map(([source, destination]) => ({ source, destination, permanent: false }));
  },
};

export default nextConfig;
