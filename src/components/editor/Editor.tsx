"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Article, Block, BlockType } from "@/lib/types";
import { uniqueId, slugify } from "@/lib/slug";
import { BlockEditor } from "./BlockEditor";
import { SeoPanel, GooglePreview } from "./SeoPanel";
import { SettingsPanel } from "./SettingsPanel";

type SaveState = "idle" | "saving" | "saved" | "error";
type Tab = "seo" | "settings";

const BLOCK_MENU: { type: BlockType; label: string; icon: string }[] = [
  { type: "paragraph", label: "Paragraphe", icon: "¶" },
  { type: "heading", label: "Titre", icon: "H" },
  { type: "image", label: "Image", icon: "🖼️" },
  { type: "list", label: "Liste", icon: "☰" },
  { type: "faq", label: "FAQ", icon: "❓" },
  { type: "cta", label: "Appel à l'action", icon: "🔘" },
  { type: "quote", label: "Citation", icon: "❝" },
  { type: "code", label: "Code", icon: "</>" },
];

export function Editor({ id }: { id: string }) {
  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [tab, setTab] = useState<Tab>("seo");
  const [showMenu, setShowMenu] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

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
      .then((data) => data && setArticle(data));
  }, [id]);

  const save = useCallback(async (next: Article) => {
    setSaveState("saving");
    try {
      const res = await fetch(`/api/articles/${next.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error("save failed");
      const saved = await res.json();
      setArticle((cur) => (cur ? { ...cur, updatedAt: saved.updatedAt } : cur));
      setSaveState("saved");
      dirty.current = false;
    } catch {
      setSaveState("error");
    }
  }, []);

  // Autosave debouncé
  function update(patch: Partial<Article>) {
    setArticle((cur) => {
      if (!cur) return cur;
      const next = { ...cur, ...patch };
      dirty.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(next), 900);
      return next;
    });
  }

  function updateBlock(blockId: string, block: Block) {
    if (!article) return;
    update({ blocks: article.blocks.map((b) => (b.id === blockId ? block : b)) });
  }

  function addBlock(type: BlockType) {
    if (!article) return;
    update({ blocks: [...article.blocks, newBlock(type)] });
    setShowMenu(false);
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

  async function togglePublish() {
    if (!article) return;
    if (article.status === "draft" && !article.slug) {
      update({ slug: slugify(article.title || "article") });
    }
    const next: Article = {
      ...article,
      status: article.status === "published" ? "draft" : "published",
      slug: article.slug || slugify(article.title || "article"),
    };
    setArticle(next);
    await save(next);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre supérieure */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-700">
              ← Tableau de bord
            </Link>
            <SaveIndicator state={saveState} />
          </div>
          <div className="flex items-center gap-3">
            {article.status === "published" && (
              <Link
                href={`/blog/${article.slug}`}
                target="_blank"
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Voir en ligne ↗
              </Link>
            )}
            <button
              onClick={togglePublish}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                article.status === "published"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-brand hover:bg-brand-dark"
              }`}
            >
              {article.status === "published" ? "Dépublier" : "Publier"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-[1fr_380px]">
        {/* Colonne d'édition */}
        <main>
          <input
            value={article.title}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="Titre de l'article"
            className="w-full bg-transparent text-4xl font-extrabold text-gray-900 outline-none placeholder:text-gray-300"
          />
          <div className="mt-2 text-sm text-gray-400">
            /blog/{article.slug || "…"}
          </div>

          <div className="mt-8 space-y-3">
            {article.blocks.map((block, i) => (
              <BlockEditor
                key={block.id}
                block={block}
                onChange={(b) => updateBlock(block.id, b)}
                onRemove={() => removeBlock(block.id)}
                onMoveUp={() => moveBlock(i, -1)}
                onMoveDown={() => moveBlock(i, 1)}
                isFirst={i === 0}
                isLast={i === article.blocks.length - 1}
              />
            ))}
          </div>

          {/* Ajout de bloc */}
          <div className="relative mt-4">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-gray-500 transition hover:border-brand hover:text-brand"
            >
              <span className="text-xl">+</span> Ajouter un bloc
            </button>
            {showMenu && (
              <div className="absolute left-1/2 z-10 mt-2 grid w-72 -translate-x-1/2 grid-cols-2 gap-1 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
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

        {/* Colonne latérale */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
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
            <SeoPanel article={article} />
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <SettingsPanel article={article} onPatch={update} />
            </div>
          )}
        </aside>
      </div>
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
    case "cta":
      return { id, type, title: "", text: "", buttonLabel: "", buttonUrl: "" };
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
