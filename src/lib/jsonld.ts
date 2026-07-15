// Construction des données structurées Schema.org pour un article.
import { Article, FaqBlock } from "./types";
import { extractText } from "./seo";
import { SITE } from "./site";

export function articleJsonLd(article: Article) {
  const url = `${SITE.url}/blog/${article.slug}`;
  const image = article.seo.ogImage || article.coverImage || undefined;
  const description =
    article.seo.metaDescription || article.excerpt || extractText(article.blocks).slice(0, 200);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: article.title,
    description,
    image: image ? [image] : undefined,
    author: {
      "@type": "Person",
      name: article.author || SITE.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
    },
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt,
    url,
  };
}

export function faqJsonLd(article: Article) {
  const faqBlocks = article.blocks.filter(
    (b): b is FaqBlock => b.type === "faq"
  );
  const items = faqBlocks.flatMap((b) => b.items);
  if (items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function breadcrumbJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: SITE.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE.url}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `${SITE.url}/blog/${article.slug}`,
      },
    ],
  };
}
