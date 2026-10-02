import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/pages";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // страницы меню дублируют навигацию и в поиске не нужны
      disallow: ["/home-menu-ru", "/home-menu-en"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
