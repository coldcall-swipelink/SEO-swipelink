// Helpers de lecture « côté public » : renvoient la version publiée
// (instantané) plutôt que le brouillon en cours d'édition.

import { getPublishedArticles } from "./store";
import { Article, toPublicView } from "./types";

// Liste des articles visibles publiquement, sous forme de vue publique.
export async function listPublicViews(): Promise<Article[]> {
  const articles = await getPublishedArticles();
  return articles.map(toPublicView);
}

// Recherche un article publié par son slug PUBLIÉ (celui de l'instantané).
export async function getPublicViewBySlug(
  slug: string
): Promise<Article | null> {
  const articles = await getPublishedArticles();
  const found = articles.find((a) => (a.published?.slug ?? a.slug) === slug);
  return found ? toPublicView(found) : null;
}
