// Import d'un article existant à partir de son texte brut (« plain text »).
// Transforme le texte collé en une liste de blocs (titres, paragraphes, listes)
// prêts à être insérés dans l'éditeur.
//
// Deux formats sont reconnus :
//   1. Markdown léger : titres (#, ##, …), listes (-, *, •, 1.), gras/italique/liens.
//   2. Texte brut sans balises : une heuristique détecte les lignes qui
//      ressemblent à des titres (courtes, isolées, sans ponctuation finale).

import { Block, HeadingBlock, ListBlock, ParagraphBlock } from "./types";
import { uniqueId } from "./slug";

export interface ImportSummary {
  headings: number;
  paragraphs: number;
  lists: number;
  total: number;
}

// Échappe les caractères spéciaux HTML avant toute injection de balise.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Convertit la mise en forme markdown en ligne (gras, italique, liens) en HTML.
// Le texte est d'abord échappé, puis les motifs markdown sont réintroduits.
function inlineMarkdownToHtml(text: string): string {
  let html = escapeHtml(text);
  // Liens [libellé](url)
  html = html.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    (_m, label, url) => `<a href="${url}">${label}</a>`
  );
  // Gras : **texte** ou __texte__
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  // Italique : *texte* ou _texte_
  html = html.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  html = html.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");
  return html;
}

// Niveau de titre markdown (# = 1, ## = 2, …) borné à l'intervalle H2–H4
// utilisé par l'éditeur. Le H1 est réservé au titre de l'article.
function markdownHeadingLevel(hashes: number): 2 | 3 | 4 {
  if (hashes <= 2) return 2;
  if (hashes === 3) return 3;
  return 4;
}

const BULLET_RE = /^\s*([-*•·–—])\s+(.*)$/;
const ORDERED_RE = /^\s*(\d+)[.)]\s+(.*)$/;
const MD_HEADING_RE = /^(#{1,6})\s+(.*)$/;

// Type de ligne reconnu lors de l'analyse.
type Line =
  | { kind: "blank" }
  | { kind: "mdHeading"; level: 2 | 3 | 4; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "numbered"; text: string; raw: string }
  | { kind: "text"; text: string };

// Classe une ligne brute selon sa nature (titre markdown, puce, numéro, texte).
function classifyLine(raw: string): Line {
  const line = raw.replace(/[ \t]+$/g, "");
  if (line.trim() === "") return { kind: "blank" };

  const md = MD_HEADING_RE.exec(line.trim());
  if (md) {
    return {
      kind: "mdHeading",
      level: markdownHeadingLevel(md[1].length),
      text: md[2].trim(),
    };
  }

  const bullet = BULLET_RE.exec(line);
  if (bullet) return { kind: "bullet", text: bullet[2].trim() };

  const ordered = ORDERED_RE.exec(line);
  if (ordered) return { kind: "numbered", text: ordered[2].trim(), raw: line.trim() };

  return { kind: "text", text: line.trim() };
}

// Heuristique : une ligne courte, sans ponctuation finale de phrase, est
// probablement un titre dans un texte brut sans balises markdown.
function looksLikeHeading(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > 90) return false;
  if (/[.!?,;]$/.test(t)) return false; // se termine comme une phrase
  const words = t.split(/\s+/);
  if (words.length > 14) return false; // trop long pour un titre
  return true;
}

// Niveau d'un titre en texte brut : un sous-titre numéroté « 1.2 … » ou « 2) … »
// est plutôt un H3, sinon H2.
function plainHeadingLevel(text: string): 2 | 3 | 4 {
  if (/^\s*\d+([.)]\d+)+/.test(text)) return 3;
  return 2;
}

function headingBlock(level: 2 | 3 | 4, text: string, id: string): HeadingBlock {
  return { id, type: "heading", level, text: text.trim() };
}

function paragraphBlock(html: string, id: string): ParagraphBlock {
  return { id, type: "paragraph", html };
}

