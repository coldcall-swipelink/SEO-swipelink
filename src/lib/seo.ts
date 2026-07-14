// Moteur d'analyse SEO on-page.
// Produit un ensemble de contrôles + un score global, de façon 100% déterministe
// pour pouvoir tourner côté client (temps réel) comme côté serveur.

import { Article, Block } from "./types";

export type CheckStatus = "good" | "warning" | "bad";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  group: "base" | "keyword" | "readability" | "structure" | "links" | "media";
}

export interface SeoReport {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D";
  checks: SeoCheck[];
  stats: {
    words: number;
    readingTimeMin: number;
    headings: number;
    internalLinks: number;
    externalLinks: number;
    images: number;
    imagesWithoutAlt: number;
    keywordDensity: number; // pourcentage
    keywordCount: number;
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Extrait tout le texte lisible d'un article, dans l'ordre.
export function extractText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
        parts.push(b.text);
        break;
      case "paragraph":
        parts.push(stripHtml(b.html));
        break;
      case "quote":
        parts.push(b.text);
        break;
      case "list":
        parts.push(b.items.join(". "));
        break;
      case "cta":
        parts.push(`${b.title}. ${b.text}`);
        break;
      case "faq":
        for (const item of b.items) parts.push(`${item.question} ${item.answer}`);
        break;
      case "image":
        // l'alt participe au contenu sémantique
        if (b.alt) parts.push(b.alt);
        break;
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = haystack.match(new RegExp(`\\b${escaped}\\b`, "gi"));
  return matches ? matches.length : 0;
}

interface LinkInfo {
  internal: number;
  external: number;
}

function analyzeLinks(blocks: Block[]): LinkInfo {
  let internal = 0;
  let external = 0;
  const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
  for (const b of blocks) {
    const sources: string[] = [];
    if (b.type === "paragraph") sources.push(b.html);
    if (b.type === "cta") sources.push(`<a href="${b.buttonUrl}"></a>`);
    for (const html of sources) {
      let m: RegExpExecArray | null;
      while ((m = hrefRegex.exec(html)) !== null) {
        const href = m[1].trim();
        if (
          href.startsWith("http://") ||
          href.startsWith("https://") ||
          href.startsWith("//")
        ) {
          external += 1;
        } else if (href && !href.startsWith("#") && !href.startsWith("mailto:")) {
          internal += 1;
        }
      }
    }
  }
  return { internal, external };
}

function longSentenceRatio(text: string): number {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return 0;
  const long = sentences.filter((s) => countWords(s) > 25).length;
  return long / sentences.length;
}

export function analyzeSeo(article: Article): SeoReport {
  const checks: SeoCheck[] = [];
  const keyword = article.seo.focusKeyword.trim().toLowerCase();
  const text = extractText(article.blocks);
  const lowerText = text.toLowerCase();
  const words = countWords(text);
  const readingTimeMin = Math.max(1, Math.round(words / 200));

  const headings = article.blocks.filter((b) => b.type === "heading");
  const images = article.blocks.filter((b) => b.type === "image") as Extract<
    Block,
    { type: "image" }
  >[];
  const imagesWithoutAlt = images.filter((img) => !img.alt.trim()).length;
  const links = analyzeLinks(article.blocks);

  const keywordCount = keyword ? countOccurrences(lowerText, keyword) : 0;
  const keywordDensity = words > 0 && keyword ? (keywordCount / words) * 100 : 0;

  // ---------- Base ----------
  const titleLen = article.seo.metaTitle.length;
  checks.push({
    id: "meta-title",
    group: "base",
    label: "Balise title",
    status: titleLen >= 30 && titleLen <= 60 ? "good" : titleLen === 0 ? "bad" : "warning",
    message:
      titleLen === 0
        ? "Aucune balise title définie."
        : `${titleLen} caractères (idéal : 30-60).`,
  });

  const descLen = article.seo.metaDescription.length;
  checks.push({
    id: "meta-description",
    group: "base",
    label: "Méta description",
    status:
      descLen >= 120 && descLen <= 160 ? "good" : descLen === 0 ? "bad" : "warning",
    message:
      descLen === 0
        ? "Aucune méta description définie."
        : `${descLen} caractères (idéal : 120-160).`,
  });

  const slug = article.slug.trim();
  checks.push({
    id: "slug",
    group: "base",
    label: "Slug d'URL",
    status:
      slug && /^[a-z0-9-]+$/.test(slug) && slug.length <= 75
        ? "good"
        : slug
        ? "warning"
        : "bad",
    message: slug
      ? slug.length > 75
        ? "Slug un peu long, privilégiez la concision."
        : "Slug propre et lisible."
      : "Aucun slug défini.",
  });

  // ---------- Mot-clé principal ----------
  if (keyword) {
    checks.push({
      id: "kw-title",
      group: "keyword",
      label: "Mot-clé dans le title",
      status: article.seo.metaTitle.toLowerCase().includes(keyword) ? "good" : "bad",
      message: article.seo.metaTitle.toLowerCase().includes(keyword)
        ? "Le mot-clé apparaît dans la balise title."
        : "Ajoutez le mot-clé dans la balise title.",
    });
    checks.push({
      id: "kw-desc",
      group: "keyword",
      label: "Mot-clé dans la description",
      status: article.seo.metaDescription.toLowerCase().includes(keyword)
        ? "good"
        : "warning",
      message: article.seo.metaDescription.toLowerCase().includes(keyword)
        ? "Le mot-clé apparaît dans la méta description."
        : "Ajoutez le mot-clé dans la méta description.",
    });
    checks.push({
      id: "kw-slug",
      group: "keyword",
      label: "Mot-clé dans l'URL",
      status: slug.includes(keyword.replace(/\s+/g, "-")) ? "good" : "warning",
      message: slug.includes(keyword.replace(/\s+/g, "-"))
        ? "Le mot-clé apparaît dans le slug."
        : "Intégrez le mot-clé dans le slug.",
    });

    const firstParagraph = article.blocks.find((b) => b.type === "paragraph");
    const inIntro =
      firstParagraph &&
      firstParagraph.type === "paragraph" &&
      stripHtml(firstParagraph.html).toLowerCase().includes(keyword);
    checks.push({
      id: "kw-intro",
      group: "keyword",
      label: "Mot-clé dans l'introduction",
      status: inIntro ? "good" : "warning",
      message: inIntro
        ? "Le mot-clé apparaît dès l'introduction."
        : "Mentionnez le mot-clé dans le premier paragraphe.",
    });

    const inHeading = headings.some((h) =>
      h.type === "heading" ? h.text.toLowerCase().includes(keyword) : false
    );
    checks.push({
      id: "kw-heading",
      group: "keyword",
      label: "Mot-clé dans un sous-titre",
      status: inHeading ? "good" : "warning",
      message: inHeading
        ? "Le mot-clé apparaît dans au moins un sous-titre."
        : "Ajoutez le mot-clé dans un H2/H3.",
    });

    checks.push({
      id: "kw-density",
      group: "keyword",
      label: "Densité du mot-clé",
      status:
        keywordDensity >= 0.5 && keywordDensity <= 2.5
          ? "good"
          : keywordDensity === 0
          ? "bad"
          : "warning",
      message:
        keywordDensity === 0
          ? "Le mot-clé n'apparaît pas dans le contenu."
          : `Densité de ${keywordDensity.toFixed(1)}% (idéal : 0,5-2,5%).`,
    });
  } else {
    checks.push({
      id: "kw-missing",
      group: "keyword",
      label: "Mot-clé principal",
      status: "bad",
      message: "Définissez un mot-clé principal pour activer l'analyse ciblée.",
    });
  }

  // ---------- Structure ----------
  checks.push({
    id: "content-length",
    group: "structure",
    label: "Longueur du contenu",
    status: words >= 600 ? "good" : words >= 300 ? "warning" : "bad",
    message: `${words} mots (visez au moins 600 mots pour un article de fond).`,
  });

  checks.push({
    id: "headings",
    group: "structure",
    label: "Sous-titres",
    status: headings.length >= 2 ? "good" : headings.length === 1 ? "warning" : "bad",
    message:
      headings.length === 0
        ? "Ajoutez des sous-titres (H2/H3) pour structurer le contenu."
        : `${headings.length} sous-titre(s) détecté(s).`,
  });

  const hasFaq = article.blocks.some((b) => b.type === "faq");
  checks.push({
    id: "faq",
    group: "structure",
    label: "Bloc FAQ (données structurées)",
    status: hasFaq ? "good" : "warning",
    message: hasFaq
      ? "Un bloc FAQ enrichit vos résultats (rich snippet FAQPage)."
      : "Ajoutez un bloc FAQ pour cibler les extraits enrichis.",
  });

  // ---------- Lisibilité ----------
  const ratio = longSentenceRatio(text);
  checks.push({
    id: "sentence-length",
    group: "readability",
    label: "Longueur des phrases",
    status: ratio <= 0.25 ? "good" : ratio <= 0.4 ? "warning" : "bad",
    message: `${Math.round(ratio * 100)}% de phrases longues (>25 mots). Visez < 25%.`,
  });

  const paragraphs = article.blocks.filter((b) => b.type === "paragraph");
  const longParagraphs = paragraphs.filter((p) =>
    p.type === "paragraph" ? countWords(stripHtml(p.html)) > 150 : false
  ).length;
  checks.push({
    id: "paragraph-length",
    group: "readability",
    label: "Longueur des paragraphes",
    status: longParagraphs === 0 ? "good" : "warning",
    message:
      longParagraphs === 0
        ? "Paragraphes bien aérés."
        : `${longParagraphs} paragraphe(s) trop long(s) (>150 mots).`,
  });

  // ---------- Liens ----------
  checks.push({
    id: "internal-links",
    group: "links",
    label: "Liens internes",
    status: links.internal >= 1 ? "good" : "warning",
    message:
      links.internal >= 1
        ? `${links.internal} lien(s) interne(s) — bon pour le maillage.`
        : "Ajoutez au moins un lien interne pour renforcer le maillage.",
  });
  checks.push({
    id: "external-links",
    group: "links",
    label: "Liens externes",
    status: links.external >= 1 ? "good" : "warning",
    message:
      links.external >= 1
        ? `${links.external} lien(s) externe(s) vers des sources.`
        : "Citez au moins une source externe de qualité.",
  });

  // ---------- Médias ----------
  checks.push({
    id: "images",
    group: "media",
    label: "Images",
    status: images.length >= 1 ? "good" : "warning",
    message:
      images.length >= 1
        ? `${images.length} image(s) dans l'article.`
        : "Ajoutez au moins une image pour enrichir le contenu.",
  });
  if (images.length > 0) {
    checks.push({
      id: "image-alt",
      group: "media",
      label: "Texte alternatif des images",
      status: imagesWithoutAlt === 0 ? "good" : "bad",
      message:
        imagesWithoutAlt === 0
          ? "Toutes les images ont un texte alternatif."
          : `${imagesWithoutAlt} image(s) sans attribut alt.`,
    });
  }

  const hasCover = Boolean(article.coverImage.trim());
  checks.push({
    id: "og-image",
    group: "media",
    label: "Image de partage (Open Graph)",
    status: article.seo.ogImage.trim() || hasCover ? "good" : "warning",
    message:
      article.seo.ogImage.trim() || hasCover
        ? "Une image de partage social est définie."
        : "Ajoutez une image de couverture ou OG pour les partages.",
  });

  // ---------- Score ----------
  const weights: Record<CheckStatus, number> = { good: 1, warning: 0.5, bad: 0 };
  const total = checks.reduce((sum, c) => sum + weights[c.status], 0);
  const score = checks.length > 0 ? Math.round((total / checks.length) * 100) : 0;
  const grade: SeoReport["grade"] =
    score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";

  return {
    score,
    grade,
    checks,
    stats: {
      words,
      readingTimeMin,
      headings: headings.length,
      internalLinks: links.internal,
      externalLinks: links.external,
      images: images.length,
      imagesWithoutAlt,
      keywordDensity,
      keywordCount,
    },
  };
}
