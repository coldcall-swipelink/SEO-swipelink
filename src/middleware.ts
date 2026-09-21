import { NextRequest, NextResponse } from "next/server";

// Protection d'accès de l'app (activée seulement si CMS_PASSWORD est défini) :
//  - le blog public et les images restent accessibles à tous ;
//  - le back-office (dashboard, éditeur, API) exige le cookie posé par /login ;
//  - les intégrations (robot de publication) passent par l'en-tête X-Api-Key
//    comparé à ARTICLES_API_KEY, sur les routes /api uniquement.
// Sans CMS_PASSWORD, l'app se comporte exactement comme avant (tout ouvert).

const PUBLIC_PREFIXES = [
  "/blog", // pages publiques du blog interne
  "/api/uploads", // images servies au site vitrine (swipelink.fr)
  "/login",
  "/api/login",
  "/robots.txt",
  "/sitemap.xml",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export function middleware(req: NextRequest) {
  const password = process.env.CMS_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  // Intégrations : clé API dédiée, valable uniquement sur l'API.
  const apiKey = process.env.ARTICLES_API_KEY;
  if (
    pathname.startsWith("/api/") &&
    apiKey &&
    req.headers.get("x-api-key") === apiKey
  ) {
    return NextResponse.next();
  }

  // Humains : cookie de session posé par /login.
  if (req.cookies.get("cms_auth")?.value === password) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Tout sauf les assets générés par Next (le reste est filtré dans le code).
  matcher: ["/((?!_next/static|_next/image).*)"],
};
