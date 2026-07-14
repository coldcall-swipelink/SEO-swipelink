// Configuration globale du site (à adapter au déploiement).
export const SITE = {
  name: "SwipeLink SEO",
  description:
    "La plateforme tout-en-un pour rédiger, optimiser et publier des articles de blog parfaitement référencés.",
  // URL de base utilisée pour les URLs canoniques, l'Open Graph et le sitemap.
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://swipelink.example.com",
  locale: "fr_FR",
  twitter: "@swipelink",
};
