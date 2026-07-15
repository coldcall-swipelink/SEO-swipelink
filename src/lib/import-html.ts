// Extraction d'un article à partir du HTML d'une page publiée.
// Récupère le titre, un extrait, une image de couverture et convertit le
// contenu principal en blocs d'éditeur (titres, paragraphes, listes, images,
// citations, code). Le HTML inline conservé est strictement assaini.

import { parse, HTMLElement, Node } from "node-html-parser";
import {
  Block,
  HeadingBlock,
  ParagraphBlock,
  ListBlock,
  ImageBlock,
  QuoteBlock,
  CodeBlock,
} from "./types";
import { uniqueId } from "./slug";

export interface ImportedArticle {
  title: string;
  excerpt: string;
  coverImage: string;
  blocks: Block[];
}

// Éléments à retirer avant toute extraction (chrome de page, scripts, etc.).
const STRIP_TAGS = [
  "script",
  "style",
  "noscript",
  "template",
  "nav",
  "footer",
  "header",
  "aside",
  "form",
  "svg",
  "iframe",
  "button",
];

// Sélecteurs du conteneur de contenu principal, par ordre de préférence.
// `.w-richtext` est l'élément « Rich Text » de Webflow.
const CONTENT_SELECTORS = [
  ".w-richtext",
  "article",
  "[role=main]",
  "main",
  ".post-content",
  ".article-content",
  ".blog-content",
  ".post-body",
  ".article-body",
];

const NODE_ELEMENT = 1;
const NODE_TEXT = 3;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Résout une URL (éventuellement relative) en absolu ; ne renvoie que des
// URLs http/https, sinon une chaîne vide.
function resolveUrl(href: string | undefined, base: string): string {
  if (!href) return "";
  try {
    const u = new URL(href, base);
    if (u.protocol === "http:" || u.protocol === "https:") return u.href;
    return "";
  } catch {
    return "";
  }
}

function tagOf(node: Node): string {
  return (node as HTMLElement).rawTagName?.toLowerCase() ?? "";
}

// Assainit le contenu inline d'un élément : ne conserve que gras, italique,
// souligné, liens (href absolu) et sauts de ligne ; le reste est « déballé »
// (texte conservé, balise retirée). Neutralise tout script/attribut dangereux.
function sanitizeInline(el: HTMLElement, base: string): string {
  let out = "";
  for (const child of el.childNodes) {
    if (child.nodeType === NODE_TEXT) {
      out += escapeHtml(child.text);
    } else if (child.nodeType === NODE_ELEMENT) {
      const e = child as HTMLElement;
      const tag = tagOf(e);
      if (tag === "br") {
        out += "<br>";
        continue;
      }
      const inner = sanitizeInline(e, base);
      if (!inner && tag !== "img") continue;
      if (tag === "strong" || tag === "b") out += `<strong>${inner}</strong>`;
      else if (tag === "em" || tag === "i") out += `<em>${inner}</em>`;
      else if (tag === "u") out += `<u>${inner}</u>`;
      else if (tag === "a") {
        const href = resolveUrl(e.getAttribute("href"), base);
        out += href ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner;
      } else {
        out += inner; // balise inconnue : on garde le texte
      }
    }
  }
  return collapse(out);
}

function headingLevel(tag: string): 2 | 3 | 4 {
  if (tag === "h2") return 2;
  if (tag === "h3") return 3;
  return 4; // h4/h5/h6
}

function newBlockId(): string {
  return uniqueId("blk_");
}

// Extrait une image d'un <img> ou d'une <figure>.
function imageBlockFrom(el: HTMLElement, base: string): ImageBlock | null {
  const img = tagOf(el) === "img" ? el : el.querySelector("img");
  if (!img) return null;
  const src = resolveUrl(
    img.getAttribute("src") || img.getAttribute("data-src") || undefined,
    base
  );
  if (!src) return null;
  const caption = el.querySelector("figcaption")?.text;
  return {
    id: newBlockId(),
    type: "image",
    src,
    alt: collapse(img.getAttribute("alt") || ""),
    caption: caption ? collapse(caption) : undefined,
  };
}

