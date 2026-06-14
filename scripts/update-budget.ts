/**
 * scripts/update-budget.ts
 *
 * Run AFTER the Union Budget (typically Feb 1) to update duty rates.
 * The OLD rate is archived to duty_history automatically, so the
 * "Rate History" section on each product page builds up year by year.
 *
 * USAGE:
 *  1. Edit NEW_BUDGET_YEAR, EFFECTIVE_FROM, and the UPDATES array below
 *  2. Run: npm run update:budget
 *  3. Redeploy: vercel --prod  (ISR pages revalidate within 24h anyway)
 */

import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import { dutyRates, dutyHistory } from '../db/schema'

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
const db = drizzle(client)

// ─── EDIT THESE AFTER EACH UNION BUDGET ───────────────────
const NEW_BUDGET_YEAR = '2026-27'
const EFFECTIVE_FROM  = new Date('2026-02-01')

const UPDATES: {
  hsCodeId:   string
  bcd:        number
  igst?:      number
  changeNote?: string
}[] = [
  // Example — uncomment and edit:
  // { hsCodeId: '8517.12.10', bcd: 15, changeNote: 'BCD cut from 20% to 15% to boost local assembly' },
]

async function main() {
  if (UPDATES.length === 0) {
    console.log('⚠️  UPDATES array is empty. Edit scripts/update-budget.ts first, then re-run.')
    process.exit(0)
  }

  let updated = 0

  for (const u of UPDATES) {
    const existing = await db.select().from(dutyRates).where(eq(dutyRates.hsCodeId, u.hsCodeId))
    const old = existing[0]

    if (!old) {
      console.log(`⚠️  ${u.hsCodeId} not found in duty_rates — skipping`)
      continue
    }

    // Archive the old rate
    await db.insert(dutyHistory).values({
      hsCodeId:      u.hsCodeId,
      bcd:           old.bcd,
      igst:          old.igst,
      budgetYear:    old.budgetYear,
      changeNote:    u.changeNote,
      effectiveFrom: old.effectiveFrom,
    })

    // Apply new rate
    await db.update(dutyRates)
      .set({
        bcd:           u.bcd,
        igst:          u.igst ?? old.igst,
        budgetYear:    NEW_BUDGET_YEAR,
        effectiveFrom: EFFECTIVE_FROM,
        updatedAt:     new Date(),
      })
      .where(eq(dutyRates.hsCodeId, u.hsCodeId))

    console.log(`✅ ${u.hsCodeId}: BCD ${old.bcd}% → ${u.bcd}%  (IGST ${old.igst}% → ${u.igst ?? old.igst}%)`)
    updated++
  }

  console.log(`\n✅ Done — ${updated}/${UPDATES.length} rates updated for Budget ${NEW_BUDGET_YEAR}.`)
  console.log('Next: vercel --prod\n')
  process.exit(0)
}

main().catch(err => { console.error(err); process.exit(1) })
