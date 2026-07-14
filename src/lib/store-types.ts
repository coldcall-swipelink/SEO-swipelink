// Contrat commun aux différents backends de stockage.
import { Article } from "./types";

export interface ArticleStore {
  listArticles(): Promise<Article[]>;
  getArticle(id: string): Promise<Article | null>;
  getArticleBySlug(slug: string): Promise<Article | null>;
  getPublishedArticles(): Promise<Article[]>;
  createArticle(article: Article): Promise<Article>;
  updateArticle(id: string, patch: Partial<Article>): Promise<Article | null>;
  deleteArticle(id: string): Promise<boolean>;
  // Article modèle (template) d'une catégorie.
  findTemplate(categoryId: string): Promise<Article | null>;
}
