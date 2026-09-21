import { listArticles } from "./store";
import { Article } from "./types";

// Garde anti-doublon : un slug ne peut appartenir qu'à un seul article
// (brouillon ou publié). Renvoie l'article qui occupe déjà ce slug,
// hors article exclu (celui en cours de modification) et hors templates
// de catégorie (non publics).
export async function findSlugOwner(
  slug: string,
  excludeId?: string
): Promise<Article | null> {
  if (!slug) return null;
  const all = await listArticles();
  return (
    all.find(
      (a) =>
        a.id !== excludeId &&
        !a.isTemplate &&
        (a.slug === slug || a.published?.slug === slug)
    ) ?? null
  );
}

export function slugConflictMessage(owner: Article): string {
  const title = owner.title || owner.published?.title || owner.id;
  return `Ce slug est déjà utilisé par l'article « ${title} » (${owner.status === "published" ? "publié" : "brouillon"}). Choisissez un slug différent ou modifiez l'article existant.`;
}
