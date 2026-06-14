import {
  sqliteTable,
  text,
  real,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ─── HS Codes ─────────────────────────────────────────────
export const hsCodes = sqliteTable('hs_codes', {
  id:          text('id').primaryKey(),           // "8517.12.10"
  chapter:     text('chapter').notNull(),          // "85"
  heading:     text('heading').notNull(),          // "8517"
  description: text('description').notNull(),
  unit:        text('unit'),
  slug:        text('slug').notNull().unique(),    // "mobile-phones-smartphones"
  createdAt:   integer('created_at', { mode: 'timestamp' })
               .$defaultFn(() => new Date()),
}, (t) => ({
  chapterIdx: index('hs_chapter_idx').on(t.chapter),
  slugIdx:    index('hs_slug_idx').on(t.slug),
}))

// ─── Duty Rates ───────────────────────────────────────────
export const dutyRates = sqliteTable('duty_rates', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  hsCodeId:      text('hs_code_id').notNull().references(() => hsCodes.id),
  bcd:           real('bcd').notNull(),             // Basic Customs Duty %
  sws:           real('sws').default(10),            // Social Welfare Surcharge (10% of BCD)
  igst:          real('igst').notNull(),             // 0 / 5 / 12 / 18 / 28 %
  aidc:          real('aidc').default(0),            // Agri Infra Dev Cess %
  compCess:      real('comp_cess').default(0),       // Compensation Cess %
  budgetYear:    text('budget_year').notNull(),      // "2025-26"
  effectiveFrom: integer('effective_from', { mode: 'timestamp' }).notNull(),
  updatedAt:     integer('updated_at', { mode: 'timestamp' })
                 .$defaultFn(() => new Date()),
}, (t) => ({
  hsCodeIdx: uniqueIndex('duty_hs_code_idx').on(t.hsCodeId), // one current rate per HS code
}))

// ─── Products ─────────────────────────────────────────────
export const products = sqliteTable('products', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  name:          text('name').notNull(),             // "Bluetooth Speaker"
  slug:          text('slug').notNull().unique(),    // "bluetooth-speaker"
  aliases:       text('aliases'),                    // JSON: ["bt speaker", "wireless speaker"]
  category:      text('category').notNull(),         // "Electronics"
  hsCodeId:      text('hs_code_id').notNull().references(() => hsCodes.id),
  pageContent:   text('page_content'),               // AI or template generated
  contentSource: text('content_source'),             // "groq"|"gemini"|"template"
  metaTitle:     text('meta_title'),
  metaDesc:      text('meta_desc'),
  searchCount:   integer('search_count').default(0),
  createdAt:     integer('created_at', { mode: 'timestamp' })
                 .$defaultFn(() => new Date()),
}, (t) => ({
  slugIdx:     index('product_slug_idx').on(t.slug),
  categoryIdx: index('product_category_idx').on(t.category),
  hsCodeIdx:   index('product_hs_idx').on(t.hsCodeId),
}))

// ─── FTA Rates ────────────────────────────────────────────
export const ftaRates = sqliteTable('fta_rates', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  hsCodeId:      text('hs_code_id').notNull().references(() => hsCodes.id),
  country:       text('country').notNull(),           // "Vietnam"
  countryCode:   text('country_code').notNull(),      // "VN"
  ftaName:       text('fta_name').notNull(),          // "India-ASEAN FTA"
  rate:          real('rate').notNull(),               // Preferential BCD %
  conditions:    text('conditions'),
  effectiveFrom: integer('effective_from', { mode: 'timestamp' }).notNull(),
}, (t) => ({
  hsCodeIdx:       index('fta_hs_idx').on(t.hsCodeId),
  hsCountryUnique: uniqueIndex('fta_hs_country_idx').on(t.hsCodeId, t.countryCode), // one rate per HS+country
}))

// ─── Duty History ─────────────────────────────────────────
export const dutyHistory = sqliteTable('duty_history', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  hsCodeId:      text('hs_code_id').notNull().references(() => hsCodes.id),
  bcd:           real('bcd').notNull(),
  igst:          real('igst').notNull(),
  budgetYear:    text('budget_year').notNull(),
  changeNote:    text('change_note'),
  effectiveFrom: integer('effective_from', { mode: 'timestamp' }).notNull(),
})

// ─── Leads ────────────────────────────────────────────────
export const leads = sqliteTable('leads', {
  id:            integer('id').primaryKey({ autoIncrement: true }),
  email:         text('email').notNull(),
  phone:         text('phone'),
  productName:   text('product_name'),
  intent:        text('intent').notNull(), // "customs_clearance"|"freight"|"trade_finance"
  shipmentValue: real('shipment_value'),
  createdAt:     integer('created_at', { mode: 'timestamp' })
                 .$defaultFn(() => new Date()),
})

// ─── Relations ────────────────────────────────────────────
export const hsCodesRelations = relations(hsCodes, ({ one, many }) => ({
  dutyRate:  one(dutyRates, { fields: [hsCodes.id], references: [dutyRates.hsCodeId] }),
  products:  many(products),
  ftaRates:  many(ftaRates),
  history:   many(dutyHistory),
}))

export const productsRelations = relations(products, ({ one }) => ({
  hsCode: one(hsCodes, { fields: [products.hsCodeId], references: [hsCodes.id] }),
}))

// ─── Types ────────────────────────────────────────────────
export type HSCode    = typeof hsCodes.$inferSelect
export type DutyRate  = typeof dutyRates.$inferSelect
export type Product   = typeof products.$inferSelect
export type FTARate   = typeof ftaRates.$inferSelect
export type Lead      = typeof leads.$inferInsert
