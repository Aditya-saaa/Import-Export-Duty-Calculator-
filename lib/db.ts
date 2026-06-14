import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@/db/schema'

// Singleton pattern — reuse connection across requests
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof createClient> | undefined
}

const client =
  globalForDb.client ??
  createClient({
    url:       process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb.client = client
}

export const db = drizzle(client, { schema })

// ─── Helpers ──────────────────────────────────────────────

// Get product with HS code + duty rate
export async function getProductBySlug(slug: string) {
  const result = await db.query.products.findFirst({
    where: (p, { eq }) => eq(p.slug, slug),
    with: {
      hsCode: {
        with: {
          dutyRate: true,
          ftaRates: true,
          history:  true,
        },
      },
    },
  })
  return result
}

// Get HS code with duty rate
export async function getHSCode(id: string) {
  return await db.query.hsCodes.findFirst({
    where: (h, { eq }) => eq(h.id, id),
    with: {
      dutyRate: true,
      products: { limit: 5 },
      ftaRates: true,
      history:  true,
    },
  })
}

// Get all products for sitemap / static generation
export async function getAllProductSlugs() {
  return await db.query.products.findMany({
    columns: { slug: true },
  })
}

// Search products by name (FTS5)
export async function searchProductsByName(query: string, limit = 8) {
  const results = await client.execute({
    sql: `
      SELECT
        p.id, p.name, p.slug, p.category,
        d.bcd, d.igst,
        p.hs_code_id,
        bm25(products_fts) as rank
      FROM products_fts
      JOIN products p ON products_fts.rowid = p.id
      LEFT JOIN duty_rates d ON p.hs_code_id = d.hs_code_id
      WHERE products_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `,
    args: [query + '*', limit],
  })
  return results.rows
}
