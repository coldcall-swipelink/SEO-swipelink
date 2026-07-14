import Link from "next/link";
import { SITE } from "@/lib/site";

export default function HomePage() {
  const features = [
    {
      title: "Éditeur par blocs",
      desc: "Texte enrichi, titres, images, FAQ, CTA, citations, listes et liens hypertexte.",
      icon: "🧱",
    },
    {
      title: "Analyse SEO temps réel",
      desc: "Score, longueur des balises, densité de mot-clé, lisibilité et maillage interne.",
      icon: "📈",
    },
    {
      title: "Données structurées",
      desc: "JSON-LD Article & FAQPage générés automatiquement pour des résultats enrichis.",
      icon: "🔎",
    },
    {
      title: "Métadonnées complètes",
      desc: "Title, méta description, canonical, Open Graph et Twitter Cards.",
      icon: "🏷️",
    },
    {
      title: "Sitemap & robots",
      desc: "sitemap.xml et robots.txt tenus à jour à chaque publication.",
      icon: "🗺️",
    },
    {
      title: "Aperçu Google",
      desc: "Visualisez le rendu de votre page dans les résultats avant de publier.",
      icon: "👁️",
    },
  ];

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold text-gray-900">{SITE.name}</span>
        <nav className="flex items-center gap-6 text-sm">
          <Link href="/blog" className="text-gray-600 hover:text-gray-900">
            Blog
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark"
          >
            Ouvrir l'app
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-brand">
          SEO on-page parfait, sans effort
        </span>
        <h1 className="mt-6 text-5xl font-extrabold leading-tight text-gray-900 sm:text-6xl">
          Rédigez, optimisez et publiez
          <br />
          des articles <span className="text-brand">parfaitement référencés</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          {SITE.description}
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-xl bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark"
          >
            Créer mon premier article
          </Link>
          <Link
            href="/blog"
            className="rounded-xl border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:border-gray-400"
          >
            Voir un exemple
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        {SITE.name} — première version.
      </footer>
    </div>
  );
}
