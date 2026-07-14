// Types partagés pour les articles et les blocs de contenu.

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "faq"
  | "cta"
  | "quote"
  | "list"
  | "code";

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

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  author: string;
  status: ArticleStatus;
  blocks: Block[];
  seo: ArticleSeo;
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
    status: "draft",
    blocks: [],
    seo: {
      metaTitle: "",
      metaDescription: "",
      focusKeyword: "",
      canonicalUrl: "",
      ogImage: "",
      noindex: false,
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
}
