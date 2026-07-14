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

const BULLET_RE = /^\s*([-*•·])\s+(.*)$/;
const ORDERED_RE = /^\s*\d+[.)]\s+(.*)$/;
const MD_HEADING_RE = /^(#{1,6})\s+(.*)$/;

// Extrait le contenu d'une ligne de liste (puce ou numérotée), ou null sinon.
function listItemContent(line: string): { ordered: boolean; text: string } | null {
  const bullet = BULLET_RE.exec(line);
  if (bullet) return { ordered: false, text: bullet[2].trim() };
  const ordered = ORDERED_RE.exec(line);
  if (ordered) return { ordered: true, text: ordered[1].trim() };
  return null;
}

// Heuristique : une ligne isolée et courte, sans ponctuation finale de phrase,
// est probablement un titre dans un texte brut sans balises markdown.
function looksLikeHeading(text: string): boolean {
  const t = text.trim();
  if (t.length === 0 || t.length > 90) return false;
  if (/[.:!?,;]$/.test(t)) return false; // se termine comme une phrase
  const words = t.split(/\s+/);
  if (words.length > 14) return false; // trop long pour un titre
  return true;
}

// Transforme un titre en texte brut (avec éventuel préfixe de numérotation
// « 1. », « I. », « Chapitre 2 – ») en niveau H3 pour les sous-titres.
function plainHeadingLevel(text: string): 2 | 3 | 4 {
  // Un sous-titre numéroté « 1.2 … » ou « 2) … » est plutôt un H3.
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
// L'analyse est effectuée ligne par ligne afin de gérer les cas où un titre
// markdown ou une liste suivent directement du texte, sans ligne vide entre eux.
// On accumule les lignes de texte contiguës dans un « groupe » ; un groupe est
// clos (« flush ») par une ligne vide, un titre, un début de liste ou la fin.
export function parsePlainText(text: string, opts: ParseOptions = {}): Block[] {
  const newId = opts.newId ?? uniqueId;
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];

  let textGroup: string[] = []; // lignes de texte contiguës en cours
  let listItems: string[] = []; // éléments de liste contigus en cours
  let listOrdered = false;

  // Un groupe de texte devient un titre s'il tient sur une seule ligne et en a
  // l'allure ; sinon c'est un paragraphe (lignes fusionnées par des espaces).
  function flushText() {
    if (textGroup.length === 0) return;
    if (textGroup.length === 1 && looksLikeHeading(textGroup[0])) {
      const t = textGroup[0].trim();
      blocks.push(headingBlock(plainHeadingLevel(t), t, newId("blk_")));
    } else {
      const html = inlineMarkdownToHtml(textGroup.join(" ").trim());
      blocks.push(paragraphBlock(html, newId("blk_")));
    }
    textGroup = [];
  }

  function flushList() {
    if (listItems.length === 0) return;
    blocks.push(listBlock(listOrdered, listItems, newId("blk_")));
    listItems = [];
  }

  for (const raw of lines) {
    const line = raw.replace(/[ \t]+$/g, "");

    // Ligne vide : clôt les groupes en cours.
    if (line.trim() === "") {
      flushText();
      flushList();
      continue;
    }

    // Titre markdown explicite (# … ###### …).
    const md = MD_HEADING_RE.exec(line.trim());
    if (md) {
      flushText();
      flushList();
      blocks.push(
        headingBlock(markdownHeadingLevel(md[1].length), md[2], newId("blk_"))
      );
      continue;
    }

    // Élément de liste : accumulé avec les éléments contigus du même type.
    const item = listItemContent(line);
    if (item) {
      flushText();
      if (listItems.length === 0) listOrdered = item.ordered;
      listItems.push(item.text);
      continue;
    }

    // Ligne de texte ordinaire : une liste en cours est close avant d'ajouter.
    flushList();
    textGroup.push(line.trim());
  }

  flushText();
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
