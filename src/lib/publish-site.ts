// Orchestration de la publication vers le site vitrine :
//  - publier   : écrit blog/<slug>.html et régénère la liste (blog.html)
//  - dépublier : supprime blog/<slug>.html et régénère la liste
//
// Renvoie toujours un résultat (jamais d'exception) pour que la publication
// interne à l'app ne casse pas si le site est momentanément injoignable.

import { listPublicViews } from "./articles";
import { listCategories } from "./store-categories";
import { Article, toPublicView } from "./types";
import { renderArticlePage, renderBlogCards } from "./site-render";
import {
  siteRepoConfigured,
  getSiteFile,
  putSiteFile,
  deleteSiteFile,
} from "./github-site";

const BLOG_DIR = process.env.SITE_BLOG_DIR || "blog";
const INDEX_FILE = process.env.SITE_INDEX_FILE || "blog.html";
const MARK_START = "<!-- ARTICLES:START -->";
const MARK_END = "<!-- ARTICLES:END -->";

export interface SiteSyncResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

function articleSlug(a: Article): string {
  return a.published?.slug ?? a.slug;
}

// Régénère la section des cartes dans blog.html à partir des articles publiés.
async function rebuildIndex(): Promise<void> {
  const [views, categories] = await Promise.all([
    listPublicViews(),
    listCategories().catch(() => []),
  ]);
  const catName: Record<string, string> = {};
  for (const c of categories) catName[c.id] = c.name;
  const tags: Record<string, string> = {};
  for (const v of views) {
    if (v.categoryId && catName[v.categoryId]) tags[v.id] = catName[v.categoryId];
  }

  const cards = renderBlogCards(views, tags);
  const index = await getSiteFile(INDEX_FILE);
  if (!index) {
    throw new Error(`${INDEX_FILE} introuvable dans le repo du site`);
  }
  const re = new RegExp(
    `${MARK_START}[\\s\\S]*?${MARK_END}`
  );
  if (!re.test(index.content)) {
    throw new Error(
      `Marqueurs "${MARK_START}" … "${MARK_END}" absents de ${INDEX_FILE}`
    );
  }
  const next = index.content.replace(
    re,
    `${MARK_START}\n${cards}\n${MARK_END}`
  );
  if (next !== index.content) {
    await putSiteFile(INDEX_FILE, next, "blog: met à jour la liste des articles");
  }
}

// Publie / met à jour un article sur le site.
export async function syncPublishToSite(
  article: Article
): Promise<SiteSyncResult> {
  if (!siteRepoConfigured()) {
    return {
      ok: false,
      skipped: true,
      reason:
        "Publication vers le site désactivée (variables SITE_GITHUB_TOKEN / SITE_REPO absentes).",
    };
  }
  try {
    const view = toPublicView(article);
    const slug = articleSlug(article);
    await putSiteFile(
      `${BLOG_DIR}/${slug}.html`,
      renderArticlePage(view),
      `blog: publie « ${view.title || slug} »`
    );
    await rebuildIndex();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// Retire un article du site (dépublication).
export async function syncUnpublishFromSite(
  article: Article
): Promise<SiteSyncResult> {
  if (!siteRepoConfigured()) {
    return {
      ok: false,
      skipped: true,
      reason:
        "Publication vers le site désactivée (variables SITE_GITHUB_TOKEN / SITE_REPO absentes).",
    };
  }
  try {
    const slug = articleSlug(article);
    await deleteSiteFile(
      `${BLOG_DIR}/${slug}.html`,
      `blog: retire « ${article.title || slug} »`
    );
    await rebuildIndex();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
