import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/pages";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // the menu pages repeat the navigation and do not belong in search
      disallow: ["/home-menu-ru", "/home-menu-en"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
