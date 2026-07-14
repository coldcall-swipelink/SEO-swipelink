import { NextRequest, NextResponse } from "next/server";
import { findTemplate, createArticle } from "@/lib/store";
import { listCategories } from "@/lib/store-categories";
import { emptyArticle } from "@/lib/types";
import { uniqueId } from "@/lib/slug";

export const dynamic = "force-dynamic";

// Renvoie le template (article modèle) de la catégorie, en le créant s'il n'existe pas.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let template = await findTemplate(id);

  if (!template) {
    const categories = await listCategories();
    const cat = categories.find((c) => c.id === id);
    if (!cat) {
      return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
    }
    const now = new Date().toISOString();
    const article = emptyArticle(uniqueId("tpl_"), now);
    article.isTemplate = true;
    article.categoryId = id;
    article.title = `Template — ${cat.name}`;
    template = await createArticle(article);
  }

  return NextResponse.json(template);
}
