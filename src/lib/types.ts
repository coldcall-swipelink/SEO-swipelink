// Types partagés pour les articles et les blocs de contenu.

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "faq"
  | "cta"
  | "button"
  | "quote"
  | "list"
  | "code"
  | "table";

// Style d'un bouton, entièrement personnalisable.
export interface ButtonStyle {
  bgColor: string; // couleur de fond (hex)
  textColor: string; // couleur du texte (hex)
  variant: "solid" | "outline";
  size: "sm" | "md" | "lg";
  radius: "none" | "sm" | "md" | "full";
  align: "left" | "center" | "right";
  fullWidth: boolean;
}

export function defaultButtonStyle(
  overrides: Partial<ButtonStyle> = {}
): ButtonStyle {
  return {
    bgColor: "#4f46e5",
    textColor: "#ffffff",
    variant: "solid",
    size: "md",
    radius: "md",
    align: "left",
    fullWidth: false,
    ...overrides,
  };
}

// Style de l'encart CTA (la carte elle-même), entièrement personnalisable.
export interface CtaStyle {
  bgColor: string; // couleur de fond de la carte (hex)
  borderColor: string; // couleur de la bordure (hex)
  showBorder: boolean; // afficher / masquer la bordure
  radius: "none" | "sm" | "md" | "lg" | "full"; // arrondi des coins
  padding: "sm" | "md" | "lg"; // marge interne
  align: "left" | "center" | "right"; // alignement du contenu (titre/texte/bouton)
  titleColor: string; // couleur du titre (hex)
  textColor: string; // couleur du texte d'accroche (hex)
}

// Défaut reproduisant l'apparence historique de l'encart dans l'app
// (fond indigo clair, coins très arrondis, contenu centré).
export function defaultCtaStyle(overrides: Partial<CtaStyle> = {}): CtaStyle {
  return {
    bgColor: "#eef2ff", // indigo-50
    borderColor: "#e0e7ff", // indigo-100
    showBorder: true,
    radius: "lg",
    padding: "md",
    align: "center",
    titleColor: "#111827", // gray-900
    textColor: "#4b5563", // gray-600
    ...overrides,
  };
}

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface HeadingBlock extends BaseBlock {
  type: "heading";
  level: 2 | 3 | 4;
  text: string;
}

export interface ParagraphBlock extends BaseBlock {
  type: "paragraph";
  // HTML enrichi (gras, italique, liens hypertexte)
  html: string;
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqBlock extends BaseBlock {
  type: "faq";
  title?: string;
  items: FaqItem[];
}

export interface CtaBlock extends BaseBlock {
  type: "cta";
  title: string;
  text: string;
  buttonLabel: string;
  buttonUrl: string;
  buttonNewTab?: boolean;
  buttonStyle?: ButtonStyle; // optionnel : défaut appliqué si absent
  cardStyle?: CtaStyle; // optionnel : défaut appliqué si absent (rétrocompat)
}

export interface ButtonBlock extends BaseBlock {
  type: "button";
  label: string;
  url: string;
  newTab: boolean;
  style: ButtonStyle;
}

export interface QuoteBlock extends BaseBlock {
  type: "quote";
  text: string;
  cite?: string;
}

export interface ListBlock extends BaseBlock {
  type: "list";
  ordered: boolean;
  items: string[];
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  language: string;
  code: string;
}

export interface TableBlock extends BaseBlock {
  type: "table";
  // Première ligne d'en-tête (colonnes). Longueur = nombre de colonnes.
  headers: string[];
  // Lignes de données ; chaque ligne a autant de cellules que d'en-têtes.
  rows: string[][];
  caption?: string; // légende optionnelle affichée sous le tableau
}

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | FaqBlock
  | CtaBlock
  | ButtonBlock
  | QuoteBlock
  | ListBlock
  | CodeBlock
  | TableBlock;

export type ArticleStatus = "draft" | "published";

export interface ArticleSeo {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  canonicalUrl: string;
  ogImage: string;
  noindex: boolean;
}

// Instantané figé du contenu tel qu'il est publié publiquement.
// Le brouillon (champs de premier niveau de Article) peut évoluer sans
// impacter cette version tant que l'utilisateur ne republie pas.
export interface PublishedContent {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  blocks: Block[];
  seo: ArticleSeo;
}

export interface Article {
  id: string;
  // --- Brouillon en cours d'édition ---
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  blocks: Block[];
  seo: ArticleSeo;
  // --- Statut & version publiée ---
  status: ArticleStatus;
  published: PublishedContent | null; // instantané visible publiquement
  // --- Classement ---
  categoryId?: string | null;
  isTemplate?: boolean; // true = article modèle d'une catégorie (non public)
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// Catégorie d'article, avec son template (article modèle).
export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export function emptyArticle(id: string, now: string): Article {
  return {
    id,
    title: "",
    slug: "",
    excerpt: "",
    coverImage: "",
    author: "",
    blocks: [],
    seo: {
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      canonicalUrl: "",
      ogImage: "",
      noindex: false,
    },
    status: "draft",
    published: null,
    categoryId: null,
    isTemplate: false,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
}

// Extrait l'instantané de contenu à partir du brouillon courant.
export function contentSnapshot(a: Article): PublishedContent {
  return {
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt,
    coverImage: a.coverImage,
    author: a.author,
    blocks: a.blocks,
    seo: a.seo,
  };
}

// Vue publique : superpose l'instantané publié sur la structure Article
// (repli sur le brouillon pour les articles hérités sans instantané).
export function toPublicView(a: Article): Article {
  const p = a.published ?? contentSnapshot(a);
  return { ...a, ...p };
}

export function contentEquals(a: PublishedContent, b: PublishedContent): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

// Duplique une liste de blocs en régénérant les identifiants (blocs + items FAQ),
// pour éviter toute collision de clés lors d'une création depuis un template.
export function cloneBlocksWithNewIds(
  blocks: Block[],
  newId: (prefix: string) => string
): Block[] {
  return blocks.map((b) => {
    const clone = JSON.parse(JSON.stringify(b)) as Block;
    clone.id = newId("blk_");
    if (clone.type === "faq") {
      clone.items = clone.items.map((it) => ({ ...it, id: newId("faq_") }));
    }
    return clone;
  });
}
