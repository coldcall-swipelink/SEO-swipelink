"use client";

import { useMemo, useRef, useState } from "react";
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

type OcrState =
  | { status: "idle" }
  | { status: "running"; label: string; progress: number }
  | { status: "error"; message: string };

export function ImportModal({
  open,
  hasExistingBlocks,
  onClose,
  onImport,
}: Props) {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"append" | "replace">("append");
  const [ocr, setOcr] = useState<OcrState>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyse en direct pour l'aperçu (débounce inutile : parsing local rapide).
  const blocks = useMemo(() => parsePlainText(text), [text]);
  const stats = useMemo(() => summarize(blocks), [blocks]);

  if (!open) return null;

  function reset() {
    setText("");
    setMode("append");
    setOcr({ status: "idle" });
  }

  function handleImport() {
    if (blocks.length === 0) return;
    onImport(blocks, hasExistingBlocks ? mode : "append");
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  // Prépare l'image pour l'OCR : niveaux de gris + contraste (meilleure
  // lisibilité), agrandissement des petites captures et bornage des très
  // grandes. En cas d'échec, on retombe sur l'image d'origine.
  async function preprocessImage(file: Blob): Promise<Blob> {
    try {
      const bitmap = await createImageBitmap(file);
      const MAX_W = 2600;
      let scale = 1;
      if (bitmap.width < 1000) scale = 2;
      else if (bitmap.width > MAX_W) scale = MAX_W / bitmap.width;
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return file;
      ctx.filter = "grayscale(1) contrast(1.2)";
      ctx.drawImage(bitmap, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/png")
      );
      return blob ?? file;
    } catch {
      return file;
    }
  }

  // Lance la reconnaissance de texte (OCR) sur une image, 100 % dans le
  // navigateur via Tesseract.js. Le texte reconnu est ajouté à la zone de
  // saisie, où il peut être relu et corrigé avant l'import.
  async function runOcr(file: Blob) {
    if (!file.type.startsWith("image/")) {
      setOcr({ status: "error", message: "Le fichier doit être une image." });
      return;
    }
    setOcr({ status: "running", label: "Préparation du moteur OCR…", progress: 0 });
    try {
      const image = await preprocessImage(file);
      // Import dynamique : la bibliothèque (volumineuse) n'est chargée qu'à
      // la première utilisation de l'OCR.
      const { createWorker } = await import("tesseract.js");
      // Moteur, cœur WASM et données de langue sont servis en local (dossier
      // public/tesseract) : aucun appel à un CDN externe, fonctionne hors-ligne.
      const worker = await createWorker("fra", 1, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract/tesseract-core-simd-lstm.wasm.js",
        langPath: "/tesseract/lang",
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setOcr({
              status: "running",
              label: "Lecture du texte…",
              progress: m.progress,
            });
          } else {
            setOcr({
              status: "running",
              label: "Préparation du moteur OCR…",
              progress: 0,
            });
          }
        },
      });
      try {
        const { data } = await worker.recognize(image);
        const recognized = data.text.trim();
        if (!recognized) {
          setOcr({
            status: "error",
            message: "Aucun texte détecté sur l'image.",
          });
          return;
        }
        setText((cur) => (cur.trim() ? `${cur.trim()}\n\n${recognized}` : recognized));
        setOcr({ status: "idle" });
      } finally {
        await worker.terminate();
      }
    } catch {
      setOcr({
        status: "error",
        message:
          "La reconnaissance a échoué. Réessayez ou collez le texte manuellement.",
      });
    }
  }

  function onFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) runOcr(file);
    e.target.value = ""; // permet de re-sélectionner le même fichier
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) runOcr(file);
  }

  // Colle une capture d'écran directement depuis le presse-papiers (Ctrl/⌘+V).
  function onPaste(e: React.ClipboardEvent) {
    const imageItem = Array.from(e.clipboardData.items).find((it) =>
      it.type.startsWith("image/")
    );
    if (imageItem) {
      const file = imageItem.getAsFile();
      if (file) {
        e.preventDefault();
        runOcr(file);
      }
    }
  }

  const running = ocr.status === "running";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onPaste={onPaste}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Importer un article existant
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Collez le texte brut, ou importez une capture d'écran : les titres
              et paragraphes sont détectés automatiquement.
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
          {/* Import par image (OCR) */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mb-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center"
          >
            {running ? (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-700">{ocr.label}</div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-brand transition-all"
                    style={{ width: `${Math.round(ocr.progress * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Première utilisation : le moteur OCR (quelques Mo) est
                  téléchargé une seule fois.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  📷 Importer une capture d'écran
                </button>
                <p className="text-xs text-gray-400">
                  Glissez-déposez une image, cliquez pour en choisir une, ou
                  collez une capture (Ctrl/⌘+V). Le texte est extrait dans le
                  navigateur, sans envoi à un service externe.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Pour un bon résultat : capturez l'<strong>article publié ou
                  son aperçu</strong> (pas l'éditeur Webflow — le cadre de
                  sélection autour du titre perturbe la lecture), et cadrez sur
                  le contenu. Le <strong>titre de l'article</strong> se saisit
                  généralement mieux à la main.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFilePicked}
                  className="hidden"
                />
              </div>
            )}
            {ocr.status === "error" && (
              <p className="mt-2 text-xs font-medium text-red-500">{ocr.message}</p>
            )}
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            rows={11}
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
            disabled={blocks.length === 0 || running}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Importer {blocks.length > 0 ? `${blocks.length} bloc${blocks.length > 1 ? "s" : ""}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
