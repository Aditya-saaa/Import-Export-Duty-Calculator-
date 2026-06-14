import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from '@/db/schema'

// Singleton pattern — reuse connection across requests
const globalForDb = globalThis as unknown as {
  client: ReturnType<typeof createClient> | undefined
}

function getClient() {
  if (!globalForDb.client) {
    globalForDb.client = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }
  return globalForDb.client
}

export const db = drizzle(getClient(), { schema })

// ─── Helpers ──────────────────────────────────────────────

// Get product with HS code + duty rate
export async function getProductBySlug(slug: string) {
  return await db.query.products.findFirst({
    where: (p, { eq }) => eq(p.slug, slug),
    with: {
      hsCode: {
        with: {
          dutyRate: true,
          ftaRates: true,
          history: true,
        },
      },
    },
  })
}

// Get HS code with duty rate
export async function getHSCode(id: string) {
  return await db.query.hsCodes.findFirst({
    where: (h, { eq }) => eq(h.id, id),
    with: {
      dutyRate: true,
      products: { limit: 5 },
      ftaRates: true,
      history: true,
    },
  })
}

// Get all products
export async function getAllProductSlugs() {
  return await db.query.products.findMany({
    columns: {
      slug: true,
    },
  })
}

// Search products by name
export async function searchProductsByName(
  query: string,
  limit = 8
) {
  const results = await getClient().execute({
    sql: `
      SELECT
        p.id,
        p.name,
        p.slug,
        p.category,
        d.bcd,
        d.igst,
        p.hs_code_id
      FROM products p
      LEFT JOIN duty_rates d
        ON p.hs_code_id = d.hs_code_id
      WHERE LOWER(p.name) LIKE LOWER(?)
      ORDER BY p.name
      LIMIT ?
    `,
    args: [`%${query}%`, limit],
  })

  return results.rows
}
