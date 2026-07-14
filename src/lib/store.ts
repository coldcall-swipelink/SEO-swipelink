// Couche de persistance simple basée sur un fichier JSON.
// Facile à remplacer par une vraie base de données plus tard : il suffit de
// réimplémenter les fonctions exportées ci-dessous.

import { promises as fs } from "fs";
import path from "path";
import { Article } from "./types";
import { seedArticles } from "./seed";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "articles.json");

async function ensureFile(): Promise<void> {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(seedArticles(), null, 2), "utf8");
  }
}

async function readAll(): Promise<Article[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw) as Article[];
  } catch {
    return [];
  }
}

async function writeAll(articles: Article[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(articles, null, 2), "utf8");
}

export async function listArticles(): Promise<Article[]> {
  const articles = await readAll();
  return articles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getArticle(id: string): Promise<Article | null> {
  const articles = await readAll();
  return articles.find((a) => a.id === id) ?? null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await readAll();
  return articles.find((a) => a.slug === slug) ?? null;
}

export async function getPublishedArticles(): Promise<Article[]> {
  const articles = await readAll();
  return articles
    .filter((a) => a.status === "published")
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export async function createArticle(article: Article): Promise<Article> {
  const articles = await readAll();
  articles.push(article);
  await writeAll(articles);
  return article;
}

export async function updateArticle(
  id: string,
  patch: Partial<Article>
): Promise<Article | null> {
  const articles = await readAll();
  const index = articles.findIndex((a) => a.id === id);
  if (index === -1) return null;
  const updated: Article = {
    ...articles[index],
    ...patch,
    id, // l'id ne change jamais
    updatedAt: new Date().toISOString(),
  };
  articles[index] = updated;
  await writeAll(articles);
  return updated;
}

export async function deleteArticle(id: string): Promise<boolean> {
  const articles = await readAll();
  const next = articles.filter((a) => a.id !== id);
  if (next.length === articles.length) return false;
  await writeAll(next);
  return true;
}
