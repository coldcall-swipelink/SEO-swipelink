import type { MetadataRoute } from "next";
import { listPublicViews } from "@/lib/articles";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await listPublicViews();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE.url}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles
    .filter((a) => !a.seo.noindex)
    .map((a) => ({
      url: `${SITE.url}/blog/${a.slug}`,
      lastModified: new Date(a.updatedAt),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  return [...staticRoutes, ...articleRoutes];
}
