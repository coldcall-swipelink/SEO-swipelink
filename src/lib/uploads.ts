// Stockage d'images dans Postgres (fallback sans Vercel Blob).
// Les octets sont enregistrés dans une colonne bytea et servis via
// /api/uploads/[id]. Fonctionne partout où DATABASE_URL est disponible.

import { getSql } from "./db";

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS uploads (
          id           text PRIMARY KEY,
          content_type text NOT NULL,
          data         bytea NOT NULL,
          created_at   timestamptz NOT NULL DEFAULT now()
        )
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export async function putUpload(
  id: string,
  contentType: string,
  data: Buffer
): Promise<void> {
  await ensureSchema();
  const sql = getSql();
  await sql`
    INSERT INTO uploads (id, content_type, data)
    VALUES (${id}, ${contentType}, ${data})
  `;
}

export async function getUpload(
  id: string
): Promise<{ contentType: string; data: Buffer } | null> {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql<{ content_type: string; data: Buffer }[]>`
    SELECT content_type, data FROM uploads WHERE id = ${id} LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { contentType: rows[0].content_type, data: rows[0].data };
}
