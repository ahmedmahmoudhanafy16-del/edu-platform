'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Lock, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function TeacherLoginPage() {
  const t = useTranslations('auth.teacherLogin');
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('teacher@school.com');
  const [password, setPassword] = useState('teacher123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'TEACHER' }),
      });

      if (!res.ok) {
        setError(t('errorInvalid'));
        return;
      }

      router.push(`/${locale}/teacher`);
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
            👨‍🏫
          </div>
          <h1 className="text-xl font-bold text-n-800 dark:text-n-700">{t('title')}</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
              {t('email')}
            </label>
            <div className="relative">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="pe-8"
              />
              <Mail className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" strokeWidth={1.75} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
              {t('password')}
            </label>
            <div className="relative">
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pe-8"
              />
              <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" strokeWidth={1.75} />
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
          <span>{t('switchToStudent')} </span>
          <Link href={`/${locale}/student-login`} className="text-accent font-semibold hover:underline">
            {t('studentLink')}
          </Link>
        </div>
      </div>
    </div>
  );
}
