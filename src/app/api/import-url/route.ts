import { NextRequest, NextResponse } from "next/server";
import { htmlToArticle } from "@/lib/import-html";

export const dynamic = "force-dynamic";

const MAX_BYTES = 3_000_000; // 3 Mo de HTML max
const TIMEOUT_MS = 12_000;

// Bloque les hôtes internes/privés (protection SSRF de base). Contournable en
// local pour les tests via IMPORT_ALLOW_PRIVATE=1.
function isBlockedHost(hostname: string): boolean {
  if (process.env.IMPORT_ALLOW_PRIVATE === "1") return false;
  const h = hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (h === "::1" || h === "[::1]") return true;
  // Adresses IPv4 littérales dans des plages privées / de bouclage / lien-local.
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 127 || a === 10 || a === 0) return true;
    if (a === 169 && b === 254) return true; // lien-local (métadonnées cloud)
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  let url = "";
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(String(url).trim());
  } catch {
    return NextResponse.json({ error: "URL invalide." }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json(
      { error: "Seules les URLs http(s) sont acceptées." },
      { status: 400 }
    );
  }
  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json(
      { error: "Cette adresse n'est pas autorisée." },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(parsed.href, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // Un User-Agent de navigateur évite certains blocages.
        "User-Agent":
          "Mozilla/5.0 (compatible; SwipeLinkImporter/1.0; +https://swipelink.fr)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    clearTimeout(timer);
    return NextResponse.json(
      { error: "Impossible de récupérer la page (délai dépassé ou réseau)." },
      { status: 502 }
    );
  }
  clearTimeout(timer);

  if (!res.ok) {
    return NextResponse.json(
      { error: `La page a répondu ${res.status}.` },
      { status: 502 }
    );
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("html")) {
    return NextResponse.json(
      { error: "L'adresse ne renvoie pas une page HTML." },
      { status: 415 }
    );
  }

  // Lecture bornée en taille.
  const reader = res.body?.getReader();
  let html = "";
  if (reader) {
    const decoder = new TextDecoder();
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX_BYTES) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        break;
      }
      html += decoder.decode(value, { stream: true });
    }
    html += decoder.decode();
  } else {
    html = await res.text();
  }

  try {
    const article = htmlToArticle(html, res.url || parsed.href);
    if (article.blocks.length === 0 && !article.title) {
      return NextResponse.json(
        { error: "Aucun contenu d'article détecté sur la page." },
        { status: 422 }
      );
    }
    return NextResponse.json(article);
  } catch {
    return NextResponse.json(
      { error: "Échec de l'analyse de la page." },
      { status: 500 }
    );
  }
}
