import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/config/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getBaseUrl();
  if (!base) return [];

  const now = new Date().toISOString();

  const routes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/market`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  return routes;
}
