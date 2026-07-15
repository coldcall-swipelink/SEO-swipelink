import { NextRequest, NextResponse } from "next/server";
import { getArticle, updateArticle } from "@/lib/store";
import { contentSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

// Publie ou met à jour la version en ligne : fige le brouillon courant
// dans l'instantané publié. C'est la SEULE opération qui rend des
// modifications visibles publiquement.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getArticle(id);
  if (!existing) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  const updated = await updateArticle(id, {
    status: "published",
    published: contentSnapshot(existing),
    publishedAt: existing.publishedAt ?? new Date().toISOString(),
  });
  return NextResponse.json(updated);
}
