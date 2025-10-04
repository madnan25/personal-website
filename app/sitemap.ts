import { blogPosts } from "@/lib/blog";
import type { MetadataRoute } from "next";

const BASE_URL = "https://dayemadnan.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
  ];

  for (const p of blogPosts) {
    entries.push({
      url: `${BASE_URL}/blog/${p.id}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}


