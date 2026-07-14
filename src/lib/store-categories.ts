// Persistance des catégories (Postgres si DATABASE_URL, sinon fichier JSON).
import { promises as fs } from "fs";
import path from "path";
import { Category } from "./types";
import { getSql, hasDatabase } from "./db";

// ---------- Backend fichier ----------
const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "categories.json");

async function fileReadAll(): Promise<Category[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Category[];
  } catch {
    return [];
  }
}
async function fileWriteAll(cats: Category[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(cats, null, 2), "utf8");
}

// ---------- Backend Postgres ----------
let schemaReady: Promise<void> | null = null;
async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSql();
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id   text PRIMARY KEY,
          data jsonb NOT NULL
        )
      `;
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

// ---------- API publique ----------
export async function listCategories(): Promise<Category[]> {
  if (hasDatabase()) {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql<{ data: Category }[]>`SELECT data FROM categories`;
    return rows.map((r) => r.data).sort((a, b) => a.name.localeCompare(b.name));
  }
  const cats = await fileReadAll();
  return cats.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCategory(cat: Category): Promise<Category> {
  if (hasDatabase()) {
    await ensureSchema();
    const sql = getSql();
    await sql`INSERT INTO categories (id, data) VALUES (${cat.id}, ${sql.json(
      cat as unknown as import("postgres").JSONValue
    )})`;
    return cat;
  }
  const cats = await fileReadAll();
  cats.push(cat);
  await fileWriteAll(cats);
  return cat;
}

export async function updateCategory(
  id: string,
  patch: Partial<Category>
): Promise<Category | null> {
  if (hasDatabase()) {
    await ensureSchema();
    const sql = getSql();
    const rows = await sql<{ data: Category }[]>`
      SELECT data FROM categories WHERE id = ${id} LIMIT 1
    `;
    if (rows.length === 0) return null;
    const updated: Category = {
      ...rows[0].data,
      ...patch,
      id,
      updatedAt: new Date().toISOString(),
    };
    await sql`UPDATE categories SET data = ${sql.json(
      updated as unknown as import("postgres").JSONValue
    )} WHERE id = ${id}`;
    return updated;
  }
  const cats = await fileReadAll();
  const i = cats.findIndex((c) => c.id === id);
  if (i === -1) return null;
  cats[i] = { ...cats[i], ...patch, id, updatedAt: new Date().toISOString() };
  await fileWriteAll(cats);
  return cats[i];
}

export async function deleteCategory(id: string): Promise<boolean> {
  if (hasDatabase()) {
    await ensureSchema();
    const sql = getSql();
    const res = await sql`DELETE FROM categories WHERE id = ${id}`;
    return res.count > 0;
  }
  const cats = await fileReadAll();
  const next = cats.filter((c) => c.id !== id);
  if (next.length === cats.length) return false;
  await fileWriteAll(next);
  return true;
}
