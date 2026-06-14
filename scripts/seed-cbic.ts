/**
 * scripts/seed-cbic.ts
 *
 * Seeds the database with CBIC customs tariff data.
 *
 * HOW TO GET THE DATA:
 * 1. Go to: https://www.cbic.gov.in/resources/htdocs-cbec/customs/cst-2025-26/index.htm
 * 2. Download the Customs Tariff Excel file
 * 3. Place it at: ./data/cbic-tariff-2025-26.xlsx
 * 4. Run: npx tsx scripts/seed-cbic.ts
 *
 * OR use the sample data below to get started immediately.
 */

import 'dotenv/config'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { hsCodes, dutyRates, products, ftaRates } from '../db/schema'

const client = createClient({
  url:       process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})
const db = drizzle(client, { schema: { hsCodes, dutyRates, products, ftaRates } })

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80)
}

// ─── Sample Data (Top 50 Most-Searched Products) ──────────
// Replace this with full CBIC tariff data from Excel
const SAMPLE_DATA = [
  // [hsCodeId, description, bcd, igst, category, productName, aliases]
  ['8517.12.10', 'Mobile phones',                  20,  18, 'Electronics',      'Mobile Phone',        'smartphone,iphone,android phone'],
  ['8471.30.10', 'Portable computers (laptops)',   0,   18, 'Electronics',      'Laptop Computer',     'laptop,notebook,macbook'],
  ['8528.72.11', 'LED televisions upto 32 inch',  20,  18, 'Electronics',      'LED TV 32 inch',      'led tv,smart tv 32'],
  ['8528.72.12', 'LED televisions above 32 inch', 20,  18, 'Electronics',      'LED TV 43 inch',      'led tv 43,smart tv 43'],
  ['8518.21.00', 'Single loudspeakers',            20,  18, 'Electronics',      'Bluetooth Speaker',   'bt speaker,wireless speaker,portable speaker'],
  ['8518.30.10', 'Headphones and earphones',       20,  18, 'Electronics',      'Wireless Headphones', 'earphones,earbuds,airpods'],
  ['8471.60.10', 'Keyboards',                      10,  18, 'Electronics',      'Keyboard',            'mechanical keyboard,wireless keyboard'],
  ['8471.60.20', 'Computer mouse',                 10,  18, 'Electronics',      'Computer Mouse',      'wireless mouse,gaming mouse'],
  ['8443.31.00', 'Printers',                       10,  18, 'Electronics',      'Printer',             'inkjet printer,laser printer'],
  ['8504.40.90', 'Power banks (chargers)',         20,  18, 'Electronics',      'Power Bank',          'portable charger,mobile charger'],
  ['8507.60.00', 'Lithium-ion batteries',          10,  18, 'Electronics',      'Lithium Ion Battery', 'li-ion battery,battery pack'],
  ['8544.42.90', 'USB cables',                     20,  18, 'Electronics',      'USB Cable',           'type c cable,charging cable'],
  ['8521.90.20', 'Video cameras',                  20,  18, 'Electronics',      'Video Camera',        'camcorder,action camera,gopro'],
  ['9006.51.10', 'Digital cameras',                20,  18, 'Electronics',      'Digital Camera',      'dslr,mirrorless camera'],
  ['8525.80.10', 'Webcams',                        20,  18, 'Electronics',      'Webcam',              'web camera,hd webcam'],
  ['8541.43.00', 'Solar cells',                    0,   12, 'Energy',           'Solar Panel',         'solar module,pv panel,photovoltaic'],
  ['8704.10.10', 'Electric vehicles (goods)',      100, 28, 'Automobiles',      'Electric Vehicle',    'ev,electric car,tesla'],
  ['8703.80.90', 'Electric cars',                  100, 28, 'Automobiles',      'Electric Car',        'electric automobile,battery vehicle'],
  ['8708.99.00', 'Auto parts',                     15,  28, 'Automobiles',      'Car Spare Parts',     'automobile parts,car accessories'],
  ['2106.90.99', 'Protein supplements',            30,  18, 'Health & Fitness', 'Protein Powder',      'whey protein,protein supplement,bodybuilding supplement'],
  ['2106.10.00', 'Protein concentrates',           30,  18, 'Health & Fitness', 'Whey Protein',        'whey,casein protein,protein shake'],
  ['9506.62.00', 'Sports equipment (balls)',       30,  18, 'Sports',           'Sports Equipment',    'fitness equipment,gym equipment'],
  ['9506.91.00', 'Gym & fitness equipment',        30,  18, 'Sports',           'Gym Equipment',       'treadmill,exercise bike,dumbbells'],
  ['7108.12.00', 'Gold bars',                      15,  3,  'Precious Metals',  'Gold Bar',            'gold bullion,24k gold'],
  ['7113.19.10', 'Gold jewellery',                 15,  3,  'Precious Metals',  'Gold Jewellery',      'gold jewelry,gold necklace,gold bracelet'],
  ['7102.31.00', 'Diamonds (processed)',           0,   0.25,'Precious Metals', 'Diamond',             'processed diamond,cut diamond'],
  ['6109.10.90', 'Cotton T-shirts',                20,  5,  'Textiles',         'Cotton T-Shirt',      'tshirt,cotton shirt,garment'],
  ['6203.42.90', 'Jeans / denim trousers',         20,  12, 'Textiles',         'Jeans',               'denim,trousers,pants'],
  ['6402.99.90', 'Sports shoes',                   25,  18, 'Footwear',         'Sports Shoes',        'running shoes,sneakers,nike,adidas'],
  ['6403.99.90', 'Leather shoes',                  25,  18, 'Footwear',         'Leather Shoes',       'formal shoes,dress shoes'],
  ['8414.51.10', 'Ceiling fans',                   20,  18, 'Home Appliances',  'Ceiling Fan',         'electric fan,room fan'],
  ['8415.10.10', 'Air conditioners (split)',       20,  28, 'Home Appliances',  'Air Conditioner',     'ac,split ac,inverter ac'],
  ['8418.10.10', 'Refrigerators',                  20,  18, 'Home Appliances',  'Refrigerator',        'fridge,double door fridge'],
  ['8450.11.00', 'Washing machines',               20,  18, 'Home Appliances',  'Washing Machine',     'front load,top load washing machine'],
  ['8516.50.00', 'Microwave ovens',                20,  18, 'Home Appliances',  'Microwave Oven',      'microwave,oven'],
  ['8516.60.10', 'Ovens',                          20,  28, 'Home Appliances',  'Oven',                'electric oven,baking oven'],
  ['8509.40.10', 'Food grinders & mixers',         20,  18, 'Home Appliances',  'Mixer Grinder',       'blender,food processor,juicer'],
  ['8509.80.00', 'Vacuum cleaners',                20,  18, 'Home Appliances',  'Vacuum Cleaner',      'hoover,robot vacuum,dyson'],
  ['8211.51.00', 'Kitchen knives',                 20,  18, 'Kitchenware',      'Kitchen Knife Set',   'chef knife,knife set'],
  ['7323.99.00', 'Cookware',                       20,  18, 'Kitchenware',      'Cookware Set',        'pots and pans,cooking set'],
  ['9401.61.00', 'Chairs (upholstered)',           25,  18, 'Furniture',        'Office Chair',        'ergonomic chair,gaming chair'],
  ['9403.20.10', 'Steel furniture',                25,  18, 'Furniture',        'Office Desk',         'study table,computer desk'],
  ['3004.90.99', 'Medicines (pharma)',             10,  12, 'Pharmaceuticals',  'Medicines',           'pharmaceutical drugs,tablets'],
  ['3006.60.00', 'Chemical contraceptives',        0,   0,  'Pharmaceuticals',  'Medical Devices',     'medical equipment,healthcare'],
  ['8419.89.90', 'Industrial machinery',           7.5, 18, 'Machinery',        'Industrial Machinery','manufacturing equipment,factory machine'],
  ['8479.89.90', 'Other machinery',                7.5, 18, 'Machinery',        'CNC Machine',         'cnc,machining center'],
  ['8802.40.00', 'Aircraft',                       0,   0,  'Aviation',         'Aircraft',            'airplane,helicopter'],
  ['8901.10.00', 'Cargo ships',                    0,   5,  'Marine',           'Ship',                'vessel,cargo ship'],
  ['9101.11.00', 'Wristwatches (mechanical)',      20,  18, 'Watches',          'Luxury Watch',        'rolex,omega,mechanical watch'],
  ['3401.11.10', 'Toilet soaps',                   100, 18, 'FMCG',             'Imported Soap',       'luxury soap,imported cosmetics'],
] as const

