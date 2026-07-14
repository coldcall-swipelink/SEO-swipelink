import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getArticle } from "@/lib/store";
import { ArticleRenderer } from "@/components/ArticleRenderer";
import { analyzeSeo } from "@/lib/seo";

export const dynamic = "force-dynamic";

// L'aperçu ne doit jamais être indexé.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Aperçu",
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  const report = analyzeSeo(article);
  const isDirty =
    article.status !== "published" ||
    !article.published ||
    JSON.stringify(article.published) !==
      JSON.stringify({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        coverImage: article.coverImage,
        author: article.author,
        blocks: article.blocks,
        seo: article.seo,
      });

  return (
    <div className="min-h-screen bg-white">
      {/* Bandeau d'aperçu */}
      <div className="sticky top-0 z-20 border-b border-amber-200 bg-amber-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-2.5 text-sm">
          <span className="font-medium text-amber-800">
            👁️ Aperçu —{" "}
            {article.status === "published"
              ? isDirty
                ? "brouillon avec modifications non publiées"
                : "version publiée"
              : "brouillon non publié"}
          </span>
          <Link
            href={`/editor/${article.id}`}
            className="font-semibold text-amber-900 underline"
          >
            Retour à l'éditeur
          </Link>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-4xl font-extrabold leading-tight text-gray-900">
          {article.title || "(Sans titre)"}
        </h1>

        <div className="mt-4 flex items-center gap-3 text-sm text-gray-500">
          {article.author && <span>Par {article.author}</span>}
          <span>•</span>
          <span>{report.stats.readingTimeMin} min de lecture</span>
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
    </div>
  );
}
