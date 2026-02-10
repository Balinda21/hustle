import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/config/seo';

export default function robots(): MetadataRoute.Robots {
  const base = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin-dashboard', '/admin-users', '/admin-chats', '/account', '/api/'],
      },
    ],
    ...(base ? { host: base } : {}),
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
