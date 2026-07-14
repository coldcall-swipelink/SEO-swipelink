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
  | "code";

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

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | FaqBlock
  | CtaBlock
  | ButtonBlock
  | QuoteBlock
  | ListBlock
  | CodeBlock;

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
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
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
