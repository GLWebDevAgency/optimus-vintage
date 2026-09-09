import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${APP_URL}/tarifs`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    {
      url: `${APP_URL}/legal/mentions-legales`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    { url: `${APP_URL}/legal/cgu`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    {
      url: `${APP_URL}/legal/confidentialite`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
