import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getProductBySlug, getAllProductSlugs } from '@/lib/db'
import { effectiveRate, fmtCurrency, fmt } from '@/lib/calculations'
import Calculator from '@/components/Calculator'

// ─── Static Generation ────────────────────────────────────
export async function generateStaticParams() {
  return []
}

export const dynamicParams = true

export const revalidate = 86400 // Rebuild pages every 24 hours

// ─── Dynamic Metadata ─────────────────────────────────────
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const product = await getProductBySlug(params.slug)
  if (!product) return {}

  const rate      = product.hsCode?.dutyRate
  const effective = rate ? effectiveRate(rate.bcd, rate.igst).toFixed(0) : '?'
  const title     = `Import Duty on ${product.name} India 2025-26 — ${effective}% Total`
  const desc      = `Custom duty on ${product.name}: BCD ${rate?.bcd ?? '?'}% + IGST ${rate?.igst ?? '?'}% = ~${effective}% effective. Calculate exact landed cost. HS Code ${product.hsCodeId}. Updated Budget 2025-26.`

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: 'website',
    },
    alternates: {
      canonical: `/duty/${params.slug}`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────
export default async function ProductDutyPage(
  { params }: { params: { slug: string } }
) {
  const product = await getProductBySlug(params.slug)
  if (!product) notFound()

  const rate    = product.hsCode?.dutyRate
  const ftaList = product.hsCode?.ftaRates ?? []
  const history = product.hsCode?.history ?? []

  const effective = rate
    ? effectiveRate(rate.bcd, rate.igst)
    : null

  // Example calculation for ₹1 lakh
  const exampleDuty   = effective ? Math.round(100000 * effective / 100) : null
  const exampleLanded = exampleDuty ? 100000 + exampleDuty : null

  // FAQ Schema for Google rich snippets
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is the import duty on ${product.name} in India?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Import duty on ${product.name} is ${rate?.bcd ?? '?'}% BCD + ${rate?.igst ?? '?'}% IGST = ~${effective?.toFixed(0) ?? '?'}% total effective duty as of Budget 2025-26. HS Code: ${product.hsCodeId}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the HS Code for ${product.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The HS Code for ${product.name} in India is ${product.hsCodeId} — ${product.hsCode?.description}.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the landed cost of ${product.name} worth ₹1 lakh?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `For a ₹1,00,000 CIF shipment, import duty is ~₹${exampleDuty?.toLocaleString('en-IN') ?? '?'}, making the landed cost ~₹${exampleLanded?.toLocaleString('en-IN') ?? '?'}.`,
        },
      },
    ],
  }

  return (
    <>
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="text-slate-400 text-sm mb-4">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            {' / '}
            <a href="/duty" className="hover:text-white transition-colors">Products</a>
            {' / '}
            <span className="text-slate-300">{product.name}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            Import Duty on {product.name} in India
          </h1>
          <p className="text-slate-300 text-sm">
            HS Code {product.hsCodeId} · Budget 2025-26 · {product.category}
          </p>

          {/* Quick Stats */}
          {rate && (
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[
                { label: 'BCD',           value: `${rate.bcd}%`,                 color: 'text-blue-300' },
                { label: 'IGST',          value: `${rate.igst}%`,                color: 'text-amber-300' },
                { label: 'Total Effective', value: `~${effective?.toFixed(0)}%`, color: 'text-green-300' },
              ].map(s => (
                <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-slate-400 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Calculator */}
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-5">
            Calculate Duty for {product.name}
          </h2>
          <Calculator />
        </section>

        {/* AI / Template Content */}
        {product.pageContent && (
          <section className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-3">
              About Importing {product.name}
            </h2>
            <p className="text-slate-600 leading-relaxed text-sm">
              {product.pageContent}
            </p>
          </section>
        )}

        {/* FTA Savings */}
        {ftaList.length > 0 && (
          <section className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              💰 Save on Duty with FTA
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              Import {product.name} from these countries at reduced BCD:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-slate-500 font-medium">Country</th>
                    <th className="text-left py-2 text-slate-500 font-medium">Agreement</th>
                    <th className="text-right py-2 text-slate-500 font-medium">BCD Rate</th>
                    <th className="text-right py-2 text-slate-500 font-medium">Saving vs MFN</th>
                  </tr>
                </thead>
                <tbody>
                  {ftaList.map(fta => (
                    <tr key={fta.id} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{fta.country}</td>
                      <td className="py-2 text-slate-500">{fta.ftaName}</td>
                      <td className="py-2 text-right text-green-600 font-semibold">{fta.rate}%</td>
                      <td className="py-2 text-right text-green-600">
                        {rate ? `↓ ${(rate.bcd - fta.rate).toFixed(0)}%` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Historical Rates */}
        {history.length > 0 && (
          <section className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Rate History</h2>
            <div className="space-y-3">
              {history.map(h => (
                <div key={h.id} className="flex items-center justify-between
                                           border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                  <div>
                    <div className="font-medium text-slate-800 text-sm">Budget {h.budgetYear}</div>
                    {h.changeNote && (
                      <div className="text-xs text-slate-400 mt-0.5">{h.changeNote}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="badge bg-slate-100 text-slate-600">
                      BCD {h.bcd}% · IGST {h.igst}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="card p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-5">
            {faqSchema.mainEntity.map((faq, i) => (
              <div key={i} className="border-b border-slate-50 pb-5 last:border-0 last:pb-0">
                <h3 className="font-semibold text-slate-800 text-sm mb-2">{faq.name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {faq.acceptedAnswer.text}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  )
}
