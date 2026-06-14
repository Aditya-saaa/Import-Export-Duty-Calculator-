export const dynamic = 'force-dynamic'
import { MetadataRoute } from 'next'
import { getAllProductSlugs } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl  = process.env.NEXT_PUBLIC_SITE_URL || 'https://importduty.in'
  const products = await getAllProductSlugs()

  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              baseUrl,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         1.0,
    },
    {
      url:              `${baseUrl}/duty`,
      lastModified:     new Date(),
      changeFrequency:  'weekly',
      priority:         0.9,
    },
  ]

  const productPages: MetadataRoute.Sitemap = products.map(p => ({
    url:             `${baseUrl}/duty/${p.slug}`,
    lastModified:    new Date(),
    changeFrequency: 'monthly' as const,
    priority:        0.8,
  }))

  return [...staticPages, ...productPages]
}
