import Link from 'next/link';
import { BookOpen, Video, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isAr = locale === 'ar';

  return (
    <div className="min-h-screen flex flex-col bg-n-50 dark:bg-n-50" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b border-n-200 dark:border-n-300 bg-white dark:bg-n-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-md bg-accent text-white flex items-center justify-center font-bold text-base shadow-sm">
              🎓
            </span>
            <span className="font-bold text-lg text-n-800 dark:text-n-700">
              {isAr ? 'منصة التعليم الإلكتروني' : 'EduPlatform'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/login`}
              className="text-xs sm:text-sm font-medium px-4 py-2 rounded-md border border-n-200 dark:border-n-300 text-n-700 dark:text-n-600 hover:bg-n-100 dark:hover:bg-n-200 transition-colors"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-md bg-accent text-white hover:bg-accent-mid transition-colors shadow-sm"
            >
              {isAr ? 'دخول الطالب' : 'Student Login'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto flex-1 flex flex-col justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-n-900 dark:text-n-900 tracking-tight leading-tight">
          {isAr ? 'منصة تعليمية متكاملة للحصص المباشرة والامتحانات' : 'Interactive Live Classroom & Exam Management'}
        </h1>
        <p className="mt-4 text-base md:text-lg text-n-500 dark:text-n-500 max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'بث مباشر عبر المتصفح بدون تحميل برامج، تصحيح ذكي للامتحانات، ونظام متطور لمنع الغش مع بوابة مخصصة لأولياء الأمور وإشعارات واتساب.'
            : 'Browser-based live video classes, automatic quiz grading, anti-cheating monitoring, and parent tracking.'}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={`/${locale}/login`}
            className="px-6 py-3 rounded-md bg-accent text-white font-semibold text-base hover:bg-accent-mid transition-colors shadow-sm"
          >
            {isAr ? 'الدخول كطالب' : 'Student Login'}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="px-6 py-3 rounded-md border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 text-n-800 dark:text-n-700 font-semibold text-base hover:bg-n-100 transition-colors shadow-sm"
          >
            {isAr ? 'لوحة تحكم المعلم' : 'Teacher Dashboard'}
          </Link>
          <Link
            href={`/${locale}/parent`}
            className="px-6 py-3 rounded-md border border-n-200 dark:border-n-300 bg-n-100 dark:bg-n-200 text-n-600 dark:text-n-600 font-medium text-base hover:bg-n-200 transition-colors"
          >
            {isAr ? 'بوابة ولي الأمر' : 'Parent Portal'}
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
          <div className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100">
            <Video className="h-6 w-6 text-accent mb-3" strokeWidth={1.75} />
            <h3 className="text-base font-semibold text-n-800 dark:text-n-700">
              {isAr ? 'بث مباشر فوري (Jitsi Meet)' : 'Direct Live Classroom'}
            </h3>
            <p className="mt-1 text-sm text-n-500 dark:text-n-400 leading-relaxed">
              {isAr ? 'دخول فوري بكود الحصة بدون الحاجة لتحميل تطبيقات إضافية مع تسجيل الحضور الآلي.' : 'Join instantly via room code with no app download required.'}
            </p>
          </div>

          <div className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100">
            <ShieldCheck className="h-6 w-6 text-accent mb-3" strokeWidth={1.75} />
            <h3 className="text-base font-semibold text-n-800 dark:text-n-700">
              {isAr ? 'نظام حماية ومنع الغش' : 'Anti-Cheating System'}
            </h3>
            <p className="mt-1 text-sm text-n-500 dark:text-n-400 leading-relaxed">
              {isAr ? 'رصد مغادرة نافذة الامتحان، مؤقت على السيرفر، وترتيب عشوائي للأسئلة.' : 'Tab-switch detection, randomized question pools, and auto-submit.'}
            </p>
          </div>

          <div className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100">
            <BookOpen className="h-6 w-6 text-accent mb-3" strokeWidth={1.75} />
            <h3 className="text-base font-semibold text-n-800 dark:text-n-700">
              {isAr ? 'واجبات وبنك أسئلة ذكي' : 'Homework & Smart Bank'}
            </h3>
            <p className="mt-1 text-sm text-n-500 dark:text-n-400 leading-relaxed">
              {isAr ? 'تصحيح سريع للواجبات، إرسال نتائج فوري لولي الأمر عبر واتساب.' : 'Rapid batch grading, dynamic PDF watermarking, and test generator.'}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
