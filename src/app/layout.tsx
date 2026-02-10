import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { site, getBaseUrl, getDefaultOgImageUrl } from '@/config/seo';

const baseUrl = getBaseUrl();
const ogImage = baseUrl ? getDefaultOgImageUrl() : undefined;

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: baseUrl ? new URL(baseUrl) : undefined,
  title: {
    default: `${site.name} - ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: [...site.keywords],
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/logo.ico',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.name,
    title: `${site.name} - ${site.tagline}`,
    description: site.description,
    ...(ogImage && { images: [{ url: ogImage, width: 512, height: 512, alt: site.name }] }),
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} - ${site.tagline}`,
    description: site.description,
    ...(ogImage && { images: [ogImage] }),
    ...(site.twitterHandle ? { creator: site.twitterHandle } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    // Uncomment and set when you have them:
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  category: 'finance',
};

function JsonLd() {
  const base = getBaseUrl();
  if (!base) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: site.name,
        url: base,
        logo: { '@type': 'ImageObject', url: `${base}/logo.png` },
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: site.name,
        description: site.description,
        publisher: { '@id': `${base}/#organization` },
        inLanguage: site.locale,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
