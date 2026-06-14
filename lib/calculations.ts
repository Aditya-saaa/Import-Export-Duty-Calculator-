// lib/calculations.ts
// Core import duty calculation engine for India

export interface DutyInput {
  cifValue:     number   // Cost + Insurance + Freight (in INR)
  bcdRate:      number   // Basic Customs Duty %
  igstRate:     number   // IGST % (0/5/12/18/28)
  swsRate?:     number   // Social Welfare Surcharge % of BCD (default 10)
  aidcRate?:    number   // Agriculture Infra Dev Cess % of CIF
  compCessRate?: number  // Compensation Cess % (on luxury/sin goods)
  preferentialBcdRate?: number // FTA preferential rate (overrides bcd)
}

export interface BreakdownItem {
  label:     string
  amount:    number
  note?:     string
  highlight?: boolean
  isTotal?:  boolean
}

export interface DutyResult {
  // Inputs
  cifValue:        number
  bcdRateUsed:     number

  // Duty components
  bcd:             number
  sws:             number
  aidc:            number
  igstBase:        number   // CIF + BCD + SWS + AIDC (IGST is on this)
  igst:            number
  compCess:        number

  // Totals
  totalDuty:       number
  landedCost:      number
  effectiveDutyPct: number  // Total duty as % of CIF

  // UI
  breakdown:       BreakdownItem[]

  // Savings
  ftaSavings?:     number   // How much saved vs MFN rate
}

export function calculateDuty(input: DutyInput): DutyResult {
  const {
    cifValue,
    bcdRate,
    igstRate,
    swsRate     = 10,
    aidcRate    = 0,
    compCessRate = 0,
    preferentialBcdRate,
  } = input

  // Use FTA rate if available (saves on BCD)
  const bcdRateUsed = preferentialBcdRate !== undefined
    ? preferentialBcdRate
    : bcdRate

  // Step 1: BCD on CIF
  const bcd = (cifValue * bcdRateUsed) / 100

  // Step 2: SWS = 10% of BCD (always)
  const sws = (bcd * swsRate) / 100

  // Step 3: AIDC on CIF (for specific goods like gold, liquor)
  const aidc = (cifValue * aidcRate) / 100

  // Step 4: IGST base = CIF + BCD + SWS + AIDC
  const igstBase = cifValue + bcd + sws + aidc

  // Step 5: IGST on igstBase
  const igst = (igstBase * igstRate) / 100

  // Step 6: Compensation Cess (luxury goods)
  const compCess = ((igstBase + igst) * compCessRate) / 100

  // Totals
  const totalDuty      = bcd + sws + aidc + igst + compCess
  const landedCost     = cifValue + totalDuty
  const effectiveDutyPct = (totalDuty / cifValue) * 100

  // FTA savings vs MFN rate
  const ftaSavings = preferentialBcdRate !== undefined && preferentialBcdRate < bcdRate
    ? ((bcdRate - preferentialBcdRate) / 100) * cifValue
    : undefined

  return {
    cifValue,
    bcdRateUsed,
    bcd,
    sws,
    aidc,
    igstBase,
    igst,
    compCess,
    totalDuty,
    landedCost,
    effectiveDutyPct,
    ftaSavings,
    breakdown: [
      {
        label:  'CIF Value',
        amount: cifValue,
        note:   'Cost + Insurance + Freight',
      },
      {
        label:  `Basic Customs Duty (BCD) — ${bcdRateUsed}%`,
        amount: bcd,
        note:   preferentialBcdRate !== undefined
          ? `FTA preferential rate (MFN: ${bcdRate}%)`
          : 'On CIF value',
      },
      {
        label:  `Social Welfare Surcharge (SWS) — ${swsRate}% of BCD`,
        amount: sws,
        note:   'Always 10% of BCD',
      },
      ...(aidc > 0 ? [{
        label:  `AIDC — ${aidcRate}%`,
        amount: aidc,
        note:   'Agriculture Infra Dev Cess on CIF',
      }] : []),
      {
        label:  `IGST — ${igstRate}%`,
        amount: igst,
        note:   `On ₹${fmt(igstBase)} (CIF + BCD + SWS${aidc > 0 ? ' + AIDC' : ''})`,
      },
      ...(compCess > 0 ? [{
        label:  `Compensation Cess — ${compCessRate}%`,
        amount: compCess,
        note:   'Applicable on luxury/sin goods',
      }] : []),
      {
        label:     '─────────────────',
        amount:    0,
        highlight: false,
      },
      {
        label:     'Total Import Duty',
        amount:    totalDuty,
        highlight: true,
        note:      `${effectiveDutyPct.toFixed(1)}% of CIF`,
      },
      {
        label:   'Total Landed Cost',
        amount:  landedCost,
        isTotal: true,
        note:    'CIF + all duties',
      },
    ].filter(i => i.amount !== 0 || i.isTotal || i.highlight),
  }
}

// ─── Formatting Helpers ───────────────────────────────────

export function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(n)
}

export function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

// Quick estimate for page content
export function estimateDuty(cifValue: number, bcd: number, igst: number): number {
  const bcdAmt   = (cifValue * bcd) / 100
  const swsAmt   = (bcdAmt * 10) / 100
  const igstBase = cifValue + bcdAmt + swsAmt
  const igstAmt  = (igstBase * igst) / 100
  return bcdAmt + swsAmt + igstAmt
}

export function effectiveRate(bcd: number, igst: number): number {
  const bcdAmt   = bcd
  const swsAmt   = bcdAmt * 0.1
  const igstBase = 100 + bcdAmt + swsAmt
  const igstAmt  = (igstBase * igst) / 100
  return bcdAmt + swsAmt + igstAmt
}
