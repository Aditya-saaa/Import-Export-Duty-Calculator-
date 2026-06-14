import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default:  'Import Duty Calculator India 2025-26 | Calculate Customs Duty Instantly',
    template: '%s | ImportDuty.in',
  },
  description:
    'Calculate exact import duty and customs duty on any product in India. ' +
    'BCD + IGST + SWS breakdown, FTA savings, landed cost — updated for Budget 2025-26.',
  keywords: [
    'import duty calculator india',
    'customs duty calculator',
    'import duty india 2025',
    'hs code customs duty',
    'landed cost calculator india',
  ],
  authors:  [{ name: 'ImportDuty.in' }],
  creator:  'ImportDuty.in',
  openGraph: {
    type:   'website',
    locale: 'en_IN',
    url:    process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'ImportDuty.in',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* Nav */}
        <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">ID</span>
              </div>
              <span className="font-bold text-slate-900">ImportDuty.in</span>
            </a>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <a href="/duty" className="hover:text-blue-600 transition-colors">
                All Products
              </a>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 mt-20">
          <div className="max-w-5xl mx-auto px-4 py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
              <div>
                <div className="text-white font-semibold mb-3">ImportDuty.in</div>
                <p className="text-sm leading-relaxed">
                  India's most accurate import duty calculator.
                  Updated for Union Budget 2025-26.
                </p>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Calculate</div>
                <ul className="space-y-2 text-sm">
                  <li><a href="/" className="hover:text-white transition-colors">Duty Calculator</a></li>
                  <li><a href="/duty" className="hover:text-white transition-colors">All Products</a></li>
                </ul>
              </div>
              <div>
                <div className="text-white font-semibold mb-3">Categories</div>
                <ul className="space-y-2 text-sm">
                  <li><a href="/duty#electronics" className="hover:text-white transition-colors">Electronics</a></li>
                  <li><a href="/duty#automobiles" className="hover:text-white transition-colors">Automobiles</a></li>
                  <li><a href="/duty#machinery" className="hover:text-white transition-colors">Machinery</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-6 text-sm flex flex-col sm:flex-row justify-between gap-2">
              <span>© 2025 ImportDuty.in. All rights reserved.</span>
              <span>Data sourced from CBIC. Updated February 2025.</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
