import Link from 'next/link';
import { BookOpen, Video, ShieldCheck, CheckCircle2, GraduationCap, Users } from 'lucide-react';
import { Footer } from '@/components/shared/Footer';

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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🎓
            </span>
            <span className="font-bold text-lg text-slate-900 dark:text-white">
              {isAr ? 'منصة التعليم الإلكتروني' : 'EduPlatform'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}/login`}
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              {isAr ? 'دخول الطالب' : 'Student Portal'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 text-center max-w-4xl mx-auto flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mx-auto mb-6">
          ✨ الإصدار المتطور 2026 مع حماية متقدمة وبث مباشر
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          {isAr ? 'منصة تعليمية متكاملة للحصص المباشرة والامتحانات' : 'Interactive Live Classroom & Exam Management'}
        </h1>
        <p className="mt-4 text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          {isAr
            ? 'بث مباشر تفاعلي عالي الأداء، تصحيح ذكي للامتحانات، نظام متطور لمنع الغش مع إشعارات واتساب آلية وبوابة متكاملة لولي الأمر.'
            : 'Browser-based live video classes, automatic quiz grading, anti-cheating monitoring, and parent tracking.'}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3.5">
          <Link
            href={`/${locale}/login`}
            className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-md active:scale-95 flex items-center gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            {isAr ? 'الدخول كطالب' : 'Student Login'}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 flex items-center gap-2"
          >
            <Users className="h-4 w-4 text-blue-600" />
            {isAr ? 'لوحة تحكم المعلم' : 'Teacher Dashboard'}
          </Link>
          <Link
            href={`/${locale}/login`}
            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2"
          >
            👨‍👩‍👦 {isAr ? 'بوابة ولي الأمر' : 'Parent Portal'}
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-4">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'بث مباشر تفاعلي (Jitsi Meet)' : 'Direct Live Classroom'}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr ? 'حصة تفاعلية بكود دخول فوري وتسجيل الحضور التلقائي مع إشعارات واتساب.' : 'Join instantly via room code with automated attendance logging.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'نظام حماية ومنع الغش' : 'Anti-Cheating System'}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr ? 'مؤقت محمي على السيرفر، رصد مغادرة النافذة، وترتيب عشوائي للأسئلة مع تسليم تلقائي.' : 'Server timer, tab-switch detection, and randomized question pools.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center mb-4">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isAr ? 'واجبات وتقارير أولياء الأمور' : 'Homework & Parent Reports'}
            </h3>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr ? 'تصحيح الواجبات ورصد الدرجات وإرسال نتائج الامتحانات فوراً لولي الأمر عبر واتساب.' : 'Rapid grading, grade tracking, and instant WhatsApp parent updates.'}
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
