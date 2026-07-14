import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface SerpResult {
  position: number;
  title: string;
  link: string;
  displayLink: string;
  snippet: string;
}

// Petit cache en mémoire (par instance) pour économiser le quota d'API.
const CACHE = new Map<string, { at: number; results: SerpResult[] }>();
const TTL_MS = 60 * 60 * 1000; // 1h

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ configured: true, results: [], query: q });
  }

  const key = process.env.SERPAPI_KEY;
  if (!key) {
    return NextResponse.json({ configured: false, results: [], query: q });
  }

  const cached = CACHE.get(q.toLowerCase());
  if (cached && Date.now() - cached.at < TTL_MS) {
    return NextResponse.json({ configured: true, results: cached.results, query: q, cached: true });
  }

  const base = process.env.SERP_API_BASE || "https://serpapi.com";
  const url =
    `${base}/search.json?engine=google&num=10&hl=fr&gl=fr` +
    `&q=${encodeURIComponent(q)}&api_key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { configured: true, error: `Erreur API (${res.status})`, results: [], query: q },
        { status: 502 }
      );
    }
    const data = await res.json();
    // organic_results exclut les annonces (ads) : uniquement les résultats naturels.
    const organic = Array.isArray(data.organic_results) ? data.organic_results : [];
    const results: SerpResult[] = organic.slice(0, 3).map(
      (r: Record<string, unknown>, i: number) => ({
        position: typeof r.position === "number" ? (r.position as number) : i + 1,
        title: String(r.title ?? ""),
        link: String(r.link ?? ""),
        displayLink: String(r.displayed_link ?? hostname(String(r.link ?? ""))),
        snippet: String(r.snippet ?? ""),
      })
    );

    CACHE.set(q.toLowerCase(), { at: Date.now(), results });
    return NextResponse.json({ configured: true, results, query: q });
  } catch {
    return NextResponse.json(
      { configured: true, error: "Recherche indisponible.", results: [], query: q },
      { status: 502 }
    );
  }
}

function hostname(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}
