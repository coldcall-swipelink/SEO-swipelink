import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Vérifie le mot de passe (CMS_PASSWORD) et pose le cookie d'accès au
// back-office. Voir src/middleware.ts pour la règle d'accès globale.
export async function POST(req: NextRequest) {
  const password = process.env.CMS_PASSWORD;
  if (!password) {
    return NextResponse.json(
      { error: "Protection désactivée (CMS_PASSWORD absent)" },
      { status: 400 }
    );
  }

  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    // corps invalide : traité comme mot de passe manquant
  }

  if (body.password !== password) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("cms_auth", password, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
  });
  return res;
}
