/**
 * scripts/generate-content.ts
 *
 * Generates SEO page content for all products using the AI fallback chain.
 * Run ONCE. Content is stored permanently in DB. Never runs again for same product.
 *
 * Usage: npx tsx scripts/generate-content.ts
 *
 * Progress is saved — safe to interrupt and resume.
 */

import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { isNull, eq } from 'drizzle-orm'
import { products, dutyRates, hsCodes, ftaRates } from '../db/schema'
import { generateContent, sleep } from '../lib/content-gen'

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
const db = drizzle(client)

async function main() {
  // Fetch products that don't have content yet
  const pending = await db
    .select({
      id:       products.id,
      name:     products.name,
      category: products.category,
      hsCodeId: products.hsCodeId,
      bcd:      dutyRates.bcd,
      igst:     dutyRates.igst,
    })
    .from(products)
    .leftJoin(dutyRates, eq(products.hsCodeId, dutyRates.hsCodeId))
    .where(isNull(products.pageContent))
    .limit(500) // Process 500 at a time

  if (pending.length === 0) {
    console.log('✅ All products already have content!')
    process.exit(0)
  }

  console.log(`📝 Generating content for ${pending.length} products...\n`)
  console.log('Priority: Groq → Gemini → Cloudflare AI → Template\n')

  const stats = { groq: 0, gemini: 0, cloudflare: 0, template: 0, errors: 0 }
  let done = 0

  for (const product of pending) {
    try {
      // Get FTA info if available
      const ftaList = await db
        .select()
        .from(ftaRates)
        .where(eq(ftaRates.hsCodeId, product.hsCodeId))
        .limit(1)

      const bestFta = ftaList[0]

      const { content, source } = await generateContent({
        productName: product.name,
        hsCodeId:    product.hsCodeId,
        bcd:         product.bcd ?? 0,
        igst:        product.igst ?? 18,
        category:    product.category,
        ...(bestFta ? {
          ftaCountry: bestFta.country,
          ftaRate:    bestFta.rate,
          ftaName:    bestFta.ftaName,
        } : {}),
      })

      // Also generate meta description
      const effective = ((product.bcd ?? 0) + (product.bcd ?? 0) * 0.1 + (product.igst ?? 18)).toFixed(0)
      const metaDesc  = `Import duty on ${product.name} is ~${effective}% (BCD ${product.bcd}% + IGST ${product.igst}%). Calculate exact landed cost. HS Code ${product.hsCodeId}. Updated Budget 2025-26.`
      const metaTitle = `Import Duty on ${product.name} India 2025-26 — ~${effective}% Total`

      // Save to DB
      await db
        .update(products)
        .set({
          pageContent:   content,
          contentSource: source,
          metaTitle,
          metaDesc,
        })
        .where(eq(products.id, product.id))

      stats[source as keyof typeof stats]++
      done++

      process.stdout.write(
        `\r[${done}/${pending.length}] ${source.padEnd(10)} | ${product.name.substring(0, 40).padEnd(40)}`
      )

      // Rate limiting to respect free tiers
      // Groq: 14,400/day = 1 per 6 seconds to be safe
      // Template: instant, no limit
      if (source !== 'template') {
        await sleep(1200)
      }

    } catch (err) {
      stats.errors++
      console.error(`\n❌ Error for ${product.name}:`, err)
    }
  }

  console.log('\n\n── Summary ──────────────────────────')
  console.log(`✅ Total:     ${done}`)
  console.log(`🤖 Groq:      ${stats.groq}`)
  console.log(`🧠 Gemini:    ${stats.gemini}`)
  console.log(`☁️  Cloudflare: ${stats.cloudflare}`)
  console.log(`📄 Template:  ${stats.template}`)
  console.log(`❌ Errors:    ${stats.errors}`)
  console.log('─────────────────────────────────────\n')

  const remaining = pending.length - done
  if (remaining > 0) {
    console.log(`ℹ️  ${remaining} products failed. Run script again to retry.\n`)
  } else {
    console.log('🎉 All done! Run: npm run build\n')
  }

  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
