import { NextRequest, NextResponse } from "next/server";
import { updateCategory, deleteCategory } from "@/lib/store-categories";
import { findTemplate, deleteArticle } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { name?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nom requis" }, { status: 400 });

  const updated = await updateCategory(id, { name });
  if (!updated) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Supprime aussi le template associé à la catégorie.
  const template = await findTemplate(id);
  if (template) await deleteArticle(template.id);

  const ok = await deleteCategory(id);
  if (!ok) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
