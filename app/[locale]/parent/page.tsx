'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Users, Phone, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ParentLoginPage() {
  const t = useTranslations('auth.parentPortal');
  const locale = useLocale();
  const router = useRouter();

  const [phone, setPhone] = useState('01099998888');
  const [studentCode, setStudentCode] = useState('STU-001');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/parent/dashboard?code=${studentCode}&phone=${phone}`);
      if (!res.ok) {
        setError(t('errorInvalid'));
        return;
      }
      sessionStorage.setItem('parent_auth', JSON.stringify({ phone, studentCode }));
      router.push(`/${locale}/parent/dashboard`);
    } catch {
      setError('حدث خطأ في التحقق من البيانات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-n-50 dark:bg-n-50" dir="rtl">
      <div className="bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 w-full max-w-md shadow-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent text-white font-bold text-xl mb-3">
            👨‍👩‍👦
          </div>
          <h1 className="text-xl font-bold text-n-800 dark:text-n-700">{t('title')}</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
              {t('phone')}
            </label>
            <div className="relative">
              <Input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                className="pe-8"
              />
              <Phone className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" strokeWidth={1.75} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
              {t('code')}
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                placeholder={t('codePlaceholder2')}
                className="pe-8 font-mono font-bold tracking-widest text-center"
              />
              <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" strokeWidth={1.75} />
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
      </div>
    </div>
  );
}
