import { NextRequest, NextResponse } from "next/server";
import { getArticle, updateArticle } from "@/lib/store";

export const dynamic = "force-dynamic";

// Retire l'article du site public (repasse en brouillon).
// L'instantané publié est conservé pour permettre une republication.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getArticle(id);
  if (!existing) {
    return NextResponse.json({ error: "Article introuvable" }, { status: 404 });
  }

  const updated = await updateArticle(id, { status: "draft" });
  return NextResponse.json(updated);
}
