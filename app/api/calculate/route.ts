import { NextRequest, NextResponse } from 'next/server'
import { calculateDuty } from '@/lib/calculations'
import { getHSCode } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cifValue, hsCodeId, bcdRate, igstRate, countryCode } = body

    if (!cifValue || cifValue <= 0) {
      return NextResponse.json({ error: 'Invalid CIF value' }, { status: 400 })
    }

    let bcd  = bcdRate
    let igst = igstRate

    // If HS code provided, look up rates from DB
    if (hsCodeId && (!bcd || !igst)) {
      const hsCode = await getHSCode(hsCodeId)
      if (!hsCode?.dutyRate) {
        return NextResponse.json({ error: 'HS code not found' }, { status: 404 })
      }
      bcd  = hsCode.dutyRate.bcd
      igst = hsCode.dutyRate.igst

      // Check FTA rate if country provided
      if (countryCode && hsCode.ftaRates?.length > 0) {
        const fta = hsCode.ftaRates.find(f => f.countryCode === countryCode)
        if (fta) {
          const result = calculateDuty({
            cifValue,
            bcdRate:             bcd,
            igstRate:            igst,
            preferentialBcdRate: fta.rate,
          })
          return NextResponse.json({ result, ftaApplied: fta })
        }
      }
    }

    if (!bcd && bcd !== 0) {
      return NextResponse.json({ error: 'BCD rate required' }, { status: 400 })
    }
    if (!igst && igst !== 0) {
      return NextResponse.json({ error: 'IGST rate required' }, { status: 400 })
    }

    const result = calculateDuty({ cifValue, bcdRate: bcd, igstRate: igst })
    return NextResponse.json({ result })

  } catch (err) {
    console.error('[/api/calculate]', err)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
