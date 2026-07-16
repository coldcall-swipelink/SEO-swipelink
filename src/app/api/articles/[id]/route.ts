import { NextRequest, NextResponse } from "next/server";
import { deleteArticle, getArticle, updateArticle } from "@/lib/store";
import { syncUnpublishFromSite } from "@/lib/publish-site";
import { Article } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }
  return NextResponse.json(article);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let patch: Partial<Article> = {};
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  // Le PUT ne sert qu'à sauvegarder le brouillon. La publication (statut,
  // instantané publié, date) passe par les endpoints /publish et /unpublish.
  const updated = await updateArticle(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // On récupère l'article AVANT suppression : s'il était en ligne, il faut
  // aussi retirer sa page du site vitrine (sinon l'article reste visible
  // publiquement même après suppression dans l'app).
  const existing = await getArticle(id);
  if (!existing) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  const ok = await deleteArticle(id);
  if (!ok) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  // Supprimé du store d'abord, pour que la régénération de blog.html
  // (déclenchée par syncUnpublishFromSite) n'inclue plus cet article.
  let siteSync;
  if (existing.status === "published") {
    siteSync = await syncUnpublishFromSite(existing);
  }

  return NextResponse.json({ ok: true, siteSync });
}
