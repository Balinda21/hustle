/**
 * Central SEO config — used for metadata, Open Graph, sitemap, and JSON-LD.
 * Set NEXT_PUBLIC_APP_URL in .env to your production URL for canonical and OG links.
 */

const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
const isProd = process.env.NODE_ENV === 'production';

export const site = {
  name: 'ChainReturns',
  shortName: 'CR',
  tagline: 'Digital Asset Trading',
  description:
    'Trade digital assets with confidence. ChainReturns offers crypto and forex trading, AI-powered quantification, options, contracts, and secure loans.',
  keywords: [
    'digital asset trading',
    'crypto trading',
    'forex',
    'ChainReturns',
    'options trading',
    'AI quantification',
    'crypto loans',
  ],
  locale: 'en_US',
  twitterHandle: '', // e.g. @chainreturns
} as const;

/** Base URL for canonical and OG (no trailing slash). Empty in dev if not set. */
export function getBaseUrl(): string {
  if (appUrl) return appUrl.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

/** Absolute URL for a path (e.g. /market -> https://yoursite.com/market). */
export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export const defaultOgImagePath = '/logo.png';

export function getDefaultOgImageUrl(): string {
  return absoluteUrl(defaultOgImagePath) || defaultOgImagePath;
}

/** Whether we have a proper base URL (for sitemap/robots). */
export function hasBaseUrl(): boolean {
  return isProd && !!appUrl;
}