// ─── FTA Preferential Rates (Sample) ──────────────────────
// Real rates must be sourced per-agreement from CBIC FTA notifications.
// These illustrate the FEATURE — replace with actual scheduled rates.
// [hsCodeId, country, countryCode, ftaName, preferentialBCD, conditions]
const FTA_DATA = [
  ['8517.12.10', 'Vietnam',   'VN', 'India-ASEAN FTA (AIFTA)', 0,  'Requires Certificate of Origin (Form AI)'],
  ['8518.30.10', 'Vietnam',   'VN', 'India-ASEAN FTA (AIFTA)', 5,  'Requires Certificate of Origin (Form AI)'],
  ['8518.21.00', 'Vietnam',   'VN', 'India-ASEAN FTA (AIFTA)', 5,  'Requires Certificate of Origin (Form AI)'],
  ['8528.72.12', 'Vietnam',   'VN', 'India-ASEAN FTA (AIFTA)', 10, 'Requires Certificate of Origin (Form AI)'],
  ['8504.40.90', 'Singapore', 'SG', 'India-ASEAN FTA (AIFTA)', 5,  'Requires Certificate of Origin (Form AI)'],
] as const

async function main() {
  console.log('🌱 Seeding database...\n')

  // First, create FTS5 virtual table if it doesn't exist
  await client.execute(`
    CREATE VIRTUAL TABLE IF NOT EXISTS products_fts
    USING fts5(name, aliases, content=products, content_rowid=id)
  `)

  await client.execute(`
    CREATE TRIGGER IF NOT EXISTS products_ai
    AFTER INSERT ON products
    BEGIN
      INSERT INTO products_fts(rowid, name, aliases)
      VALUES (new.id, new.name, new.aliases);
    END
  `)

  let seeded = 0

  for (const row of SAMPLE_DATA) {
    const [id, desc, bcd, igst, category, productName, aliases] = row

    const hsSlug      = slugify(desc)
    const productSlug = slugify(productName)
    const chapter     = id.substring(0, 2)
    const heading     = id.substring(0, 4).replace('.', '')

    try {
      // Insert HS Code
      await db.insert(hsCodes).values({
        id,
        chapter,
        heading,
        description: desc,
        slug:        hsSlug,
      }).onConflictDoNothing()

      // Insert Duty Rate
      await db.insert(dutyRates).values({
        hsCodeId:      id,
        bcd,
        igst,
        budgetYear:    '2025-26',
        effectiveFrom: new Date('2025-02-01'),
      }).onConflictDoNothing()

      // Insert Product
      await db.insert(products).values({
        name:     productName,
        slug:     productSlug,
        aliases,
        category,
        hsCodeId: id,
      }).onConflictDoNothing()

      seeded++
      process.stdout.write(`\r✅ Seeded ${seeded}/${SAMPLE_DATA.length}: ${productName}`)

    } catch (err) {
      console.error(`\n❌ Error seeding ${productName}:`, err)
    }
  }

  // ─── Seed FTA Rates ──────────────────────────────────────
  let ftaSeeded = 0
  for (const [hsCodeId, country, countryCode, ftaName, rate, conditions] of FTA_DATA) {
    try {
      await db.insert(ftaRates).values({
        hsCodeId,
        country,
        countryCode,
        ftaName,
        rate,
        conditions,
        effectiveFrom: new Date('2025-02-01'),
      }).onConflictDoNothing()
      ftaSeeded++
    } catch (err) {
      console.error(`\n❌ Error seeding FTA rate ${hsCodeId}/${countryCode}:`, err)
    }
  }
  console.log(`\n✅ Seeded ${ftaSeeded} FTA preferential rates.`)

  console.log(`\n\n✅ Done! Seeded ${seeded} products.\n`)
  console.log('Next steps:')
  console.log('  1. Run: npx tsx scripts/generate-content.ts')
  console.log('  2. Check your DB: npm run db:studio')
  console.log('  3. Start dev server: npm run dev\n')
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