function listBlock(ordered: boolean, items: string[], id: string): ListBlock {
  return { id, type: "list", ordered, items };
}

export interface ParseOptions {
  // Générateur d'identifiants (injectable pour les tests). Par défaut uniqueId.
  newId?: (prefix?: string) => string;
}

// Analyse le texte brut collé et produit la liste de blocs correspondante.
//
// Principes (adaptés aux articles réels où chaque paragraphe est sur une seule
// ligne, sans ligne vide, et où les sections sont numérotées) :
//   - chaque ligne non vide devient son propre bloc (pas de fusion) ;
//   - une ligne courte, isolée, sans ponctuation finale → titre ;
//   - une ligne « 1. … » est un ÉLÉMENT DE LISTE seulement si une ligne voisine
//     est elle aussi numérotée (vraie liste ordonnée) ; sinon c'est un TITRE de
//     section (« 1. Maximisez votre visibilité »).
export function parsePlainText(text: string, opts: ParseOptions = {}): Block[] {
  const newId = opts.newId ?? uniqueId;
  const lines = text.replace(/\r\n?/g, "\n").split("\n").map(classifyLine);
  const blocks: Block[] = [];

  // Ligne significative (non vide) précédente / suivante, pour détecter les
  // véritables suites d'éléments numérotés.
  const nextMeaningful = (i: number): Line | null => {
    for (let j = i + 1; j < lines.length; j++)
      if (lines[j].kind !== "blank") return lines[j];
    return null;
  };
  const prevMeaningful = (i: number): Line | null => {
    for (let j = i - 1; j >= 0; j--)
      if (lines[j].kind !== "blank") return lines[j];
    return null;
  };

  // Liste en cours d'accumulation (puces ou numéros contigus).
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushList = () => {
    if (list) {
      blocks.push(listBlock(list.ordered, list.items, newId("blk_")));
      list = null;
    }
  };
  const pushToList = (ordered: boolean, text: string) => {
    if (list && list.ordered !== ordered) flushList();
    if (!list) list = { ordered, items: [] };
    list.items.push(text);
  };

  // Émet un titre si la ligne en a l'allure, sinon un paragraphe.
  const pushHeadingOrParagraph = (text: string) => {
    if (looksLikeHeading(text)) {
      blocks.push(headingBlock(plainHeadingLevel(text), text, newId("blk_")));
    } else {
      blocks.push(paragraphBlock(inlineMarkdownToHtml(text), newId("blk_")));
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];

    switch (ln.kind) {
      case "blank":
        break; // n'interrompt pas une liste (éléments parfois espacés)

      case "mdHeading":
        flushList();
        blocks.push(headingBlock(ln.level, ln.text, newId("blk_")));
        break;

      case "bullet":
        pushToList(false, ln.text);
        break;

      case "numbered": {
        const prev = prevMeaningful(i);
        const next = nextMeaningful(i);
        const partOfRun =
          prev?.kind === "numbered" || next?.kind === "numbered";
        if (partOfRun) {
          pushToList(true, ln.text);
        } else {
          // « 1. Titre de section » isolé : c'est un titre, pas une liste.
          flushList();
          pushHeadingOrParagraph(ln.raw);
        }
        break;
      }

      case "text":
        flushList();
        pushHeadingOrParagraph(ln.text);
        break;
    }
  }

  flushList();
  return blocks;
}

// Résumé lisible du résultat d'analyse, pour l'aperçu avant import.
export function summarize(blocks: Block[]): ImportSummary {
  const summary: ImportSummary = {
    headings: 0,
    paragraphs: 0,
    lists: 0,
    total: blocks.length,
  };
  for (const b of blocks) {
    if (b.type === "heading") summary.headings++;
    else if (b.type === "paragraph") summary.paragraphs++;
    else if (b.type === "list") summary.lists++;
  }
  return summary;
}
