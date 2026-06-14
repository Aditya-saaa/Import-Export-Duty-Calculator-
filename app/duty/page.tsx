export const dynamic = 'force-dynamic'
import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { effectiveRate } from '@/lib/calculations'

export const metadata: Metadata = {
  title: 'All Products — Import Duty Rates India 2025-26',
  description:
    'Browse import duty rates for 5000+ products in India — electronics, ' +
    'automobiles, textiles, machinery and more. BCD + IGST breakdown for Budget 2025-26.',
}

export const revalidate = 86400

export default async function DutyDirectoryPage() {
  const allProducts = await db.query.products.findMany({
    with: { hsCode: { with: { dutyRate: true } } },
    orderBy: (p, { asc }) => [asc(p.category), asc(p.name)],
  })

  // Group by category
  const grouped = allProducts.reduce((acc, p) => {
    const cat = p.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {} as Record<string, typeof allProducts>)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
        Import Duty Rates — All Products
      </h1>
      <p className="text-slate-500 mb-8 text-sm">
        {allProducts.length} products · Updated for Budget 2025-26 ·
        Click any product for full breakdown + calculator
      </p>

      <div className="space-y-10">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              {category}
              <span className="text-xs font-normal text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                {items.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map(p => {
                const rate = p.hsCode?.dutyRate
                const eff  = rate ? effectiveRate(rate.bcd, rate.igst).toFixed(0) : '?'
                return (
                  <a
                    key={p.id}
                    href={`/duty/${p.slug}`}
                    className="card p-4 hover:border-blue-200 hover:shadow-md transition-all
                               flex justify-between items-center group"
                  >
                    <div>
                      <div className="font-medium text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">HS {p.hsCodeId}</div>
                    </div>
                    <span className="badge bg-blue-50 text-blue-600 font-semibold shrink-0 ml-3">
                      ~{eff}%
                    </span>
                  </a>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
