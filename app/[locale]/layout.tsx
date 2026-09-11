import type { Viewport, Metadata } from 'next';
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}): Promise<Metadata> {
  let locale = 'ar';
  try {
    const resolvedParams = await params;
    if (resolvedParams?.locale) locale = resolvedParams.locale;
  } catch (e) {
    locale = 'ar';
  }

  const isAr = locale === 'ar';

  return {
    title: {
      template: isAr ? '%s | المنصة التعليمية الذكية' : '%s | Smart EduPlatform',
      default: isAr
        ? 'المنصة التعليمية الذكية | نظام إدارة الفصول والاختبارات التفاعلية'
        : 'Smart EduPlatform | Interactive Classrooms & Exam System',
    },
    description: isAr
      ? 'منصة تعليمية متطورة للطلاب والمعلمين، تدعم الاختبارات التفاعلية، الفصول الافتراضية، ومتابعة أولياء الأمور عبر الواتساب.'
      : 'Advanced educational platform for students and teachers supporting interactive quizzes, virtual classrooms, and automated parent tracking.',
    keywords: isAr
      ? ['منصة تعليمية', 'اختبارات إلكترونية', 'فصول ذكية', 'متابعة الطلاب', 'مصر', 'التعليم الإلكتروني']
      : ['EduPlatform', 'online quizzes', 'smart classroom', 'student tracking', 'e-learning'],
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://eduplatform.example.com'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'ar': '/ar',
        'en': '/en',
      },
    },
    openGraph: {
      title: isAr ? 'المنصة التعليمية الذكية' : 'Smart EduPlatform',
      description: isAr
        ? 'بيئة تعليمية رقمية متكاملة لتقييم ومتابعة الطلاب بكفاءة وموثوقية عالية.'
        : 'Integrated digital learning environment for student assessment and tracking.',
      siteName: isAr ? 'منصة التعليم الذكي' : 'EduPlatform',
      locale: isAr ? 'ar_EG' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: isAr ? 'المنصة التعليمية الذكية' : 'Smart EduPlatform',
      description: isAr
        ? 'نظام تعليمي متكامل للفصول والاختبارات ومتابعة أداء الطلاب.'
        : 'Comprehensive learning system for classrooms, quizzes, and student analytics.',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

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
