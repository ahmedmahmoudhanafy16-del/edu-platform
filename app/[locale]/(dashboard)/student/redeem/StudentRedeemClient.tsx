'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ticket, CheckCircle2, AlertCircle, ArrowLeft, Wifi, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StudentRedeemClient({ locale, studentName }: { locale: string; studentName: string }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{
    message: string;
    code: string;
    liveSession: {
      id: string;
      title: string;
      roomCode: string;
      isActive: boolean;
      classroomName?: string;
    };
  } | null>(null);

  /**
   * Format input: auto-uppercase and auto-insert dashes for EDU-XXXX-XXXX
   */
  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    // Auto-prefix EDU if not already there or if user starts typing random chars
    if (raw.length > 0 && !raw.startsWith('EDU')) {
      if ('EDU'.startsWith(raw)) {
        // user is typing E, ED, or EDU
      } else {
        raw = 'EDU' + raw;
      }
    }

    // Format segments: EDU-XXXX-XXXX
    let formatted = raw;
    if (raw.length > 3) {
      formatted = raw.slice(0, 3) + '-' + raw.slice(3);
    }
    if (raw.length > 7) {
      formatted = raw.slice(0, 3) + '-' + raw.slice(3, 7) + '-' + raw.slice(7, 11);
    }

    setCode(formatted);
    if (error) setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();

    if (!clean || clean.length < 5) {
      setError('يرجى إدخال كود صحيح بالصيغة EDU-XXXX-XXXX');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessData(null);

    try {
      const res = await fetch('/api/student/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشل في تفعيل الكود');
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تفعيل الكود، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto" dir="rtl">
      {/* ── Success View ────────────────────────────────────────────── */}
      {successData ? (
        <div className="rounded-2xl border border-ok/30 bg-white dark:bg-n-100 p-8 shadow-lg text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-ok-light border border-ok/30 text-ok mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-ok bg-ok-light px-3 py-1 rounded-full border border-ok/20">
              تم التفعيل والاشتراك بنجاح 🎉
            </span>
            <h2 className="text-xl font-bold text-n-800 dark:text-n-700 mt-2">
              {successData.liveSession.title}
            </h2>
            <p className="text-xs text-n-500 dark:text-n-400">
              {successData.liveSession.classroomName || 'الفصل الدراسي'} · الكود المفعل:{' '}
              <span className="font-mono font-bold text-accent">{successData.code}</span>
            </p>
          </div>

          {/* Session details card */}
          <div className="p-4 rounded-xl border border-n-200 dark:border-n-300 bg-n-50 dark:bg-n-200 text-start space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-n-500">حالة الحصة الآن:</span>
              {successData.liveSession.isActive ? (
                <span className="font-bold text-ok flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-ok animate-ping" /> مباشر الآن
                </span>
              ) : (
                <span className="font-medium text-n-500">مجدولة / لم تبدأ بعد</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-n-500">كود الغرفة:</span>
              <code className="font-mono font-bold text-accent bg-white dark:bg-n-100 px-2 py-0.5 rounded border border-accent/20">
                {successData.liveSession.roomCode}
              </code>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-2">
            <Link
              href={`/${locale}/student/live?room=${successData.liveSession.roomCode}&name=${encodeURIComponent(studentName || 'الطالب')}`}
              className="block"
            >
              <Button variant="primary" size="lg" className="w-full text-base font-bold shadow-md">
                <Wifi className="h-5 w-5 me-1" />
                دخول الحصة المباشرة الآن
              </Button>
            </Link>

            <Link href={`/${locale}/student`} className="block">
              <Button variant="secondary" size="md" className="w-full text-xs">
                العودة للوحة تحكم الطالب
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* ── Input Form View ─────────────────────────────────────────── */
        <div className="rounded-2xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 p-8 shadow-lg text-center space-y-6">
          {/* Big Center Icon */}
          <div className="w-20 h-20 rounded-2xl bg-accent-light border border-accent/30 text-accent mx-auto flex items-center justify-center shadow-sm">
            <Ticket className="h-10 w-10" strokeWidth={1.5} />
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">استخدام كود الجلسة</h1>
            <p className="text-xs text-n-500 dark:text-n-400 max-w-xs mx-auto leading-relaxed">
              أدخل الكود الذي حصلت عليه (من السنتر أو فودافون كاش) للوصول إلى الحصة المباشرة فوراً
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-bad-light border border-bad/30 text-bad text-xs font-semibold flex items-center gap-2 text-start animate-shake">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-n-600 dark:text-n-400 mb-2 text-start">
                كود التفعيل (Access Code):
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="EDU-XXXX-XXXX"
                  value={code}
                  onChange={handleCodeChange}
                  maxLength={13}
                  disabled={loading}
                  autoFocus
                  className="w-full text-center font-mono font-bold text-lg tracking-widest bg-n-50 dark:bg-n-200 border-2 border-n-300 dark:border-n-300 text-n-800 dark:text-n-700 rounded-xl py-3.5 px-4 focus:outline-none focus:border-accent focus:bg-white transition-all placeholder:text-n-300 dark:placeholder:text-n-400 uppercase"
                />
                <Sparkles className="h-4 w-4 text-accent/50 absolute left-3 top-4 pointer-events-none" />
              </div>
              <p className="text-[10px] text-n-400 mt-1.5 text-start flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-ok" />
                الكود يُستخدم لمرة واحدة فقط ويرتبط بحسابك تلقائياً
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-base font-bold shadow-md h-12"
            >
              تفعيل الكود والاشتراك
            </Button>
          </form>

          {/* Back link */}
          <div className="pt-2 border-t border-n-100 dark:border-n-200">
            <Link
              href={`/${locale}/student`}
              className="text-xs text-n-500 hover:text-accent font-semibold inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              العودة إلى لوحة تحكم الطالب
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
