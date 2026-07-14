"use client";

import { useMemo, useState } from "react";
import { Block } from "@/lib/types";
import { parsePlainText, summarize } from "@/lib/import-text";

interface Props {
  open: boolean;
  // true si l'article contient déjà des blocs (propose alors ajout/remplacement).
  hasExistingBlocks: boolean;
  onClose: () => void;
  // mode = "append" ajoute à la suite, "replace" remplace le contenu existant.
  onImport: (blocks: Block[], mode: "append" | "replace") => void;
}

const PLACEHOLDER = `Collez ici le texte brut de votre ancien article…

Exemple :
Mon titre de section

Un premier paragraphe qui présente le sujet et donne le contexte.

## Un sous-titre
- premier point
- deuxième point`;

export function ImportModal({
  open,
  hasExistingBlocks,
  onClose,
  onImport,
}: Props) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"append" | "replace">("append");

  // Analyse en direct pour l'aperçu (débounce inutile : parsing local rapide).
  const blocks = useMemo(() => parsePlainText(text), [text]);
  const stats = useMemo(() => summarize(blocks), [blocks]);

  if (!open) return null;

  function handleImport() {
    if (blocks.length === 0) return;
    onImport(blocks, hasExistingBlocks ? mode : "append");
    setText("");
    setMode("append");
    onClose();
  }

  function handleClose() {
    setText("");
    setMode("append");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Importer un article existant
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Collez le texte brut : les titres et paragraphes sont détectés
              automatiquement.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={12}
            autoFocus
            className="w-full resize-y rounded-xl border border-gray-200 px-3 py-2 text-sm leading-relaxed outline-none focus:border-brand"
          />

          {text.trim() && (
            <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm">
              <div className="font-semibold text-gray-700">
                {stats.total} bloc{stats.total > 1 ? "s" : ""} détecté
                {stats.total > 1 ? "s" : ""}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-gray-500">
                <span>📰 {stats.headings} titre{stats.headings > 1 ? "s" : ""}</span>
                <span>¶ {stats.paragraphs} paragraphe{stats.paragraphs > 1 ? "s" : ""}</span>
                {stats.lists > 0 && (
                  <span>☰ {stats.lists} liste{stats.lists > 1 ? "s" : ""}</span>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Astuce : une ligne courte et isolée devient un titre ; les listes
                à puces (-, •) et le markdown (##, **gras**, [lien](url)) sont
                reconnus. Vous pourrez tout ajuster ensuite.
              </p>
            </div>
          )}

          {hasExistingBlocks && text.trim() && (
            <div className="mt-3 space-y-2 text-sm">
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="radio"
                  name="import-mode"
                  checked={mode === "append"}
                  onChange={() => setMode("append")}
                />
                Ajouter à la suite du contenu existant
              </label>
              <label className="flex items-center gap-2 text-gray-700">
                <input
                  type="radio"
                  name="import-mode"
                  checked={mode === "replace"}
                  onChange={() => setMode("replace")}
                />
                Remplacer tout le contenu existant
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={handleClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleImport}
            disabled={blocks.length === 0}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Importer {blocks.length > 0 ? `${blocks.length} bloc${blocks.length > 1 ? "s" : ""}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
