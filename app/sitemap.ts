import type { MetadataRoute } from "next";
import { SITE_URL, sitePages } from "@/lib/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitePages
    .filter((p) => p.indexable)
    .map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: p.priority,
      alternates: {
        languages: {
          ru: `${SITE_URL}${p.lang === "ru" ? p.path : p.counterpart}`,
          en: `${SITE_URL}${p.lang === "en" ? p.path : p.counterpart}`,
        },
      },
    }));
}
