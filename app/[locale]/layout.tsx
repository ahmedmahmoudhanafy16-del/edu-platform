import type { Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from 'sonner';
import '@/app/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const resolvedLocale = await getLocale();
  const dir = resolvedLocale === 'ar' ? 'rtl' : 'ltr';
  const messages = await getMessages();

  return (
    <html lang={resolvedLocale} dir={dir} suppressHydrationWarning className={cairo.variable}>
      <body className="min-h-screen bg-n-50 dark:bg-n-50 font-sans antialiased">
        <Providers>
          <NextIntlClientProvider messages={messages} locale={resolvedLocale}>
            {children}
          </NextIntlClientProvider>
        </Providers>
        <Toaster
          richColors={false}
          position={resolvedLocale === 'ar' ? 'top-right' : 'top-left'}
          toastOptions={{
            className: 'font-sans text-sm border border-n-200 bg-white dark:bg-n-100 shadow-toast',
            style: { borderRadius: '8px' },
          }}
        />
      </body>
    </html>
  );
}
