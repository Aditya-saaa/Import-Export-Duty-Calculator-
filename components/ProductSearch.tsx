'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

interface SearchResult {
  id:       number
  name:     string
  slug:     string
  category: string
  bcd:      number
  igst:     number
  hs_code_id: string
}

interface Props {
  onSelect: (product: {
    name:    string
    slug:    string
    hsCodeId: string
    bcd:     number
    igst:    number
  }) => void
}

export default function ProductSearch({ onSelect }: Props) {
  const [query,     setQuery]     = useState('')
  const [results,   setResults]   = useState<SearchResult[]>([])
  const [loading,   setLoading]   = useState(false)
  const [open,      setOpen]      = useState(false)
  const [selected,  setSelected]  = useState<string | null>(null)
  const timerRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results || [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    if (!query || selected) return
    timerRef.current = setTimeout(() => doSearch(query), 300)
    return () => clearTimeout(timerRef.current)
  }, [query, doSearch, selected])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (r: SearchResult) => {
    setQuery(r.name)
    setSelected(r.name)
    setOpen(false)
    setResults([])
    onSelect({
      name:    r.name,
      slug:    r.slug,
      hsCodeId: r.hs_code_id,
      bcd:     r.bcd,
      igst:    r.igst,
    })
  }

  const handleClear = () => {
    setQuery('')
    setSelected(null)
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null) }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="e.g. Bluetooth Speaker, iPhone, Solar Panel..."
          className="input-field pl-10 pr-10"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
        )}
        {selected && !loading && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 card shadow-lg overflow-hidden border border-slate-200">
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors
                flex items-center justify-between gap-4
                ${i !== 0 ? 'border-t border-slate-50' : ''}`}
            >
              <div>
                <div className="font-medium text-slate-900 text-sm">{r.name}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  HS {r.hs_code_id} · {r.category}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-medium text-slate-700">
                  BCD {r.bcd}% + IGST {r.igst}%
                </div>
                <div className="text-xs text-slate-400">
                  ~{(r.bcd + r.bcd * 0.1 + r.igst * (1 + r.bcd / 100 + r.bcd * 0.001)).toFixed(0)}% effective
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 card shadow-lg p-4 text-sm text-slate-500 text-center">
          No products found for "{query}". Try the HS Code tab above.
        </div>
      )}
    </div>
  )
}
