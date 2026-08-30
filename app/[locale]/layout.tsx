import type { Viewport } from 'next';
import { Cairo } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }> | { locale: string };
}) {
  // 1. Asynchronous Params Handling for Next.js 14/15 App Router
  let locale = 'ar';
  try {
    const resolvedParams = await params;
    if (resolvedParams?.locale) {
      locale = resolvedParams.locale;
    }
  } catch (e) {
    locale = 'ar';
  }

  if (!routing.locales.includes(locale as any)) {
    locale = 'ar';
  }

  // 2. Safe Translation Messages Loading with Fallbacks
  let messages = {};
  try {
    messages = await getMessages({ locale });
  } catch (e) {
    try {
      messages = await getMessages();
    } catch (err) {
      messages = {};
    }
  }

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning className={cairo.variable}>
      <body className="min-h-screen bg-n-50 dark:bg-n-50 font-sans antialiased">
        <Providers>
          <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
          </NextIntlClientProvider>
        </Providers>
        <Toaster
          richColors={false}
          position={locale === 'ar' ? 'top-right' : 'top-left'}
          toastOptions={{
            className: 'font-sans text-sm border border-n-200 bg-white dark:bg-n-100 shadow-toast',
            style: { borderRadius: '8px' },
          }}
        />
      </body>
    </html>
  );
}
