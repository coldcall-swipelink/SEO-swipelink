// Backend de stockage basé sur un fichier JSON local.
// Utilisé uniquement en développement quand DATABASE_URL n'est pas défini.
// Ne fonctionne PAS sur un hébergement serverless (filesystem en lecture seule).

import { promises as fs } from "fs";
import path from "path";
import { Article } from "./types";
import { seedArticles } from "./seed";
import type { ArticleStore } from "./store-types";

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

export const fileStore: ArticleStore = {
  async listArticles() {
    const articles = await readAll();
    return articles.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async getArticle(id) {
    const articles = await readAll();
    return articles.find((a) => a.id === id) ?? null;
  },
  async getArticleBySlug(slug) {
    const articles = await readAll();
    return articles.find((a) => a.slug === slug) ?? null;
  },
  async getPublishedArticles() {
    const articles = await readAll();
    return articles
      .filter((a) => a.status === "published")
      .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  },
  async createArticle(article) {
    const articles = await readAll();
    articles.push(article);
    await writeAll(articles);
    return article;
  },
  async updateArticle(id, patch) {
    const articles = await readAll();
    const index = articles.findIndex((a) => a.id === id);
    if (index === -1) return null;
    const updated: Article = {
      ...articles[index],
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    articles[index] = updated;
    await writeAll(articles);
    return updated;
  },
  async deleteArticle(id) {
    const articles = await readAll();
    const next = articles.filter((a) => a.id !== id);
    if (next.length === articles.length) return false;
    await writeAll(next);
    return true;
  },
};
