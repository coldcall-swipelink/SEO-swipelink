import { NextRequest, NextResponse } from "next/server";
import { createArticle, listArticles, findTemplate } from "@/lib/store";
import { Article, emptyArticle, cloneBlocksWithNewIds } from "@/lib/types";
import { uniqueId } from "@/lib/slug";
import { findSlugOwner, slugConflictMessage } from "@/lib/slug-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await listArticles();
  return NextResponse.json(articles);
}

interface CreateBody extends Partial<Article> {
  useTemplate?: boolean;
}

export async function POST(req: NextRequest) {
  const now = new Date().toISOString();
  const id = uniqueId("art_");
  const base = emptyArticle(id, now);

  let body: CreateBody = {};
  try {
    body = await req.json();
  } catch {
    // corps vide autorisé : on crée un brouillon vierge
  }

  const { useTemplate, ...fields } = body;
  const article: Article = { ...base, ...fields, id, createdAt: now, updatedAt: now };

  // Anti-doublon : refuse la création si le slug est déjà pris.
  const owner = await findSlugOwner(article.slug);
  if (owner) {
    return NextResponse.json(
      { error: slugConflictMessage(owner), conflictId: owner.id },
      { status: 409 }
    );
  }

  // Démarrage depuis le template de la catégorie : copie du contenu du modèle.
  if (useTemplate && article.categoryId) {
    const template = await findTemplate(article.categoryId);
    if (template) {
      article.blocks = cloneBlocksWithNewIds(template.blocks, uniqueId);
      // Reprend aussi l'ossature SEO du template (hors mot-clé, propre à l'article).
      article.seo = {
        ...template.seo,
        focusKeyword: article.seo.focusKeyword,
      };
      if (!article.excerpt) article.excerpt = template.excerpt;
    }
  }

  await createArticle(article);
  return NextResponse.json(article, { status: 201 });
}
