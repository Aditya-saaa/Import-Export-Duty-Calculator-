import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leads } from '@/db/schema'

export async function POST(req: NextRequest) {
  try {
    const { email, phone, productName, intent, shipmentValue } = await req.json()

    if (!email || !intent) {
      return NextResponse.json({ error: 'Email and intent required' }, { status: 400 })
    }

    // Save to DB
    await db.insert(leads).values({
      email,
      phone:         phone || null,
      productName:   productName || null,
      intent,
      shipmentValue: shipmentValue || null,
    })

    // Notify via Resend (if configured)
    if (process.env.RESEND_API_KEY && process.env.LEAD_NOTIFICATION_EMAIL) {
      await fetch('https://api.resend.com/emails', {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          from:    'leads@importduty.in',
          to:      process.env.LEAD_NOTIFICATION_EMAIL,
          subject: `New Lead — ${intent} — ₹${shipmentValue?.toLocaleString('en-IN') ?? 'N/A'}`,
          text: `
New lead from ImportDuty.in

Email:     ${email}
Phone:     ${phone || 'Not provided'}
Intent:    ${intent}
Product:   ${productName || 'Not specified'}
Value:     ₹${shipmentValue?.toLocaleString('en-IN') ?? 'N/A'}
Time:      ${new Date().toISOString()}
          `.trim(),
        }),
      }).catch(err => console.warn('Resend failed:', err))
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[/api/leads]', err)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }
}
