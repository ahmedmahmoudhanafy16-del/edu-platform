import React from 'react';
import { User, Phone, KeyRound, BookOpen, GraduationCap, Shield } from 'lucide-react';
import { getAuthenticatedStudent } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const student = await getAuthenticatedStudent();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          الملف الشخصي للطالب
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          بيانات الحساب الأكاديمي وكود الدخول المعتمد
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
            {student?.name?.charAt(0) || 'ط'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{student?.name || 'الطالب'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold text-xs">
                {student?.grade || 'المرحلة الدراسية'}
              </Badge>
              <code className="bg-slate-100 dark:bg-slate-800 text-blue-600 font-mono font-bold px-2 py-0.5 rounded text-xs">
                {student?.studentCode || '—'}
              </code>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">اسم الطالب الكامل:</span>
            <strong className="text-sm text-slate-900 dark:text-white">{student?.name || '—'}</strong>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">كود الدخول المعتمد:</span>
            <strong className="text-sm font-mono text-blue-600">{student?.studentCode || '—'}</strong>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">رقم هاتف الطالب:</span>
            <strong className="text-sm font-mono text-slate-900 dark:text-white">{student?.phone || '—'}</strong>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 block mb-1">واتساب ولي الأمر المربوط:</span>
            <strong className="text-sm font-mono text-emerald-600">{student?.parentPhone || student?.phone || '—'}</strong>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Link href={`/${locale}/student/settings`}>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
              تعديل الإعدادات وكلمة المرور
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
