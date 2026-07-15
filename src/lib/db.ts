// Client Postgres partagé (postgres.js).
// Réutilise une seule instance entre les invocations pour rester compatible
// avec l'environnement serverless de Vercel (évite l'épuisement des connexions).

import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL n'est pas défini. Ajoutez la variable d'environnement pour activer Postgres."
    );
  }

  if (!globalThis.__sql) {
    globalThis.__sql = postgres(url, {
      // 1 connexion par instance : recommandé en serverless. Utilisez de préférence
      // l'URL « pooler » de votre fournisseur (Neon pooler / Supabase port 6543).
      max: 1,
      idle_timeout: 20,
      // Neon et Supabase exigent TLS ; le sslmode de l'URL est respecté.
      ssl: url.includes("sslmode=disable") ? false : "require",
    });
  }
  return globalThis.__sql;
}

export const hasDatabase = () => Boolean(process.env.DATABASE_URL);

// Cast sûr d'un objet sérialisable vers le type JSON attendu par postgres.js.
export const asJson = (value: unknown) => value as postgres.JSONValue;
