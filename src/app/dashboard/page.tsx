"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Article, Category } from "@/lib/types";
import { analyzeSeo } from "@/lib/seo";

type CategoryWithTemplate = Category & { hasTemplate: boolean };

export default function DashboardPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [categories, setCategories] = useState<CategoryWithTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);

  async function load() {
    const [aRes, cRes] = await Promise.all([
      fetch("/api/articles"),
      fetch("/api/categories"),
    ]);
    setArticles(await aRes.json());
    setCategories(await cRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function createArticle(categoryId: string | null, useTemplate: boolean) {
    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, useTemplate }),
    });
    const article = (await res.json()) as Article;
    router.push(`/editor/${article.id}`);
  }

  async function remove(id: string) {
    if (!confirm("Supprimer définitivement cet article ?")) return;
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    load();
  }

  const categoryName = (id?: string | null) =>
    categories.find((c) => c.id === id)?.name ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            SwipeLink SEO
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/categories" className="text-gray-600 hover:text-gray-900">
              Catégories
            </Link>
            <Link href="/blog" className="text-gray-600 hover:text-gray-900">
              Voir le blog
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark"
            >
              + Nouvel article
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
              onClick={() => setShowModal(true)}
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
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/editor/${a.id}`}
                            className="font-semibold text-gray-900 hover:text-brand"
                          >
                            {a.title || "(Sans titre)"}
                          </Link>
                          {categoryName(a.categoryId) && (
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-brand">
                              {categoryName(a.categoryId)}
                            </span>
                          )}
                        </div>
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

      {showModal && (
        <NewArticleModal
          categories={categories}
          onClose={() => setShowModal(false)}
          onCreate={createArticle}
        />
      )}
    </div>
  );
}

function NewArticleModal({
  categories,
  onClose,
  onCreate,
}: {
  categories: CategoryWithTemplate[];
  onClose: () => void;
  onCreate: (categoryId: string | null, useTemplate: boolean) => void;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [useTemplate, setUseTemplate] = useState(true);
  const [creating, setCreating] = useState(false);
  const selected = categories.find((c) => c.id === categoryId);
  const canTemplate = !!selected?.hasTemplate;

  function submit() {
    setCreating(true);
    onCreate(categoryId || null, canTemplate && useTemplate);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900">Nouvel article</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choisissez une catégorie et un point de départ.
        </p>

        <label className="mt-5 block text-sm font-semibold text-gray-800">
          Catégorie
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-brand"
        >
          <option value="">Aucune catégorie</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.hasTemplate ? " (template dispo.)" : ""}
            </option>
          ))}
        </select>
        {categories.length === 0 && (
          <p className="mt-2 text-xs text-gray-400">
            Aucune catégorie.{" "}
            <Link href="/categories" className="font-semibold text-brand">
              En créer une
            </Link>
            .
          </p>
        )}

        {/* Point de départ */}
        <div className="mt-5 space-y-2">
          <span className="block text-sm font-semibold text-gray-800">
            Point de départ
          </span>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              useTemplate && canTemplate
                ? "border-brand bg-indigo-50"
                : "border-gray-200"
            } ${!canTemplate ? "opacity-50" : ""}`}
          >
            <input
              type="radio"
              name="start"
              className="mt-1"
              disabled={!canTemplate}
              checked={useTemplate && canTemplate}
              onChange={() => setUseTemplate(true)}
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Utiliser le template de la catégorie
              </span>
              <span className="block text-xs text-gray-500">
                {canTemplate
                  ? "Pré-remplit l'article avec le contenu du template."
                  : "Aucun template pour cette catégorie."}
              </span>
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              !useTemplate || !canTemplate
                ? "border-brand bg-indigo-50"
                : "border-gray-200"
            }`}
          >
            <input
              type="radio"
              name="start"
              className="mt-1"
              checked={!useTemplate || !canTemplate}
              onChange={() => setUseTemplate(false)}
            />
            <span>
              <span className="block text-sm font-medium text-gray-900">
                Partir de zéro
              </span>
              <span className="block text-xs text-gray-500">
                Démarre avec un article vide.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={creating}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {creating ? "Création…" : "Créer l'article"}
          </button>
        </div>
      </div>
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
