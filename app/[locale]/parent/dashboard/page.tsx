'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Trophy, FileText, ShieldCheck, Video, MessageSquare, Home, ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ParentDashboardPage() {
  const locale = useLocale();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const auth = JSON.parse(sessionStorage.getItem('parent_auth') || '{}');
      const code = auth.studentCode || 'STU-001';
      const phone = auth.phone || '01012345678';

      fetch(`/api/parent/dashboard?code=${code}&phone=${phone}`)
        .then((r) => r.json())
        .then((res) => {
          if (!res.error) setData(res);
        })
        .finally(() => setLoading(false));
    } catch {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">جاري تحميل تقرير الطالب الشامل...</p>
        </div>
      </div>
    );
  }

  const navLinks = [
    { href: `/${locale}/parent/child-progress`, icon: Trophy, title: 'تقرير الدرجات والامتحانات', desc: 'معدل الدرجات والاختبارات المنجزة', color: 'text-amber-500' },
    { href: `/${locale}/parent/child-homework`, icon: FileText, title: 'الواجبات وملاحظات المعلم', desc: 'تسليمات الواجبات والتقييمات', color: 'text-blue-600' },
    { href: `/${locale}/parent/child-attendance`, icon: ShieldCheck, title: 'سجل حضور البث المباشر', desc: 'نسبة الحضور ومواظبة الطالب', color: 'text-emerald-600' },
    { href: `/${locale}/parent/child-live`, icon: Video, title: 'الحصص المباشرة النشطة', desc: 'الغرف التفاعلية المفتوحة الآن', color: 'text-red-500' },
    { href: `/${locale}/parent/notifications`, icon: MessageSquare, title: 'سجل تنبيهات الواتساب', desc: 'رسائل وإشعارات المنصة المستلمة', color: 'text-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10 max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">بوابة ولي الأمر الأكاديمية</h1>
          <p className="text-xs text-slate-500 mt-1">متابعة شاملة ومباشرة لمستوى الطالب، الواجبات، والحضور</p>
        </div>
        <Link href={`/${locale}`}>
          <Button variant="secondary" size="sm">
            <Home className="h-4 w-4 ml-1.5" />
            الرئيسية
          </Button>
        </Link>
      </div>

      {/* Student Profile Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">اسم الطالب المتابع</p>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{data?.name || 'أحمد محمد علي'}</h2>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold text-xs mt-1">
            {data?.grade || 'الصف الثالث الإعدادي'}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-slate-500">كود الدخول</p>
          <code className="text-sm font-mono font-bold text-blue-600 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {data?.studentCode || 'STU-001'}
          </code>
        </div>
        <div>
          <p className="text-xs text-slate-500">رقم ولي الأمر المسجل</p>
          <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1">{data?.phone || '01012345678'}</p>
        </div>
      </div>

      {/* Quick Access Sections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {navLinks.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link key={idx} href={item.href} className="group">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all hover:border-blue-300 dark:hover:border-blue-800 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-5 w-5 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:translate-x-[-3px] transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
