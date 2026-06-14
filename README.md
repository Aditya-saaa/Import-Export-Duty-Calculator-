# ImportDuty.in — Setup Guide

## Stack
Next.js 14 · Turso (SQLite) · Drizzle ORM · Vercel · Groq/Gemini AI

## Cost: ₹1,000/year (domain only)

---

## Step 1 — Install

```bash
npm install
cp .env.example .env.local
```

---

## Step 2 — Setup Turso (2 min)

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create import-duty-db

# Get your credentials
turso db show import-duty-db --url
turso db tokens create import-duty-db
```

Add both values to `.env.local`:
```
TURSO_DATABASE_URL=libsql://import-duty-db-xxx.turso.io
TURSO_AUTH_TOKEN=your-token
```

---

## Step 3 — Setup AI (Free)

**Groq (Primary — 14,400 req/day free)**
1. Go to console.groq.com
2. Create API key
3. Add to `.env.local`: `GROQ_API_KEY=gsk_xxx`

**Gemini (Backup)**
1. Go to aistudio.google.com
2. Get API key
3. Add to `.env.local`: `GEMINI_API_KEY=AIzaSy_xxx`

---

## Step 4 — Create Tables

```bash
npm run db:generate
npm run db:migrate
```

---

## Step 5 — Seed Data

```bash
# Seed 50 sample products (get started immediately)
npm run seed:cbic

# Generate AI content for all products
npm run generate:content
```

---

## Step 6 — Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Step 7 — Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables → Add all from .env.local
```

---

## Adding Full CBIC Data (12,400+ HS Codes)

1. Download from: https://www.cbic.gov.in (Customs Tariff 2025-26)
2. Convert to JSON/CSV
3. Update `scripts/seed-cbic.ts` with full dataset
4. Run: `npm run seed:cbic`

---

## Monthly Maintenance (5 min/month)

- Watch for CBIC notifications at cbic.gov.in
- After Union Budget (Feb 1): Update rates in `scripts/update-budget.ts`
- Run seed script with new rates
- Redeploy: `vercel --prod`

---

## Revenue Milestones

| Month | Target | Action |
|---|---|---|
| 1-4 | Building | Deploy + submit to Search Console |
| 5-6 | First traffic | Apply for AdSense |
| 8-10 | ₹15K/mo | Add CHA lead gen |
| 12+ | ₹50K+/mo | Add premium tier |
redeploy
