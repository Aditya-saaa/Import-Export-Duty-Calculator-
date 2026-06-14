'use client'

import { useState, useCallback } from 'react'
import { calculateDuty, fmtCurrency, fmt, type DutyResult } from '@/lib/calculations'
import DutyBreakdown from './DutyBreakdown'
import ProductSearch from './ProductSearch'

interface SelectedProduct {
  name:    string
  slug:    string
  hsCodeId: string
  bcd:     number
  igst:    number
}

const COUNTRIES = [
  { code: 'DEFAULT', name: 'Select country (optional)' },
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'AE', name: '🇦🇪 UAE' },
  { code: 'VN', name: '🇻🇳 Vietnam (ASEAN FTA)' },
  { code: 'TH', name: '🇹🇭 Thailand (ASEAN FTA)' },
  { code: 'SG', name: '🇸🇬 Singapore (ASEAN FTA)' },
  { code: 'JP', name: '🇯🇵 Japan (CEPA)' },
  { code: 'KR', name: '🇰🇷 South Korea (CEPA)' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'DE', name: '🇩🇪 Germany' },
]

export default function Calculator() {
  const [cifValue,         setCifValue]         = useState('')
  const [selectedProduct,  setSelectedProduct]  = useState<SelectedProduct | null>(null)
  const [manualHSCode,     setManualHSCode]     = useState('')
  const [manualBCD,        setManualBCD]        = useState('')
  const [manualIGST,       setManualIGST]       = useState('18')
  const [country,          setCountry]          = useState('DEFAULT')
  const [result,           setResult]           = useState<DutyResult | null>(null)
  const [mode,             setMode]             = useState<'search' | 'manual'>('search')
  const [showLeadModal,    setShowLeadModal]    = useState(false)
  const [calculating,      setCalculating]      = useState(false)

  const handleCalculate = useCallback(async () => {
    const cif = parseFloat(cifValue.replace(/,/g, ''))
    if (!cif || cif <= 0) return

    // If a product + a country are both selected, ask the server —
    // it checks for an FTA preferential rate for that HS code + country.
    if (mode === 'search' && selectedProduct && country !== 'DEFAULT') {
      setCalculating(true)
      try {
        const res = await fetch('/api/calculate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cifValue:    cif,
            hsCodeId:    selectedProduct.hsCodeId,
            countryCode: country,
          }),
        })
        const data: { result?: DutyResult; error?: string } = await res.json()
        if (data.result) {
          setResult(data.result)
          if (data.result.totalDuty > 50000) {
            setTimeout(() => setShowLeadModal(true), 1500)
          }
          return
        }
      } catch {
        // Network hiccup — fall through to client-side calc below
      } finally {
        setCalculating(false)
      }
    }

    // Default: instant client-side calculation (no FTA, or manual mode)
    const bcd  = selectedProduct ? selectedProduct.bcd  : parseFloat(manualBCD)
    const igst = selectedProduct ? selectedProduct.igst : parseFloat(manualIGST)

    if (isNaN(bcd) || isNaN(igst)) return

    const r = calculateDuty({ cifValue: cif, bcdRate: bcd, igstRate: igst })
    setResult(r)

    // Show lead modal for high-value shipments
    if (r.totalDuty > 50000) {
      setTimeout(() => setShowLeadModal(true), 1500)
    }
  }, [cifValue, selectedProduct, manualBCD, manualIGST, mode, country])

  const handleCifChange = (val: string) => {
    // Allow only numbers and commas
    const clean = val.replace(/[^0-9.]/g, '')
    setCifValue(clean)
    setResult(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Mode Toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => { setMode('search'); setResult(null) }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === 'search'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Search by Product Name
        </button>
        <button
          onClick={() => { setMode('manual'); setResult(null) }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual'
              ? 'bg-white shadow-sm text-slate-900'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Enter HS Code Manually
        </button>
      </div>

      <div className="card p-6 space-y-5">

        {/* Product Selection */}
        {mode === 'search' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Product Name
            </label>
            <ProductSearch
              onSelect={(p) => {
                setSelectedProduct(p)
                setResult(null)
              }}
            />
            {selectedProduct && (
              <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm text-blue-700">
                  <strong>{selectedProduct.name}</strong>
                  {' '}— HS {selectedProduct.hsCodeId}
                  {' '}· BCD {selectedProduct.bcd}%
                  {' '}· IGST {selectedProduct.igst}%
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-3 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                HS Code
              </label>
              <input
                type="text"
                value={manualHSCode}
                onChange={e => setManualHSCode(e.target.value)}
                placeholder="e.g. 8517.12"
                className="input-field font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                BCD %
              </label>
              <input
                type="number"
                value={manualBCD}
                onChange={e => { setManualBCD(e.target.value); setResult(null) }}
                placeholder="e.g. 20"
                min="0" max="100" step="0.5"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                IGST %
              </label>
              <select
                value={manualIGST}
                onChange={e => { setManualIGST(e.target.value); setResult(null) }}
                className="input-field"
              >
                {[0, 5, 12, 18, 28].map(r => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* CIF Value */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            CIF Value (₹)
            <span className="ml-2 text-xs text-slate-400 font-normal">
              Cost + Insurance + Freight in INR
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
              ₹
            </span>
            <input
              type="text"
              value={cifValue}
              onChange={e => handleCifChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCalculate()}
              placeholder="100000"
              className="input-field pl-8"
            />
          </div>
          {cifValue && (
            <p className="text-xs text-slate-400 mt-1">
              = ₹{fmt(parseFloat(cifValue.replace(/,/g, '')) || 0)}
            </p>
          )}
        </div>

        {/* Country (for FTA) — only meaningful when a product is selected */}
        {mode === 'search' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Country of Origin
              <span className="ml-2 text-xs text-slate-400 font-normal">
                For FTA preferential rates
              </span>
            </label>
            <select
              value={country}
              onChange={e => { setCountry(e.target.value); setResult(null) }}
              className="input-field"
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={
            !cifValue ||
            calculating ||
            (mode === 'search' && !selectedProduct) ||
            (mode === 'manual' && (!manualBCD || !manualIGST))
          }
          className="btn-primary w-full text-base"
        >
          {calculating ? 'Checking FTA rate…' : 'Calculate Import Duty'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="mt-6 animate-fade-in">
          {/* Quick Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Total Duty',   value: fmtCurrency(result.totalDuty),   color: 'text-red-600' },
              { label: 'Effective %',  value: `${result.effectiveDutyPct.toFixed(1)}%`, color: 'text-amber-600' },
              { label: 'Landed Cost',  value: fmtCurrency(result.landedCost),  color: 'text-blue-700' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <DutyBreakdown result={result} />
        </div>
      )}

      {/* Lead Modal */}
      {showLeadModal && result && (
        <LeadModal
          duty={result.totalDuty}
          onClose={() => setShowLeadModal(false)}
        />
      )}
    </div>
  )
}

// ─── Lead Modal ───────────────────────────────────────────
function LeadModal({ duty, onClose }: { duty: number; onClose: () => void }) {
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [sent,  setSent]      = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email) return
    setLoading(true)
    try {
      await fetch('/api/leads', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, phone, shipmentValue: duty, intent: 'customs_clearance' }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card p-6 max-w-sm w-full">
        {sent ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-3">✅</div>
            <div className="font-semibold text-slate-900">Got it!</div>
            <p className="text-sm text-slate-500 mt-1">
              A licensed customs broker will contact you within 2 hours.
            </p>
            <button onClick={onClose} className="btn-primary mt-4 w-full">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="font-semibold text-slate-900">
                  Your duty is {fmtCurrency(duty)}
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  Get a customs clearance quote — free, no obligation.
                </p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                className="input-field"
              />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Phone (optional)"
                className="input-field"
              />
              <button
                onClick={handleSubmit}
                disabled={!email || loading}
                className="btn-primary w-full"
              >
                {loading ? 'Sending...' : 'Get Free Quote'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
