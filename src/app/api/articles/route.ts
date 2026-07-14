import { NextRequest, NextResponse } from "next/server";
import { createArticle, listArticles } from "@/lib/store";
import { emptyArticle } from "@/lib/types";
import { uniqueId } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET() {
  const articles = await listArticles();
  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const now = new Date().toISOString();
  const id = uniqueId("art_");
  const base = emptyArticle(id, now);

  let body: Partial<typeof base> = {};
  try {
    body = await req.json();
  } catch {
    // corps vide autorisé : on crée un brouillon vierge
  }

  const article = { ...base, ...body, id, createdAt: now, updatedAt: now };
  await createArticle(article);
  return NextResponse.json(article, { status: 201 });
}
