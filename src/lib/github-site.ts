// Client minimal de l'API GitHub Contents pour écrire les pages du blog
// dans le repo du site vitrine (swipelink.fr).
//
// Configuration (variables d'environnement) :
//   SITE_GITHUB_TOKEN  Token GitHub à droits « Contents: read & write » sur le repo du site.
//   SITE_REPO          "owner/nom" du repo du site (ex. coldcall-swipelink/swipelink).
//   SITE_BRANCH        Branche cible (défaut : main).
//
// Sans ces variables, l'intégration est simplement désactivée (la
// publication interne à l'app continue de fonctionner).

const API = "https://api.github.com";

interface SiteRepoConfig {
  token: string;
  owner: string;
  name: string;
  branch: string;
}

function config(): SiteRepoConfig | null {
  const token = process.env.SITE_GITHUB_TOKEN;
  const repo = process.env.SITE_REPO;
  if (!token || !repo) return null;
  const [owner, name] = repo.split("/");
  if (!owner || !name) return null;
  return { token, owner, name, branch: process.env.SITE_BRANCH || "main" };
}

export function siteRepoConfigured(): boolean {
  return config() !== null;
}

function encodePath(path: string): string {
  return path
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

async function gh(
  cfg: SiteRepoConfig,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "swipelink-seo-publisher",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

export interface RepoFile {
  sha: string;
  content: string;
}

// Lit un fichier ; renvoie null s'il n'existe pas.
export async function getSiteFile(path: string): Promise<RepoFile | null> {
  const cfg = config();
  if (!cfg) throw new Error("Repo du site non configuré");
  const res = await gh(
    cfg,
    `/repos/${cfg.owner}/${cfg.name}/contents/${encodePath(path)}?ref=${cfg.branch}`,
    { method: "GET" }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET ${path} → ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { sha: string; content: string };
  return {
    sha: json.sha,
    content: Buffer.from(json.content, "base64").toString("utf8"),
  };
}

// Crée ou met à jour un fichier.
export async function putSiteFile(
  path: string,
  content: string,
  message: string
): Promise<void> {
  const cfg = config();
  if (!cfg) throw new Error("Repo du site non configuré");
  const existing = await getSiteFile(path);
  const res = await gh(
    cfg,
    `/repos/${cfg.owner}/${cfg.name}/contents/${encodePath(path)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: Buffer.from(content, "utf8").toString("base64"),
        branch: cfg.branch,
        ...(existing ? { sha: existing.sha } : {}),
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`GitHub PUT ${path} → ${res.status} ${await res.text()}`);
  }
}

// Supprime un fichier s'il existe (no-op sinon).
export async function deleteSiteFile(
  path: string,
  message: string
): Promise<void> {
  const cfg = config();
  if (!cfg) throw new Error("Repo du site non configuré");
  const existing = await getSiteFile(path);
  if (!existing) return;
  const res = await gh(
    cfg,
    `/repos/${cfg.owner}/${cfg.name}/contents/${encodePath(path)}`,
    {
      method: "DELETE",
      body: JSON.stringify({ message, sha: existing.sha, branch: cfg.branch }),
    }
  );
  if (!res.ok) {
    throw new Error(`GitHub DELETE ${path} → ${res.status} ${await res.text()}`);
  }
}
