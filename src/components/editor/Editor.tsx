"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Article,
  Block,
  BlockType,
  Category,
  PublishedContent,
  contentSnapshot,
  contentEquals,
  defaultButtonStyle,
} from "@/lib/types";
import { uniqueId, slugify } from "@/lib/slug";
import { checkTargets, SeoCheck } from "@/lib/seo";
import { BlockEditor } from "./BlockEditor";
import { SeoPanel, GooglePreview } from "./SeoPanel";
import { SettingsPanel } from "./SettingsPanel";
import { SerpDrawer } from "./SerpDrawer";
import { ImportModal } from "./ImportModal";

type SaveState = "idle" | "saving" | "saved" | "error";
type Tab = "seo" | "settings";

// Résultat de la synchronisation vers le site vitrine (swipelink.fr/blog),
// renvoyé par les routes publish/unpublish.
type SiteSync = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
};

// Prévient l'utilisateur si la mise en ligne sur le site a échoué.
// (Un `skipped` — intégration non configurée — reste silencieux.)
function warnIfSiteSyncFailed(sync?: SiteSync) {
  if (!sync || sync.ok || sync.skipped) return;
  alert(
    "L'article a bien été enregistré, mais sa mise en ligne sur swipelink.fr/blog a échoué :\n\n" +
      (sync.error || "erreur inconnue") +
      "\n\nVérifie la configuration GitHub du site puis republie."
  );
}

const BLOCK_MENU: { type: BlockType; label: string; icon: string }[] = [
  { type: "paragraph", label: "Paragraphe", icon: "¶" },
  { type: "heading", label: "Titre", icon: "H" },
  { type: "image", label: "Image", icon: "🖼️" },
  { type: "list", label: "Liste", icon: "☰" },
  { type: "faq", label: "FAQ", icon: "❓" },
  { type: "button", label: "Bouton", icon: "🔘" },
  { type: "cta", label: "Appel à l'action", icon: "📣" },
  { type: "quote", label: "Citation", icon: "❝" },
  { type: "code", label: "Code", icon: "</>" },
];

