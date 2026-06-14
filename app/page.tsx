import Calculator from '@/components/Calculator'

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-600 to-blue-700 text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/40 border border-blue-400/40 rounded-full px-4 py-1.5 text-sm mb-5">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Updated for Union Budget 2025-26
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 leading-tight">
            India Import Duty Calculator
          </h1>
          <p className="text-blue-100 text-base sm:text-lg max-w-lg mx-auto">
            Calculate exact BCD + IGST + SWS on any product.
            Instant results. Free. No sign-up.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-2xl mx-auto px-4 -mt-6 pb-16">
        <Calculator />
      </section>

      {/* Stats Row */}
      <section className="bg-white border-y border-slate-100 py-8 px-4">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4 text-center">
          {[
            { value: '12,400+', label: 'HS Codes' },
            { value: '5,000+',  label: 'Products' },
            { value: '100%',    label: 'Free' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-blue-600">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-10">
          How Import Duty is Calculated
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              step:  '1',
              title: 'BCD on CIF Value',
              desc:  'Basic Customs Duty is charged on Cost + Insurance + Freight value.',
            },
            {
              step:  '2',
              title: 'Add Social Welfare Surcharge',
              desc:  'SWS = 10% of BCD. Always added on top of Basic Customs Duty.',
            },
            {
              step:  '3',
              title: 'IGST on Total',
              desc:  'GST is charged on CIF + BCD + SWS combined. Not just on CIF.',
            },
          ].map(s => (
            <div key={s.step} className="card p-6">
              <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl
                              flex items-center justify-center font-bold text-sm mb-4">
                {s.step}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Formula */}
        <div className="mt-8 bg-slate-900 text-slate-300 rounded-2xl p-6 font-mono text-sm">
          <div className="text-slate-500 text-xs mb-3 font-sans">Duty Formula</div>
          <div className="space-y-1">
            <div>BCD = CIF × BCD%</div>
            <div>SWS = BCD × 10%</div>
            <div>IGST = (CIF + BCD + SWS) × IGST%</div>
            <div className="border-t border-slate-700 pt-2 mt-2 text-white font-semibold">
              Total Duty = BCD + SWS + IGST
            </div>
            <div className="text-blue-400">
              Landed Cost = CIF + Total Duty
            </div>
          </div>
        </div>
      </section>

      {/* Popular Products */}
      <section className="bg-white border-t border-slate-100 py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Popular Searches</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Mobile Phone',     slug: 'mobile-phones',     duty: '~30%' },
              { name: 'Laptop',           slug: 'laptop-computers',  duty: '~22%' },
              { name: 'LED TV',           slug: 'led-tv',            duty: '~31%' },
              { name: 'Solar Panel',      slug: 'solar-panels',      duty: '~25%' },
              { name: 'Electric Vehicle', slug: 'electric-vehicles', duty: '~100%' },
              { name: 'Protein Powder',   slug: 'protein-powder',    duty: '~59%' },
              { name: 'Gold',             slug: 'gold-bars',         duty: '~18%' },
              { name: 'Bluetooth Speaker',slug: 'bluetooth-speaker', duty: '~30%' },
            ].map(p => (
              <a
                key={p.slug}
                href={`/duty/${p.slug}`}
                className="card p-4 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="font-medium text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                  {p.name}
                </div>
                <div className="text-xs text-slate-400 mt-1">Duty {p.duty}</div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
