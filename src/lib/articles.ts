// Helpers de lecture « côté public » : renvoient la version publiée
// (instantané) plutôt que le brouillon en cours d'édition.

import { getPublishedArticles } from "./store";
import { Article, toPublicView } from "./types";

// Liste des articles visibles publiquement, sous forme de vue publique.
// Dédoublonnage par slug publié : si la base contient plusieurs articles
// publiés sur le même slug (doublons hérités), on n'en garde qu'un. Sans
// ça, la régénération de blog.html (rebuildIndex) réinjecterait une carte
// par doublon. La garde anti-doublon empêche d'en créer de nouveaux ; ce
// filtre neutralise ceux déjà présents.
export async function listPublicViews(): Promise<Article[]> {
  const articles = await getPublishedArticles();
  const seen = new Set<string>();
  const unique: Article[] = [];
  for (const a of articles) {
    const slug = a.published?.slug ?? a.slug;
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    unique.push(a);
  }
  return unique.map(toPublicView);
}

// Recherche un article publié par son slug PUBLIÉ (celui de l'instantané).
export async function getPublicViewBySlug(
  slug: string
): Promise<Article | null> {
  const articles = await getPublishedArticles();
  const found = articles.find((a) => (a.published?.slug ?? a.slug) === slug);
  return found ? toPublicView(found) : null;
}
