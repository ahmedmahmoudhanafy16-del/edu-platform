'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, FileText, Video, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ParentDashboardPage({ params: { locale } }: { params: { locale: string } }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const auth = JSON.parse(sessionStorage.getItem('parent_auth') || '{}');
      if (auth.studentCode) {
        fetch(`/api/parent/dashboard?code=${auth.studentCode}&phone=${auth.phone}`)
          .then((r) => r.json())
          .then((res) => {
            if (!res.error) setData(res);
          })
          .finally(() => setLoading(false));
      } else {
        // Fallback demo data
        fetch(`/api/parent/dashboard?code=STU-001&phone=01099998888`)
          .then((r) => r.json())
          .then((res) => {
            if (!res.error) setData(res);
          })
          .finally(() => setLoading(false));
      }
    } catch {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-n-50 dark:bg-n-50 flex items-center justify-center p-4">
        <p className="text-xs text-n-500">جاري تحميل تقرير الطالب...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-n-50 dark:bg-n-50 p-6 md:p-10 max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">تقرير ولي الأمر الأكاديمي</h1>
          <p className="text-xs text-n-500 mt-0.5">متابعة دقيقة لمستوى الطالب، الواجبات، ونسبة الحضور</p>
        </div>
        <Link href={`/${locale}`}>
          <Button variant="secondary" size="sm">الرئيسية</Button>
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-n-400">اسم الطالب</p>
          <h2 className="text-lg font-bold text-n-800 dark:text-n-700">{data?.name || 'أحمد محمد علي'}</h2>
        </div>
        <div>
          <p className="text-xs text-n-400">كود الطالب</p>
          <code className="text-sm font-mono font-bold text-accent">{data?.studentCode || 'STU-001'}</code>
        </div>
        <div>
          <p className="text-xs text-n-400">هاتف ولي الأمر</p>
          <p className="text-xs font-mono text-n-700">{data?.phone || '01099998888'}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100">
          <p className="text-xs text-n-500">الواجبات المُسلَّمة</p>
          <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-1">{data?.submissions?.length || 1}</p>
        </div>

        <div className="p-5 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100">
          <p className="text-xs text-n-500">الامتحانات المنجزة</p>
          <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-1">{data?.quizResults?.length || 0}</p>
        </div>

        <div className="p-5 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100">
          <p className="text-xs text-n-500">الحصص المحضورة</p>
          <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-1">{data?.attendance?.length || 1}</p>
        </div>
      </div>

      {/* Recent Submissions */}
      <div className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-3">
        <h3 className="text-sm font-bold text-n-800 dark:text-n-700">سجل تسليم الواجبات</h3>
        {!data?.submissions || data.submissions.length === 0 ? (
          <p className="text-xs text-n-400 py-4 text-center">لا توجد تسليمات مسجلة بعد</p>
        ) : (
          <div className="space-y-2">
            {data.submissions.map((s: any) => (
              <div key={s.id} className="p-3 bg-n-50 dark:bg-n-200 rounded-lg border border-n-100 dark:border-n-300 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-n-800 dark:text-n-700">{s.assignment?.title || 'واجب دراسي'}</p>
                  <p className="text-n-400 mt-0.5">تاريخ التسليم: {new Date(s.submittedAt).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="text-end">
                  {s.grade != null ? (
                    <span className="font-bold text-ok text-sm">{s.grade} / {s.assignment?.maxScore || 10}</span>
                  ) : (
                    <span className="text-warn bg-warn-light px-2 py-0.5 rounded text-[11px]">قيد التصحيح</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
