/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static generation for programmatic pages
  output: 'standalone',
  
  // Compress responses
  compress: true,

  // Headers for SEO and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache static duty pages for 1 day
        source: '/duty/:slug*',
        headers: [
          { key: 'Cache-Control', value: 's-maxage=86400, stale-while-revalidate=3600' },
        ],
      },
    ]
  },
}

export default nextConfig
