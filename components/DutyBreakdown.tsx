'use client'

import { fmtCurrency, type DutyResult } from '@/lib/calculations'

export default function DutyBreakdown({ result }: { result: DutyResult }) {
  const bars = [
    { label: 'BCD',     amount: result.bcd,      color: 'bg-blue-500' },
    { label: 'SWS',     amount: result.sws,      color: 'bg-blue-300' },
    { label: 'AIDC',    amount: result.aidc,     color: 'bg-purple-400' },
    { label: 'IGST',    amount: result.igst,     color: 'bg-amber-500' },
    { label: 'Cess',    amount: result.compCess, color: 'bg-red-400' },
  ].filter(b => b.amount > 0)

  const maxAmount = Math.max(...bars.map(b => b.amount))

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-slate-900 mb-5">Duty Breakdown</h3>

      {/* Visual Bars */}
      <div className="space-y-3 mb-6">
        {bars.map(bar => (
          <div key={bar.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">{bar.label}</span>
              <span className="font-medium text-slate-900">{fmtCurrency(bar.amount)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                style={{ width: `${(bar.amount / maxAmount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Table Breakdown */}
      <div className="border border-slate-100 rounded-xl overflow-hidden">
        {result.breakdown
          .filter(item => item.label !== '─────────────────')
          .map((item, i) => (
            <div
              key={i}
              className={`flex justify-between items-start px-4 py-3 text-sm
                ${item.isTotal
                  ? 'bg-blue-600 text-white font-bold'
                  : item.highlight
                  ? 'bg-slate-50 font-semibold text-slate-900'
                  : 'border-b border-slate-50 text-slate-700'
                }`}
            >
              <div>
                <div className={item.isTotal ? 'text-white' : ''}>{item.label}</div>
                {item.note && (
                  <div className={`text-xs mt-0.5 ${item.isTotal ? 'text-blue-200' : 'text-slate-400'}`}>
                    {item.note}
                  </div>
                )}
              </div>
              <div className={`font-mono text-right ml-4 shrink-0 ${item.isTotal ? 'text-white text-base' : ''}`}>
                {item.amount === 0 ? '' : fmtCurrency(item.amount)}
              </div>
            </div>
          ))}
      </div>

      {/* FTA Savings */}
      {result.ftaSavings && result.ftaSavings > 0 && (
        <div className="mt-4 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-green-500 text-lg">💰</span>
          <div>
            <div className="font-semibold text-green-800 text-sm">
              FTA Saving: {fmtCurrency(result.ftaSavings)}
            </div>
            <div className="text-xs text-green-600 mt-0.5">
              vs. standard MFN duty rate
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 mt-4 leading-relaxed">
        * Rates as per Union Budget 2025-26. Calculation is indicative.
        Final duty assessed by customs officers may vary. Consult a licensed CHA for accuracy.
      </p>
    </div>
  )
}
