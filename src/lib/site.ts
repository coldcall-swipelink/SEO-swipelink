// Configuration globale du site (à adapter au déploiement).
export const SITE = {
  name: "SwipeLink SEO",
  description:
    "La plateforme tout-en-un pour rédiger, optimiser et publier des articles de blog parfaitement référencés.",
  // URL de base utilisée pour les URLs canoniques, l'Open Graph et le sitemap.
  // Le blog est servi sous ce domaine, à /blog (ex. https://swipelink.fr/blog/mon-article).
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://swipelink.fr",
  locale: "fr_FR",
  twitter: "@swipelink",
};
