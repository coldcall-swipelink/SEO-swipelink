import { NextRequest, NextResponse } from "next/server";
import { gscConfigured, querySearchAnalytics, GscRow } from "@/lib/gsc";
import { listPublicViews } from "@/lib/articles";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Renvoie les performances Search Console des articles publiés (clics,
// impressions, position moyenne) sur une fenêtre de jours, plus les
// requêtes principales du site. Protégé par le middleware (back-office).

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function normalize(url: string): string {
  return url.replace(/\/$/, "").toLowerCase();
}

export async function GET(req: NextRequest) {
  if (!gscConfigured()) {
    return NextResponse.json({ configured: false });
  }

  const days = Math.min(
    Math.max(parseInt(req.nextUrl.searchParams.get("days") || "28", 10) || 28, 1),
    365
  );
  const end = new Date();
  end.setDate(end.getDate() - 2); // Search Console a ~2 jours de latence
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  const startDate = ymd(start);
  const endDate = ymd(end);

  try {
    const [pages, queries, articles] = await Promise.all([
      querySearchAnalytics({ startDate, endDate, dimensions: ["page"], rowLimit: 1000 }),
      querySearchAnalytics({ startDate, endDate, dimensions: ["query"], rowLimit: 25 }),
      listPublicViews(),
    ]);

    // Index des lignes GSC par URL de page normalisée.
    const byPage = new Map<string, GscRow>();
    for (const r of pages) byPage.set(normalize(r.keys[0] || ""), r);

    // Associe chaque article publié à sa ligne de perf (via son URL publique).
    const perArticle = articles.map((a) => {
      const slug = a.published?.slug ?? a.slug;
      const url = `${SITE.url.replace(/\/$/, "")}/blog/${slug}`;
      const row = byPage.get(normalize(url));
      return {
        slug,
        title: a.published?.title ?? a.title,
        url,
        clicks: row?.clicks ?? 0,
        impressions: row?.impressions ?? 0,
        ctr: row?.ctr ?? 0,
        position: row?.position ?? null,
      };
    });
    perArticle.sort((x, y) => y.clicks - x.clicks || y.impressions - x.impressions);

    const totals = perArticle.reduce(
      (acc, a) => {
        acc.clicks += a.clicks;
        acc.impressions += a.impressions;
        return acc;
      },
      { clicks: 0, impressions: 0 }
    );

    const topQueries = queries.map((r) => ({
      query: r.keys[0] || "",
      clicks: r.clicks,
      impressions: r.impressions,
      position: r.position,
    }));

    return NextResponse.json({
      configured: true,
      range: { startDate, endDate, days },
      totals,
      articles: perArticle,
      topQueries,
    });
  } catch (e) {
    return NextResponse.json(
      { configured: true, error: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
