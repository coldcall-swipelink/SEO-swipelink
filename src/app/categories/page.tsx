"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Category } from "@/lib/types";

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    if (!name.trim() || busy) return;
    setBusy(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    setBusy(false);
    load();
  }

  async function rename(cat: Category) {
    const next = prompt("Nouveau nom de la catégorie :", cat.name);
    if (!next || !next.trim() || next.trim() === cat.name) return;
    await fetch(`/api/categories/${cat.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: next.trim() }),
    });
    load();
  }

  async function remove(cat: Category) {
    if (
      !confirm(
        `Supprimer la catégorie « ${cat.name} » et son template ? Les articles existants ne seront pas supprimés.`
      )
    )
      return;
    await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
    load();
  }

  async function editTemplate(cat: Category) {
    const res = await fetch(`/api/categories/${cat.id}/template`);
    const template = await res.json();
    router.push(`/editor/${template.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">
            ← Tableau de bord
          </Link>
          <span className="text-lg font-bold text-gray-900">Catégories</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-extrabold text-gray-900">
          Catégories & templates
        </h1>
        <p className="mt-1 text-gray-500">
          Créez des catégories et associez à chacune un template d'article
          réutilisable.
        </p>

        {/* Ajout */}
        <div className="mt-6 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Nom de la nouvelle catégorie"
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 outline-none focus:border-brand"
          />
          <button
            onClick={add}
            disabled={busy || !name.trim()}
            className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>

        {/* Liste */}
        <div className="mt-8">
          {categories === null ? (
            <p className="text-gray-400">Chargement…</p>
          ) : categories.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-gray-500">
              Aucune catégorie pour le moment.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <ul className="divide-y divide-gray-50">
                {categories.map((cat) => (
                  <li
                    key={cat.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <span className="font-semibold text-gray-900">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-4 text-sm">
                      <button
                        onClick={() => editTemplate(cat)}
                        className="font-semibold text-brand hover:text-brand-dark"
                      >
                        🧩 Modifier le template
                      </button>
                      <button
                        onClick={() => rename(cat)}
                        className="text-gray-500 hover:text-gray-900"
                      >
                        Renommer
                      </button>
                      <button
                        onClick={() => remove(cat)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
