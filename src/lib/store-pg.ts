// Backend de stockage Postgres (production / Vercel).
// Chaque article est stocké dans une colonne JSONB, ce qui évite toute migration
// de schéma quand le type Article évolue.

import { Article } from "./types";
import { seedArticles } from "./seed";
import { getSql, asJson } from "./db";
import type { ArticleStore } from "./store-types";

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS articles (
          id   text PRIMARY KEY,
          data jsonb NOT NULL
        )
      `;
      // Index pour les recherches par slug et statut.
      await sql`CREATE INDEX IF NOT EXISTS articles_slug_idx ON articles ((data->>'slug'))`;
      await sql`CREATE INDEX IF NOT EXISTS articles_status_idx ON articles ((data->>'status'))`;

      // Amorçage : uniquement si la table est vide.
      const [{ count }] = await sql<{ count: string }[]>`
        SELECT COUNT(*)::int AS count FROM articles
      `;
      if (Number(count) === 0) {
        for (const article of seedArticles()) {
          await sql`
            INSERT INTO articles (id, data) VALUES (${article.id}, ${sql.json(asJson(article))})
            ON CONFLICT (id) DO NOTHING
          `;
        }
      }
    })().catch((err) => {
      // On réinitialise pour permettre une nouvelle tentative à l'appel suivant.
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

async function rows(): Promise<Article[]> {
  const sql = getSql();
  const result = await sql<{ data: Article }[]>`SELECT data FROM articles`;
  return result.map((r) => r.data);
}

export const pgStore: ArticleStore = {
  async listArticles() {
    await ensureSchema();
    const all = await rows();
    return all
      .filter((a) => !a.isTemplate)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getArticle(id) {
    await ensureSchema();
    const sql = getSql();
    const result = await sql<{ data: Article }[]>`
      SELECT data FROM articles WHERE id = ${id} LIMIT 1
    `;
    return result[0]?.data ?? null;
  },

  async getArticleBySlug(slug) {
    await ensureSchema();
    const sql = getSql();
    const result = await sql<{ data: Article }[]>`
      SELECT data FROM articles WHERE data->>'slug' = ${slug} LIMIT 1
    `;
    return result[0]?.data ?? null;
  },

  async getPublishedArticles() {
    await ensureSchema();
    const sql = getSql();
    const result = await sql<{ data: Article }[]>`
      SELECT data FROM articles
      WHERE data->>'status' = 'published'
        AND COALESCE(data->>'isTemplate', 'false') <> 'true'
      ORDER BY data->>'publishedAt' DESC
    `;
    return result.map((r) => r.data);
  },

  async createArticle(article) {
    await ensureSchema();
    const sql = getSql();
    await sql`
      INSERT INTO articles (id, data)
      VALUES (${article.id}, ${sql.json(asJson(article))})
    `;
    return article;
  },

  async updateArticle(id, patch) {
    await ensureSchema();
    const sql = getSql();
    const existing = await this.getArticle(id);
    if (!existing) return null;
    const updated: Article = {
      ...existing,
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    await sql`
      UPDATE articles SET data = ${sql.json(asJson(updated))}
      WHERE id = ${id}
    `;
    return updated;
  },

  async deleteArticle(id) {
    await ensureSchema();
    const sql = getSql();
    const result = await sql`DELETE FROM articles WHERE id = ${id}`;
    return result.count > 0;
  },

  async findTemplate(categoryId) {
    await ensureSchema();
    const sql = getSql();
    const result = await sql<{ data: Article }[]>`
      SELECT data FROM articles
      WHERE COALESCE(data->>'isTemplate', 'false') = 'true'
        AND data->>'categoryId' = ${categoryId}
      LIMIT 1
    `;
    return result[0]?.data ?? null;
  },
};
