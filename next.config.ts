import type { NextConfig } from "next";

/**
 * Short URLs for the places where a link is read as text — the hh "About" field,
 * a Telegram bio, a cover letter. ivangrigorenko.com/hh reads cleanly, and
 * Metrica and GA pick the UTM tag up after the redirect. The full list of links
 * is kept outside this repository.
 * The redirect is temporary (307), so search engines do not substitute it for
 * the home page.
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
