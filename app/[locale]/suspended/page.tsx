'use client';

import React from 'react';
import { ShieldAlert, LogOut, PhoneCall, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function SuspendedAccountPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'ar';
  const isAr = locale === 'ar';

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push(`/${locale}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-900/40 p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
        {/* Top Warning Glow */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

        {/* Warning Icon */}
        <div className="w-20 h-20 rounded-2xl bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="h-10 w-10 animate-pulse" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2.5">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'حساب الطالب معلّق / محظور مؤقتاً' : 'Student Account Suspended / Temporarily Locked'}
          </h1>
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40 text-xs font-semibold text-red-700 dark:text-red-400 leading-relaxed">
            {isAr
              ? 'تم تعليق حسابك من قِبل إدارة المنصة. يرجى التواصل مع المعلمة لإعادة التفعيل.'
              : 'Your account has been suspended by the platform administration. Please contact your teacher to reactivate.'}
          </div>
        </div>

        {/* Help Info */}
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p>
            {isAr
              ? 'إذا كنت تعتقد أن هذا الإجراء تم عن طريق الخطأ أو قمت بتسوية المصروفات، يرجى التواصل فوراً مع مسؤول الفصل.'
              : 'If you believe this action was taken in error or you have settled tuition, please reach out to your class administrator immediately.'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <a
            href={
              isAr
                ? "https://wa.me/201011112222?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D9%8A%D8%B1%D8%AC%D9%89%20%D8%A5%D8%B9%D8%A7%D8%AF%D8%A9%20%D8%AA%D9%81%D8%B9%D9%8A%D9%84%20%D8%AD%D8%B3%D8%A7%D8%A8%20%D8%A7%D9%84%D8%B7%D8%A7%D9%84%D8%A8%20%D8%B9%D9%84%D9%89%20%D8%A7%D9%84%D9%85%D9%86%D8%B5%D8%A9"
                : "https://wa.me/201011112222?text=Hello%2C%20please%20reactivate%20the%20student%20account%20on%20the%20platform"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2">
              <PhoneCall className="h-4 w-4" />
              {isAr ? 'تواصل مع المعلمة عبر واتساب' : 'Contact Teacher via WhatsApp'}
            </Button>
          </a>

          <Button
            onClick={handleLogout}
            variant="secondary"
            className="w-full text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {isAr ? 'تسجيل الخروج والعودة للرئيسية' : 'Log Out & Return to Home'}
          </Button>
        </div>
      </div>
    </div>
  );
}