// Parcourt récursivement le conteneur de contenu et émet les blocs rencontrés.
// Les conteneurs génériques (div/section/…) sont traversés ; les balises de
// bloc connues produisent directement un bloc.
function walk(node: HTMLElement, base: string, out: Block[]): void {
  for (const child of node.childNodes) {
    if (child.nodeType !== NODE_ELEMENT) continue;
    const el = child as HTMLElement;
    const tag = tagOf(el);

    switch (tag) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6": {
        const text = collapse(el.text);
        if (text) {
          const block: HeadingBlock = {
            id: newBlockId(),
            type: "heading",
            level: tag === "h1" ? 2 : headingLevel(tag),
            text,
          };
          out.push(block);
        }
        break;
      }

      case "p": {
        const html = sanitizeInline(el, base);
        if (html) {
          const block: ParagraphBlock = { id: newBlockId(), type: "paragraph", html };
          out.push(block);
        }
        break;
      }

      case "ul":
      case "ol": {
        const items = el
          .querySelectorAll(":scope > li")
          .map((li) => collapse(li.text))
          .filter(Boolean);
        // Repli si :scope n'est pas géré : prend tous les <li>.
        const finalItems =
          items.length > 0
            ? items
            : el.querySelectorAll("li").map((li) => collapse(li.text)).filter(Boolean);
        if (finalItems.length) {
          const block: ListBlock = {
            id: newBlockId(),
            type: "list",
            ordered: tag === "ol",
            items: finalItems,
          };
          out.push(block);
        }
        break;
      }

      case "blockquote": {
        const text = collapse(el.text);
        if (text) {
          const block: QuoteBlock = { id: newBlockId(), type: "quote", text };
          out.push(block);
        }
        break;
      }

      case "pre": {
        const code = el.text.replace(/\s+$/, "");
        if (code.trim()) {
          const block: CodeBlock = {
            id: newBlockId(),
            type: "code",
            language: "",
            code,
          };
          out.push(block);
        }
        break;
      }

      case "figure":
      case "img": {
        const block = imageBlockFrom(el, base);
        if (block) out.push(block);
        break;
      }

      case "table":
        break; // tableaux ignorés (pas de bloc dédié)

      default:
        // Conteneur générique : on descend d'un niveau.
        walk(el, base, out);
        break;
    }
  }
}

// Sélectionne le conteneur de contenu : premier sélecteur qui matche avec le
// plus de texte ; à défaut, l'élément contenant le plus de <p>.
function pickContentRoot(root: HTMLElement): HTMLElement {
  for (const sel of CONTENT_SELECTORS) {
    const candidates = root.querySelectorAll(sel);
    if (candidates.length) {
      let best = candidates[0];
      let bestLen = best.text.length;
      for (const c of candidates) {
        if (c.text.length > bestLen) {
          best = c;
          bestLen = c.text.length;
        }
      }
      if (bestLen > 120) return best;
    }
  }
  // Repli : le bloc avec le plus de paragraphes.
  const containers = root.querySelectorAll("div, section, article, main");
  let best: HTMLElement | null = null;
  let bestCount = 0;
  for (const c of containers) {
    const count = c.querySelectorAll("p").length;
    if (count > bestCount) {
      best = c;
      bestCount = count;
    }
  }
  return best ?? (root.querySelector("body") as HTMLElement) ?? root;
}

function metaContent(root: HTMLElement, names: string[]): string {
  for (const name of names) {
    const el =
      root.querySelector(`meta[property="${name}"]`) ||
      root.querySelector(`meta[name="${name}"]`);
    const content = el?.getAttribute("content");
    if (content) return collapse(content);
  }
  return "";
}

// Convertit une page HTML complète en article importable.
export function htmlToArticle(html: string, baseUrl: string): ImportedArticle {
  const root = parse(html, {
    comment: false,
    blockTextElements: { script: false, noscript: false, style: false, pre: true },
  });

  // Retire le chrome de page et les scripts avant toute extraction.
  for (const sel of STRIP_TAGS) {
    for (const el of root.querySelectorAll(sel)) el.remove();
  }

  const contentRoot = pickContentRoot(root);
  const blocks: Block[] = [];
  walk(contentRoot, baseUrl, blocks);

  // Titre : premier <h1> du contenu, sinon métadonnées, sinon <title>.
  const h1 = contentRoot.querySelector("h1") || root.querySelector("h1");
  let title = h1 ? collapse(h1.text) : "";
  if (!title) {
    title =
      metaContent(root, ["og:title", "twitter:title"]) ||
      collapse(root.querySelector("title")?.text || "");
  }
  // Évite de dupliquer le titre en tête des blocs.
  if (title && blocks.length && blocks[0].type === "heading") {
    if (collapse((blocks[0] as HeadingBlock).text) === title) blocks.shift();
  }

  const excerpt = metaContent(root, [
    "description",
    "og:description",
    "twitter:description",
  ]);
  const coverImage = resolveUrl(
    metaContent(root, ["og:image", "twitter:image"]) || undefined,
    baseUrl
  );

  return { title, excerpt, coverImage, blocks };
}
