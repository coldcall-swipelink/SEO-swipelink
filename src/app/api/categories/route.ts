import { NextRequest, NextResponse } from "next/server";
import { listCategories, createCategory } from "@/lib/store-categories";
import { findTemplate } from "@/lib/store";
import { Category } from "@/lib/types";
import { uniqueId } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await listCategories();
  // Indique si un template non vide existe pour chaque catégorie.
  const enriched = await Promise.all(
    categories.map(async (c) => {
      const tpl = await findTemplate(c.id);
      return { ...c, hasTemplate: !!tpl && tpl.blocks.length > 0 };
    })
  );
  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  let body: { name?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* corps vide */
  }
  const name = (body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 });
  }
  const now = new Date().toISOString();
  const category: Category = {
    id: uniqueId("cat_"),
    name,
    createdAt: now,
    updatedAt: now,
  };
  await createCategory(category);
  return NextResponse.json(category, { status: 201 });
}
