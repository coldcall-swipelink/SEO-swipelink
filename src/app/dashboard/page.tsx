"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article } from "@/lib/types";
import { analyzeSeo } from "@/lib/seo";

export default function DashboardPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch("/api/articles");
    setArticles(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function createArticle() {
    setCreating(true);
    const res = await fetch("/api/articles", { method: "POST" });
    const article = (await res.json()) as Article;
    router.push(`/editor/${article.id}`);
  }

  async function remove(id: string) {
    if (!confirm("Supprimer définitivement cet article ?")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            SwipeLink SEO
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/blog" className="text-gray-600 hover:text-gray-900">
              Voir le blog
            </Link>
            <button
              onClick={createArticle}
              disabled={creating}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {creating ? "Création…" : "+ Nouvel article"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900">Mes articles</h1>
        <p className="mt-1 text-gray-500">
          Gérez vos brouillons et vos publications.
        </p>

        {articles === null ? (
          <p className="mt-10 text-gray-400">Chargement…</p>
        ) : articles.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-500">Aucun article pour le moment.</p>
            <button
              onClick={createArticle}
              className="mt-4 rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark"
            >
              Créer mon premier article
            </button>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50 text-sm text-gray-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Titre</th>
                  <th className="px-6 py-3 font-medium">Statut</th>
                  <th className="px-6 py-3 font-medium">Score SEO</th>
                  <th className="px-6 py-3 font-medium">Modifié</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {articles.map((a) => {
                  const report = analyzeSeo(a);
                  return (
                    <tr key={a.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/editor/${a.id}`}
                          className="font-semibold text-gray-900 hover:text-brand"
                        >
                          {a.title || "(Sans titre)"}
                        </Link>
                        <div className="text-sm text-gray-400">/{a.slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-6 py-4">
                        <ScorePill score={report.score} grade={report.grade} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(a.updatedAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 text-sm">
                          {a.status === "published" && (
                            <Link
                              href={`/blog/${a.published?.slug ?? a.slug}`}
                              className="text-gray-500 hover:text-gray-900"
                            >
                              Voir
                            </Link>
                          )}
                          <button
                            onClick={() => remove(a.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: Article["status"] }) {
  const published = status === "published";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        published
          ? "bg-green-50 text-green-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          published ? "bg-green-500" : "bg-amber-500"
        }`}
      />
      {published ? "Publié" : "Brouillon"}
    </span>
  );
}

function ScorePill({ score, grade }: { score: number; grade: string }) {
  const color =
    score >= 85
      ? "bg-green-50 text-green-700"
      : score >= 70
      ? "bg-lime-50 text-lime-700"
      : score >= 50
      ? "bg-amber-50 text-amber-700"
      : "bg-red-50 text-red-700";
  return (
    <span className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${color}`}>
      {score}/100 · {grade}
    </span>
  );
}
