import type { MetadataRoute } from "next";
import { GAMES } from "@/lib/games";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://play67.co.uk";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const gameEntries = GAMES.filter((g) => g.available).map((g) => ({
    url: `${SITE_URL}/play/${g.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: g.slug === "rizz" ? 0.95 : 0.85,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/all`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...gameEntries,
  ];
}
