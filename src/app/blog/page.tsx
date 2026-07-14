import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles } from "@/lib/store";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: SITE.description,
};

export default async function BlogIndexPage() {
  const articles = await getPublishedArticles();

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            {SITE.name}
          </Link>
          <Link href="/dashboard" className="text-sm font-semibold text-brand">
            Espace de rédaction →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900">Le blog</h1>
        <p className="mt-2 text-gray-500">
          {articles.length} article{articles.length > 1 ? "s" : ""} publié
          {articles.length > 1 ? "s" : ""}.
        </p>

        <div className="mt-10 grid gap-8">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/blog/${a.slug}`}
              className="group grid gap-6 rounded-2xl border border-gray-100 p-4 transition hover:shadow-lg sm:grid-cols-[220px_1fr]"
            >
              {a.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.coverImage}
                  alt={a.title}
                  className="h-40 w-full rounded-xl object-cover sm:h-full"
                />
              ) : (
                <div className="h-40 rounded-xl bg-gray-100 sm:h-full" />
              )}
              <div className="flex flex-col justify-center">
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-brand">
                  {a.title}
                </h2>
                <p className="mt-2 text-gray-600">{a.excerpt}</p>
                <div className="mt-3 text-sm text-gray-400">
                  {a.author && <span>{a.author} • </span>}
                  {a.publishedAt &&
                    new Date(a.publishedAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </div>
              </div>
            </Link>
          ))}

          {articles.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-500">
              Aucun article publié pour le moment.{" "}
              <Link href="/dashboard" className="font-semibold text-brand">
                Créez le premier
              </Link>
              .
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
