import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticleBySlug, getPublishedArticles } from "@/lib/store";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { articleJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/jsonld";
import { analyzeSeo } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article introuvable" };

  const title = article.seo.metaTitle || article.title;
  const description = article.seo.metaDescription || article.excerpt;
  const canonical =
    article.seo.canonicalUrl || `${SITE.url}/blog/${article.slug}`;
  const ogImage = article.seo.ogImage || article.coverImage;

  return {
    title,
    description,
    alternates: { canonical },
    robots: article.seo.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: article.publishedAt || undefined,
      modifiedTime: article.updatedAt,
      authors: article.author ? [article.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || article.status !== "published") notFound();

  const report = analyzeSeo(article);
  const faq = faqJsonLd(article);
  const related = (await getPublishedArticles())
    .filter((a) => a.id !== article.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      {/* Données structurées */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(article)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd(article)),
        }}
      />
      {faq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
        />
      )}

      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/blog" className="text-sm font-semibold text-brand">
            ← {SITE.name}
          </Link>
          <Link
            href={`/editor/${article.id}`}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Éditer
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10">
        <nav className="mb-4 text-sm text-gray-400">
          <Link href="/blog" className="hover:text-gray-600">
            Blog
          </Link>{" "}
          / <span className="text-gray-600">{article.title}</span>
        </nav>

        <h1 className="text-4xl font-extrabold leading-tight text-gray-900">
          {article.title}
        </h1>

        <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
          {article.author && <span>Par {article.author}</span>}
          <span>•</span>
          <span>{report.stats.readingTimeMin} min de lecture</span>
          {article.publishedAt && (
            <>
              <span>•</span>
              <time dateTime={article.publishedAt}>
                {new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            </>
          )}
        </div>

        {article.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            className="mt-8 w-full rounded-2xl"
          />
        )}

        <div className="mt-8">
          <ArticleRenderer blocks={article.blocks} />
        </div>
      </article>

      {related.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50 py-12">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-6 text-xl font-bold text-gray-900">
              À lire également
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((a) => (
                <Link
                  key={a.id}
                  href={`/blog/${a.slug}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md"
                >
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {a.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
