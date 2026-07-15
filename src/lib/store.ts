// Point d'entrée unique de la persistance.
// Sélectionne automatiquement le backend :
//   - Postgres si DATABASE_URL est défini (production / Vercel)
//   - Fichier JSON local sinon (développement, sans base à configurer)
//
// Le reste de l'application n'importe QUE ce module : changer de backend
// n'impacte aucun autre fichier.

import { hasDatabase } from "./db";
import { fileStore } from "./store-file";
import { pgStore } from "./store-pg";
import type { ArticleStore } from "./store-types";

const store: ArticleStore = hasDatabase() ? pgStore : fileStore;

export const listArticles = store.listArticles.bind(store);
export const getArticle = store.getArticle.bind(store);
export const getArticleBySlug = store.getArticleBySlug.bind(store);
export const getPublishedArticles = store.getPublishedArticles.bind(store);
export const createArticle = store.createArticle.bind(store);
export const updateArticle = store.updateArticle.bind(store);
export const deleteArticle = store.deleteArticle.bind(store);
export const findTemplate = store.findTemplate.bind(store);
