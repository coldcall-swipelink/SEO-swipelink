// Client Google Search Console (Search Analytics), côté serveur.
//
// Authentification par compte de service Google (pas d'OAuth interactif) :
//   GSC_CLIENT_EMAIL  e-mail du compte de service (…@….iam.gserviceaccount.com)
//   GSC_PRIVATE_KEY   clé privée du compte de service (bloc -----BEGIN PRIVATE KEY-----)
//   GSC_SITE_URL      propriété Search Console : "sc-domain:swipelink.fr"
//                     (propriété « Domaine ») ou "https://swipelink.fr/" (préfixe d'URL)
//
// Sans ces variables, l'intégration est désactivée (l'API renvoie configured:false),
// exactement comme la fonction SERP. Le compte de service doit être ajouté comme
// utilisateur autorisé de la propriété dans Search Console (droit « Lecture » suffit).

import crypto from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const API = "https://searchconsole.googleapis.com/webmasters/v3";

interface GscConfig {
  clientEmail: string;
  privateKey: string;
  siteUrl: string;
}

function config(): GscConfig | null {
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  // La clé privée est souvent stockée avec des \n littéraux dans les variables
  // d'environnement : on les reconvertit en vrais retours à la ligne.
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const siteUrl = process.env.GSC_SITE_URL;
  if (!clientEmail || !privateKey || !siteUrl) return null;
  return { clientEmail, privateKey, siteUrl };
}

export function gscConfigured(): boolean {
  return config() !== null;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Jeton d'accès via l'assertion JWT signée RS256 du compte de service.
async function getAccessToken(cfg: GscConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: cfg.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;
  const signature = base64url(
    crypto.createSign("RSA-SHA256").update(signingInput).sign(cfg.privateKey)
  );
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Authentification Google refusée (${res.status}) ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("Jeton d'accès Google absent de la réponse.");
  return data.access_token;
}

export interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscQueryOptions {
  startDate: string; // AAAA-MM-JJ
  endDate: string; // AAAA-MM-JJ
  dimensions?: string[]; // ex. ["page"], ["query"], ["page","query"]
  rowLimit?: number;
  // Filtre optionnel sur une page précise (URL absolue).
  page?: string;
}

// Interroge l'API Search Analytics. Renvoie les lignes agrégées.
export async function querySearchAnalytics(
  opts: GscQueryOptions
): Promise<GscRow[]> {
  const cfg = config();
  if (!cfg) throw new Error("Search Console non configuré.");
  const token = await getAccessToken(cfg);

  const body: Record<string, unknown> = {
    startDate: opts.startDate,
    endDate: opts.endDate,
    dimensions: opts.dimensions ?? ["page"],
    rowLimit: opts.rowLimit ?? 1000,
  };
  if (opts.page) {
    body.dimensionFilterGroups = [
      { filters: [{ dimension: "page", operator: "equals", expression: opts.page }] },
    ];
  }

  const res = await fetch(
    `${API}/sites/${encodeURIComponent(cfg.siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API Search Console (${res.status}) ${txt.slice(0, 200)}`);
  }
  const data = (await res.json()) as { rows?: GscRow[] };
  return data.rows ?? [];
}

// Convertit une URL de propriété "sc-domain:…" ou "https://…" en origine
// d'URL utilisable pour reconstruire les liens des pages.
export function siteOrigin(): string {
  const raw = process.env.GSC_SITE_URL || "";
  if (raw.startsWith("sc-domain:")) return `https://${raw.slice("sc-domain:".length)}`;
  return raw.replace(/\/$/, "");
}
