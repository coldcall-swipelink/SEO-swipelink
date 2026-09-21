"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ArticlePerf {
  slug: string;
  title: string;
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
}
interface QueryPerf {
  query: string;
  clicks: number;
  impressions: number;
  position: number;
}
interface PerfData {
  configured: boolean;
  error?: string;
  range?: { startDate: string; endDate: string; days: number };
  totals?: { clicks: number; impressions: number };
  articles?: ArticlePerf[];
  topQueries?: QueryPerf[];
}

const RANGES = [7, 28, 90];

export default function PerformancePage() {
  const [days, setDays] = useState(28);
  const [data, setData] = useState<PerfData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/performance?days=${days}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData({ configured: true, error: "Chargement impossible" }))
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            SwipeLink SEO
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Articles
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900">
              Voir le blog
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Performance SEO</h1>
            <p className="text-sm text-gray-500">
              Données Google Search Console (clics, impressions, position moyenne).
            </p>
          </div>
          <div className="flex gap-2">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setDays(r)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  days === r
                    ? "bg-brand text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {r} j
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-gray-500">Chargement…</p>}

        {!loading && data && !data.configured && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            <p className="font-semibold">Search Console pas encore connecté.</p>
            <p className="mt-2">
              Ajoutez les variables <code>GSC_CLIENT_EMAIL</code>,{" "}
              <code>GSC_PRIVATE_KEY</code> et <code>GSC_SITE_URL</code> dans Vercel,
              et autorisez le compte de service dans Search Console (droit Lecture).
              La marche à suivre complète est dans <code>.env.example</code>.
            </p>
          </div>
        )}

        {!loading && data?.configured && data.error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
            <p className="font-semibold">Erreur Search Console</p>
            <p className="mt-2">{data.error}</p>
          </div>
        )}

        {!loading && data?.configured && !data.error && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-sm text-gray-500">Clics</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {data.totals?.clicks.toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-sm text-gray-500">Impressions</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {data.totals?.impressions.toLocaleString("fr-FR")}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-sm text-gray-500">Période</p>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {data.range?.startDate} → {data.range?.endDate}
                </p>
              </div>
            </div>

            <h2 className="mb-3 text-lg font-semibold text-gray-900">Par article</h2>
            <div className="mb-8 overflow-x-auto rounded-xl border border-gray-100 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Article</th>
                    <th className="px-4 py-3 text-right font-medium">Clics</th>
                    <th className="px-4 py-3 text-right font-medium">Impressions</th>
                    <th className="px-4 py-3 text-right font-medium">CTR</th>
                    <th className="px-4 py-3 text-right font-medium">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.articles?.map((a) => (
                    <tr key={a.slug} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3">
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-gray-900 hover:text-brand"
                        >
                          {a.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{a.clicks}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{a.impressions}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {a.impressions ? `${(a.ctr * 100).toFixed(1)} %` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {a.position != null ? a.position.toFixed(1) : "—"}
                      </td>
                    </tr>
                  ))}
                  {!data.articles?.length && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                        Aucune donnée sur cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Requêtes principales
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 text-left text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Requête</th>
                    <th className="px-4 py-3 text-right font-medium">Clics</th>
                    <th className="px-4 py-3 text-right font-medium">Impressions</th>
                    <th className="px-4 py-3 text-right font-medium">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topQueries?.map((q) => (
                    <tr key={q.query} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-3 text-gray-900">{q.query}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{q.clicks}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{q.impressions}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {q.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                  {!data.topQueries?.length && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                        Aucune donnée sur cette période.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
