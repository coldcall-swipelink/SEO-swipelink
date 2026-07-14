"use client";

import { Article } from "@/lib/types";
import { slugify } from "@/lib/slug";

interface Props {
  article: Article;
  onPatch: (patch: Partial<Article>) => void;
}

export function SettingsPanel({ article, onPatch }: Props) {
  function patchSeo(patch: Partial<Article["seo"]>) {
    onPatch({ seo: { ...article.seo, ...patch } });
  }

  return (
    <div className="space-y-5">
      <Field label="Mot-clé principal" hint="Le terme que vous ciblez sur Google.">
        <input
          value={article.seo.focusKeyword}
          onChange={(e) => patchSeo({ focusKeyword: e.target.value })}
          placeholder="ex : logiciel de facturation"
          className="input"
        />
      </Field>

      <Field
        label="Balise title"
        hint="Titre affiché dans les résultats Google."
        counter={{ value: article.seo.metaTitle.length, min: 30, max: 60 }}
      >
        <input
          value={article.seo.metaTitle}
          onChange={(e) => patchSeo({ metaTitle: e.target.value })}
          placeholder="Titre SEO (30-60 caractères)"
          className="input"
        />
      </Field>

      <Field
        label="Méta description"
        hint="Résumé incitatif sous le titre dans Google."
        counter={{ value: article.seo.metaDescription.length, min: 120, max: 160 }}
      >
        <textarea
          value={article.seo.metaDescription}
          onChange={(e) => patchSeo({ metaDescription: e.target.value })}
          placeholder="Description (120-160 caractères)"
          rows={3}
          className="input"
        />
      </Field>

      <Field label="Slug d'URL" hint="Partie de l'URL après /blog/.">
        <div className="flex gap-2">
          <input
            value={article.slug}
            onChange={(e) => onPatch({ slug: slugify(e.target.value) })}
            placeholder="mon-article"
            className="input flex-1"
          />
          <button
            type="button"
            onClick={() => onPatch({ slug: slugify(article.title) })}
            className="whitespace-nowrap rounded-lg border border-gray-200 px-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            Depuis le titre
          </button>
        </div>
      </Field>

      <Field label="Extrait" hint="Résumé utilisé sur la liste du blog et en secours pour la description.">
        <textarea
          value={article.excerpt}
          onChange={(e) => onPatch({ excerpt: e.target.value })}
          placeholder="Résumé court de l'article"
          rows={2}
          className="input"
        />
      </Field>

      <Field label="Auteur">
        <input
          value={article.author}
          onChange={(e) => onPatch({ author: e.target.value })}
          placeholder="Nom de l'auteur"
          className="input"
        />
      </Field>

      <Field label="Image de couverture" hint="Affichée en haut de l'article.">
        <input
          value={article.coverImage}
          onChange={(e) => onPatch({ coverImage: e.target.value })}
          placeholder="URL de l'image"
          className="input"
        />
      </Field>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-400">
          Avancé
        </h3>

        <Field
          label="Image de partage (Open Graph)"
          hint="Utilisée lors des partages sur les réseaux sociaux."
        >
          <input
            value={article.seo.ogImage}
            onChange={(e) => patchSeo({ ogImage: e.target.value })}
            placeholder="URL (par défaut : image de couverture)"
            className="input"
          />
        </Field>

        <Field
          label="URL canonique"
          hint="Laissez vide pour utiliser l'URL par défaut de l'article."
        >
          <input
            value={article.seo.canonicalUrl}
            onChange={(e) => patchSeo({ canonicalUrl: e.target.value })}
            placeholder="https://…"
            className="input"
          />
        </Field>

        <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={article.seo.noindex}
            onChange={(e) => patchSeo({ noindex: e.target.checked })}
          />
          Empêcher l'indexation (noindex)
        </label>
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          border-color: var(--brand);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  counter,
  children,
}: {
  label: string;
  hint?: string;
  counter?: { value: number; min: number; max: number };
  children: React.ReactNode;
}) {
  const color = counter
    ? counter.value >= counter.min && counter.value <= counter.max
      ? "text-green-600"
      : counter.value === 0
      ? "text-gray-400"
      : "text-amber-500"
    : "";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-800">{label}</label>
        {counter && (
          <span className={`text-xs font-medium ${color}`}>
            {counter.value}/{counter.max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
