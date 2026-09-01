'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Lock, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyStudentCredentials } from '@/actions/auth';

export default function StudentLoginPage() {
  const t = useTranslations('auth.studentLogin');
  const locale = useLocale();
  const router = useRouter();

  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verifyStudentCredentials(studentIdentifier, password);

      if (!result.success) {
        if (result.error?.includes('تعليق') || result.error?.includes('محظور')) {
          router.push(`/${locale}/suspended`);
          return;
        }
        setError(result.error || t('errorInvalid'));
        return;
      }

      router.push(`/${locale}/student`);
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-n-50 dark:bg-n-50" dir="rtl">
      <div className="bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent text-white font-bold text-xl mb-3">
            👨‍🎓
          </div>
          <h1 className="text-xl font-bold text-n-800 dark:text-n-700">{t('title')}</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
              اسم الطالب الثلاثي، أو كود الطالب، أو رقم الهاتف
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                autoFocus
                value={studentIdentifier}
                onChange={(e) => setStudentIdentifier(e.target.value)}
                placeholder="أدخل الاسم أو STU-001 أو رقم الهاتف..."
                className="pe-8 font-medium text-center"
              />
              <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" strokeWidth={1.75} />
            </div>
            <p className="text-[10px] text-n-400 mt-1">{t('codeHint')}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
              {t('password')}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور (4 أرقام)"
                className="pe-8 ps-8 text-center font-mono"
              />
              <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" strokeWidth={1.75} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="absolute start-2.5 top-1/2 -translate-y-1/2 text-n-400 hover:text-n-700 dark:hover:text-n-200 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-bad bg-bad-light p-2.5 rounded-md text-center border border-bad/20">
              {error}
            </div>
          )}

          <Button type="submit" loading={loading} className="w-full h-10 mt-2">
            {t('submit')}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-n-100 dark:border-n-200 text-center text-xs text-n-500">
          <span>{t('switchToTeacher')} </span>
          <Link href={`/${locale}/login`} className="text-accent font-semibold hover:underline">
            {t('teacherLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}