export function Editor({ id }: { id: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [tab, setTab] = useState<Tab>("seo");
  // Menu « ajouter un bloc » : index d'insertion ouvert (null = fermé).
  // i = insérer avant le bloc i ; blocks.length = ajouter en fin.
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [serpOpen, setSerpOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  // Référence de la version publiée, pour détecter les modifications non publiées.
  const [baseline, setBaseline] = useState<PublishedContent | null>(null);
  // Surlignage déclenché depuis l'analyse SEO (blocs + champ de réglages).
  const [highlightIds, setHighlightIds] = useState<string[]>([]);
  const [highlightField, setHighlightField] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modifications du brouillon non encore répercutées sur la version en ligne.
  const hasUnpublishedChanges =
    article && baseline
      ? !contentEquals(contentSnapshot(article), baseline)
      : false;

  // Chargement initial
  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data: Article | null) => {
        if (data) {
          setArticle(data);
          setBaseline(data.published ?? contentSnapshot(data));
        }
      });
    fetch("/api/categories")
      .then((r) => r.json())
      .then((c: Category[]) => setCategories(c))
      .catch(() => setCategories([]));
  }, [id]);

  // Autosave : n'envoie QUE les champs du brouillon (jamais le statut ni
  // l'instantané publié), de sorte qu'éditer ne modifie pas la version en ligne.
  const save = useCallback(async (next: Article) => {
    setSaveState("saving");
    try {
      const payload = {
        title: next.title,
        slug: next.slug,
        excerpt: next.excerpt,
        coverImage: next.coverImage,
        author: next.author,
        blocks: next.blocks,
        seo: next.seo,
        categoryId: next.categoryId ?? null,
      };
      const res = await fetch(`/api/articles/${next.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save failed");
      const saved = await res.json();
      setArticle((cur) => (cur ? { ...cur, updatedAt: saved.updatedAt } : cur));
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  // Autosave debouncé
  function update(patch: Partial<Article>) {
    setArticle((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(next), 900);
      return next;
    });
  }

  function updateBlock(blockId: string, block: Block) {
    if (!article) return;
    update({ blocks: article.blocks.map((b) => (b.id === blockId ? block : b)) });
  }

  function addBlock(type: BlockType, index?: number) {
    if (!article) return;
    const blocks = [...article.blocks];
    const at = index ?? blocks.length;
    blocks.splice(at, 0, newBlock(type));
    update({ blocks });
    setMenuIndex(null);
  }

  // Insère les blocs issus d'un import de texte brut : ajout à la suite ou
  // remplacement complet du contenu existant.
  function importBlocks(blocks: Block[], mode: "append" | "replace") {
    if (!article || blocks.length === 0) return;
    update({
      blocks: mode === "replace" ? blocks : [...article.blocks, ...blocks],
    });
  }

  function removeBlock(blockId: string) {
    if (!article) return;
    update({ blocks: article.blocks.filter((b) => b.id !== blockId) });
  }

  function moveBlock(index: number, dir: -1 | 1) {
    if (!article) return;
    const blocks = [...article.blocks];
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    [blocks[index], blocks[target]] = [blocks[target], blocks[index]];
    update({ blocks });
  }

  // Publie ou met à jour la version en ligne : fige le brouillon courant.
  async function publish() {
    if (!article || publishing) return;
    setPublishing(true);
    try {
      // Garantit un slug avant publication.
      const a = article.slug
        ? article
        : { ...article, slug: slugify(article.title || "article") };
      if (a !== article) setArticle(a);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await save(a); // persiste le brouillon (avec slug) côté serveur

      const res = await fetch(`/api/articles/${id}/publish`, { method: "POST" });
      if (!res.ok) throw new Error("publish failed");
      const updated: Article & { siteSync?: SiteSync } = await res.json();
      setArticle(updated);
      setBaseline(updated.published);
      setSaveState("saved");
      warnIfSiteSyncFailed(updated.siteSync);
    } catch {
      setSaveState("error");
    } finally {
      setPublishing(false);
    }
  }

  async function unpublish() {
    if (!article || publishing) return;
    if (!confirm("Retirer cet article du site public ?")) return;
    setPublishing(true);
    try {
      const res = await fetch(`/api/articles/${id}/unpublish`, { method: "POST" });
      if (res.ok) {
        const updated: Article & { siteSync?: SiteSync } = await res.json();
        setArticle(updated);
        warnIfSiteSyncFailed(updated.siteSync);
      }
    } finally {
      setPublishing(false);
    }
  }

  // Ouvre l'aperçu après avoir persisté le brouillon courant.
  async function preview() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (article) await save(article);
    window.open(`/preview/${id}`, "_blank");
  }

  // Localise un conseil SEO : surligne les blocs / le champ à corriger.
  function focusCheck(check: SeoCheck) {
    if (!article) return;
    const target = checkTargets(article, check.id);
    if (highlightTimer.current) clearTimeout(highlightTimer.current);

    const scrollTo = (elId: string) =>
      requestAnimationFrame(() => {
        document
          .getElementById(elId)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

    if (target.field) {
      setTab("settings");
      setHighlightField(target.field);
      setHighlightIds([]);
      // laisse le temps à l'onglet Réglages de se monter avant de scroller
      setTimeout(() => {
        document
          .querySelector(`[data-field="${target.field}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    } else if (target.blockIds.length) {
      setHighlightIds(target.blockIds);
      setHighlightField(null);
      scrollTo(`block-${target.blockIds[0]}`);
    } else if (target.addBlock) {
      setHighlightIds(["__add__"]);
      setHighlightField(null);
      scrollTo("add-block-btn");
    }

    highlightTimer.current = setTimeout(() => {
      setHighlightIds([]);
      setHighlightField(null);
    }, 3500);
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-600">Article introuvable.</p>
          <Link href="/dashboard" className="mt-2 inline-block font-semibold text-brand">
            ← Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Chargement de l'éditeur…
      </div>
    );
  }

  const categoryLabel = categories.find(
    (c) => c.id === article.categoryId
  )?.name;

  return (
    <div className="min-h-screen bg-gray-50 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      {/* Barre supérieure */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur lg:shrink-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">
              ← Tableau de bord
            </Link>
            <SaveIndicator state={saveState} />
            {article.isTemplate && (
              <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-brand">
                🧩 Template{categoryLabel ? ` · ${categoryLabel}` : ""}
              </span>
            )}
            {!article.isTemplate &&
              article.status === "published" &&
              hasUnpublishedChanges && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Modifications non publiées
                </span>
              )}
          </div>

          {article.isTemplate ? (
            <div className="flex items-center gap-3">
              <button
                onClick={preview}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                👁️ Aperçu
              </button>
              <Link
                href="/categories"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Terminer
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSerpOpen(true)}
                title="Voir les 5 premiers résultats Google pour le mot-clé"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                🔍 Concurrence
              </button>
              <button
                onClick={preview}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                👁️ Aperçu
              </button>

              {article.status === "published" && article.published && (
                <Link
                  href={`/blog/${article.published.slug}`}
                  target="_blank"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  Voir en ligne ↗
                </Link>
              )}

              {article.status === "published" && (
                <button
                  onClick={unpublish}
                  disabled={publishing}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                >
                  Dépublier
                </button>
              )}

              {article.status === "published" ? (
                <button
                  onClick={publish}
                  disabled={publishing || !hasUnpublishedChanges}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishing
                    ? "Publication…"
                    : hasUnpublishedChanges
                    ? "Mettre à jour et publier"
                    : "À jour ✓"}
                </button>
              ) : (
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                >
                  {publishing ? "Publication…" : "Publier"}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:min-h-0 lg:flex-1 lg:grid-cols-[1fr_380px] lg:gap-8 lg:overflow-hidden lg:py-0">
        {/* Colonne d'édition — défilement indépendant */}
        <main className="lg:min-h-0 lg:overflow-y-auto lg:py-8 lg:pr-3">
          <input
            value={article.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Titre de l'article"
            className="w-full bg-transparent text-4xl font-extrabold text-gray-900 outline-none placeholder:text-gray-300"
          />
          <div className="mt-2 text-sm text-gray-400">
            /blog/{article.slug || "…"}
          </div>

          <div className="mt-8">
            {article.blocks.map((block, i) => (
              <div key={block.id}>
                <InsertPoint
                  open={menuIndex === i}
                  onToggle={() => setMenuIndex(menuIndex === i ? null : i)}
                  onPick={(t) => addBlock(t, i)}
                />
                <BlockEditor
                  block={block}
                  onChange={(b) => updateBlock(block.id, b)}
                  onRemove={() => removeBlock(block.id)}
                  onMoveUp={() => moveBlock(i, -1)}
                  onMoveDown={() => moveBlock(i, 1)}
                  isFirst={i === 0}
                  isLast={i === article.blocks.length - 1}
                  highlighted={highlightIds.includes(block.id)}
                />
              </div>
            ))}
          </div>

          {/* Ajout de bloc + import */}
          <div className="relative mt-4 flex gap-3">
            <button
              id="add-block-btn"
              onClick={() =>
                setMenuIndex(
                  menuIndex === article.blocks.length ? null : article.blocks.length
                )
              }
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-gray-500 transition hover:border-brand hover:text-brand ${
                highlightIds.includes("__add__")
                  ? "block-highlight border-brand text-brand"
                  : "border-gray-200"
              }`}
            >
              <span className="text-xl">+</span> Ajouter un bloc
            </button>
            <button
              onClick={() => setShowImport(true)}
              title="Coller le texte brut ou une capture d'écran d'un article existant pour générer les blocs"
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-5 py-4 text-gray-500 transition hover:border-brand hover:text-brand"
            >
              <span className="text-lg">📥</span> Importer un article
            </button>
            {menuIndex === article.blocks.length && (
              <div className="absolute left-1/2 top-full z-10 mt-2 grid w-72 -translate-x-1/2 grid-cols-2 gap-1 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                {BLOCK_MENU.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => addBlock(item.type)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span className="w-5 text-center">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Colonne latérale — défilement indépendant */}
        <aside className="lg:min-h-0 lg:overflow-y-auto lg:py-8">
          <div className="mb-4">
            <GooglePreview article={article} />
          </div>

          <div className="mb-3 flex rounded-xl border border-gray-100 bg-white p-1">
            <TabButton active={tab === "seo"} onClick={() => setTab("seo")}>
              Analyse SEO
            </TabButton>
            <TabButton active={tab === "settings"} onClick={() => setTab("settings")}>
              Réglages
            </TabButton>
          </div>

          {tab === "seo" ? (
            <SeoPanel article={article} onFocusCheck={focusCheck} />
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <SettingsPanel
                article={article}
                onPatch={update}
                highlightField={highlightField}
                categories={categories}
              />
            </div>
          )}
        </aside>
      </div>

      <SerpDrawer
        open={serpOpen}
        keyword={article.seo.focusKeyword}
        onClose={() => setSerpOpen(false)}
      />

      <ImportModal
        open={showImport}
        hasExistingBlocks={article.blocks.length > 0}
        onClose={() => setShowImport(false)}
        onImport={importBlocks}
      />
    </div>
  );
}

// Point d'insertion entre deux blocs : un « + » discret qui apparaît au survol
// et ouvre le menu des types de bloc pour insérer à cette position.
function InsertPoint({
  open,
  onToggle,
  onPick,
}: {
  open: boolean;
  onToggle: () => void;
  onPick: (type: BlockType) => void;
}) {
  return (
    <div className="relative">
      <div className="group flex items-center justify-center py-1.5">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gray-100 opacity-0 transition group-hover:opacity-100" />
        <button
          type="button"
          onClick={onToggle}
          title="Insérer un bloc ici"
          className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-sm shadow-sm transition ${
            open
              ? "border-brand text-brand"
              : "border-gray-200 text-gray-400 opacity-0 hover:border-brand hover:text-brand group-hover:opacity-100"
          }`}
        >
          +
        </button>
      </div>
      {open && (
        <div className="absolute left-1/2 top-8 z-20 grid w-72 -translate-x-1/2 grid-cols-2 gap-1 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
          {BLOCK_MENU.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => onPick(item.type)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function newBlock(type: BlockType): Block {
  const id = uniqueId("blk_");
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: "" };
    case "paragraph":
      return { id, type, html: "" };
    case "image":
      return { id, type, src: "", alt: "", caption: "" };
    case "list":
      return { id, type, ordered: false, items: [""] };
    case "quote":
      return { id, type, text: "", cite: "" };
    case "code":
      return { id, type, language: "", code: "" };
    case "button":
      return {
        id,
        type,
        label: "Cliquez ici",
        url: "",
        newTab: false,
        style: defaultButtonStyle(),
      };
    case "cta":
      return {
        id,
        type,
        title: "",
        text: "",
        buttonLabel: "En savoir plus",
        buttonUrl: "",
        buttonNewTab: false,
        buttonStyle: defaultButtonStyle({ align: "center" }),
      };
    case "faq":
      return {
        id,
        type,
        title: "Questions fréquentes",
        items: [{ id: uniqueId("faq_"), question: "", answer: "" }],
      };
  }
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { text: string; color: string }> = {
    idle: { text: "", color: "" },
    saving: { text: "Enregistrement…", color: "text-gray-400" },
    saved: { text: "✓ Enregistré", color: "text-green-600" },
    error: { text: "⚠ Erreur d'enregistrement", color: "text-red-500" },
  };
  const s = map[state];
  return <span className={`text-sm ${s.color}`}>{s.text}</span>;
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-brand text-white" : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}
