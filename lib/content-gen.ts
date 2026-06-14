// lib/content-gen.ts
// 4-level fallback chain: Groq → Gemini → Cloudflare AI → Template
// Content is generated ONCE and stored in DB permanently

import { effectiveRate, fmt } from './calculations'

interface ContentInput {
  productName:  string
  hsCodeId:     string
  bcd:          number
  igst:         number
  category:     string
  ftaCountry?:  string
  ftaRate?:     number
  ftaName?:     string
}

// ─── Prompt Builder ───────────────────────────────────────
function buildPrompt(input: ContentInput): string {
  const effective = effectiveRate(input.bcd, input.igst).toFixed(1)
  const example   = fmt(100000 * (1 + parseFloat(effective) / 100))

  return `Write a 3-sentence SEO paragraph about importing "${input.productName}" into India.
Include: HS Code ${input.hsCodeId}, BCD ${input.bcd}%, IGST ${input.igst}%, total ~${effective}% effective duty.
Mention that a ₹1,00,000 CIF shipment has a landed cost of ~₹${example}.
${input.ftaCountry ? `Also mention: importing from ${input.ftaCountry} under ${input.ftaName} reduces BCD to ${input.ftaRate}%.` : ''}
Write naturally, no markdown, no bullet points. Max 100 words.`
}

// ─── Level 1: Groq (Primary — Most Reliable) ─────────────
async function tryGroq(input: ContentInput): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:      'llama3-8b-8192',
      max_tokens: 200,
      temperature: 0.7,
      messages: [{ role: 'user', content: buildPrompt(input) }],
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Groq: ${res.status}`)
  const json = await res.json()
  return json.choices[0].message.content.trim()
}

// ─── Level 2: Gemini (Backup) ────────────────────────────
async function tryGemini(input: ContentInput): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(input) }] }],
      generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
    }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Gemini: ${res.status}`)
  const json = await res.json()
  return json.candidates[0].content.parts[0].text.trim()
}

// ─── Level 3: Cloudflare Workers AI (Third) ──────────────
async function tryCloudflareAI(input: ContentInput): Promise<string> {
  if (!process.env.CF_ACCOUNT_ID || !process.env.CF_API_TOKEN) {
    throw new Error('CF not configured')
  }
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3-8b-instruct`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildPrompt(input) }],
        max_tokens: 200,
      }),
      signal: AbortSignal.timeout(10000),
    }
  )
  if (!res.ok) throw new Error(`CF AI: ${res.status}`)
  const json = await res.json()
  return json.result.response.trim()
}

// ─── Level 4: Template (Always Works — Zero API) ─────────
// Produces unique content per product via variable data
function generateTemplate(input: ContentInput): string {
  const effective = effectiveRate(input.bcd, input.igst).toFixed(1)
  const example   = fmt(Math.round(100000 * (1 + parseFloat(effective) / 100)))

  const ftaPart = input.ftaCountry
    ? ` Importers sourcing ${input.productName} from ${input.ftaCountry} can reduce Basic Customs Duty to ${input.ftaRate}% under the ${input.ftaName}, offering significant savings on bulk shipments.`
    : ` Standard MFN (Most Favoured Nation) duty rates apply for all countries of origin under India's Customs Tariff Act.`

  return `The import duty on ${input.productName} in India for FY 2025-26 comprises ${input.bcd}% Basic Customs Duty (BCD) plus ${input.igst}% IGST, resulting in a total effective duty of approximately ${effective}% on the CIF (Cost, Insurance & Freight) value — classified under HS Code ${input.hsCodeId} of the Customs Tariff Act. For a shipment worth ₹1,00,000, the total import duty comes to roughly ₹${fmt(Math.round(100000 * parseFloat(effective) / 100))}, making the landed cost approximately ₹${example}.${ftaPart}`
}

// ─── Master Generator ─────────────────────────────────────
export async function generateContent(
  input: ContentInput
): Promise<{ content: string; source: string }> {

  const providers = [
    { name: 'groq',       fn: () => tryGroq(input) },
    { name: 'gemini',     fn: () => tryGemini(input) },
    { name: 'cloudflare', fn: () => tryCloudflareAI(input) },
  ]

  for (const provider of providers) {
    try {
      const content = await provider.fn()
      if (content && content.length > 50) {
        console.log(`✅ [${provider.name}] Generated: ${input.productName}`)
        return { content, source: provider.name }
      }
    } catch (err) {
      console.warn(`⚠️  [${provider.name}] Failed for "${input.productName}":`, (err as Error).message)
    }
  }

  // Template always works
  console.log(`📄 [template] Fallback for: ${input.productName}`)
  return { content: generateTemplate(input), source: 'template' }
}

// Rate limiter for batch generation
export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
