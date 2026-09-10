'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Ticket, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Wifi, Sparkles, ShieldCheck, BookOpen, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StudentRedeemClient({ locale, studentName }: { locale: string; studentName: string }) {
  const isAr = locale === 'ar';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<{
    message: string;
    code: string;
    type?: string;
    classroom?: {
      id: string;
      name: string;
      subject: string;
      teacherName?: string;
    };
    liveSession?: {
      id: string;
      title: string;
      roomCode: string;
      isActive: boolean;
      classroomName?: string;
    };
  } | null>(null);

  /**
   * Format input: auto-uppercase and smart dash formatting
   */
  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // Auto format segments if starts with EDU
    if (raw.startsWith('EDU') && !raw.includes('-')) {
      const clean = raw.replace(/[^A-Z0-9]/g, '');
      let formatted = clean;
      if (clean.length > 3) {
        formatted = clean.slice(0, 3) + '-' + clean.slice(3);
      }
      if (clean.length > 7) {
        formatted = clean.slice(0, 3) + '-' + clean.slice(3, 7) + '-' + clean.slice(7, 11);
      }
      raw = formatted;
    }

    setCode(raw);
    if (error) setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase();

    if (!clean || clean.length < 3) {
      setError(isAr ? 'يرجى إدخال كود صحيح للحصة أو الفصل الدراسي' : 'Please enter a valid session or classroom code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessData(null);

    try {
      let currentStudent = null;
      try {
        const cur = localStorage.getItem('current_student');
        if (cur) currentStudent = JSON.parse(cur);
      } catch {}

      const res = await fetch('/api/student/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean, student: currentStudent }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isAr ? 'فشل في تفعيل الكود' : 'Failed to redeem code'));
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || (isAr ? 'حدث خطأ أثناء تفعيل الكود، يرجى المحاولة مرة أخرى' : 'An error occurred while redeeming the code, please try again'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* ── Success View ────────────────────────────────────────────── */}
      {successData ? (
        <div className="rounded-2xl border border-ok/30 bg-white dark:bg-n-100 p-8 shadow-lg text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-ok-light border border-ok/30 text-ok mx-auto flex items-center justify-center shadow-inner">
            {successData.type === 'CLASSROOM' ? <BookOpen className="h-8 w-8" /> : <CheckCircle2 className="h-8 w-8" />}
          </div>

          {successData.type === 'CLASSROOM' && successData.classroom ? (
            <>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-ok bg-ok-light px-3 py-1 rounded-full border border-ok/20">
                  {isAr ? 'تم الانضمام للفصل الدراسي بنجاح 🎓' : 'Successfully joined classroom 🎓'}
                </span>
                <h2 className="text-xl font-bold text-n-800 dark:text-n-700 mt-2">
                  {successData.classroom.name}
                </h2>
                <p className="text-xs text-n-500 dark:text-n-400">
                  {isAr ? 'المادة:' : 'Subject:'} <strong className="text-accent">{successData.classroom.subject}</strong> · {isAr ? 'كود الفصل:' : 'Class Code:'}{' '}
                  <span className="font-mono font-bold text-accent">{successData.code}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl border border-n-200 dark:border-n-300 bg-n-50 dark:bg-n-200 text-start space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-n-500">{isAr ? 'معلم المادة:' : 'Teacher:'}</span>
                  <span className="font-bold text-n-700 dark:text-n-600">
                    {successData.classroom.teacherName || (isAr ? 'أ/ المعلم الأكاديمي' : 'Academic Teacher')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-n-500">{isAr ? 'حالة الفصل:' : 'Classroom Status:'}</span>
                  <span className="font-bold text-ok flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-ok" /> {isAr ? 'نشط ومعتمد' : 'Active & Verified'}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <Link href={`/${locale}/student/quizzes`} className="block">
                  <Button variant="primary" size="lg" className="w-full text-base font-bold shadow-md">
                    <ClipboardList className="h-5 w-5 me-1" />
                    {isAr ? 'عرض اختبارات هذا الفصل' : 'View Classroom Quizzes'}
                  </Button>
                </Link>

                <Link href={`/${locale}/student/assignments`} className="block">
                  <Button variant="secondary" size="md" className="w-full text-xs">
                    {isAr ? 'عرض واجبات الفصل' : 'View Classroom Assignments'}
                  </Button>
                </Link>

                <Link href={`/${locale}/student`} className="block">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-n-500">
                    {isAr ? 'العودة للوحة تحكم الطالب' : 'Return to Student Dashboard'}
                  </Button>
                </Link>
              </div>
            </>
          ) : successData.liveSession ? (
            <>
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-ok bg-ok-light px-3 py-1 rounded-full border border-ok/20">
                  {isAr ? 'تم التفعيل والاشتراك بنجاح 🎉' : 'Activated and subscribed successfully 🎉'}
                </span>
                <h2 className="text-xl font-bold text-n-800 dark:text-n-700 mt-2">
                  {successData.liveSession.title}
                </h2>
                <p className="text-xs text-n-500 dark:text-n-400">
                  {successData.liveSession.classroomName || (isAr ? 'الفصل الدراسي' : 'Classroom')} · {isAr ? 'الكود المفعل:' : 'Redeemed Code:'}{' '}
                  <span className="font-mono font-bold text-accent">{successData.code}</span>
                </p>
              </div>

              {/* Session details card */}
              <div className="p-4 rounded-xl border border-n-200 dark:border-n-300 bg-n-50 dark:bg-n-200 text-start space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-n-500">{isAr ? 'حالة الحصة الآن:' : 'Live Status:'}</span>
                  {successData.liveSession.isActive ? (
                    <span className="font-bold text-ok flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-ok animate-ping" /> {isAr ? 'مباشر الآن' : 'Live Now'}
                    </span>
                  ) : (
                    <span className="font-medium text-n-500">{isAr ? 'مجدولة / لم تبدأ بعد' : 'Scheduled / Not started yet'}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-n-500">{isAr ? 'كود الغرفة:' : 'Room Code:'}</span>
                  <code className="font-mono font-bold text-accent bg-white dark:bg-n-100 px-2 py-0.5 rounded border border-accent/20">
                    {successData.liveSession.roomCode}
                  </code>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5 pt-2">
                <Link
                  href={`/${locale}/student/live?room=${successData.liveSession.roomCode}&name=${encodeURIComponent(studentName || (isAr ? 'الطالب' : 'Student'))}`}
                  className="block"
                >
                  <Button variant="primary" size="lg" className="w-full text-base font-bold shadow-md">
                    <Wifi className="h-5 w-5 me-1" />
                    {isAr ? 'دخول الحصة المباشرة الآن' : 'Join Live Session Now'}
                  </Button>
                </Link>

                <Link href={`/${locale}/student`} className="block">
                  <Button variant="secondary" size="md" className="w-full text-xs">
                    {isAr ? 'العودة للوحة تحكم الطالب' : 'Return to Student Dashboard'}
                  </Button>
                </Link>
              </div>
            </>
          ) : null}
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
            <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">
              {isAr ? 'استخدام كود الجلسة' : 'Redeem Session Code'}
            </h1>
            <p className="text-xs text-n-500 dark:text-n-400 max-w-xs mx-auto leading-relaxed">
              {isAr
                ? 'أدخل الكود الذي حصلت عليه (من السنتر أو فودافون كاش) للوصول إلى الحصة المباشرة فوراً'
                : 'Enter the code you received (from center or Vodafone Cash) to access the live session immediately'}
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
                {isAr ? 'كود التفعيل (Access Code):' : 'Access Code:'}
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
                {isAr ? 'الكود يُستخدم لمرة واحدة فقط ويرتبط بحسابك تلقائياً' : 'Code is for one-time use only and links to your account automatically'}
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full text-base font-bold shadow-md h-12"
            >
              {isAr ? 'تفعيل الكود والاشتراك' : 'Redeem Code & Activate'}
            </Button>
          </form>

          {/* Back link */}
          <div className="pt-2 border-t border-n-100 dark:border-n-200">
            <Link
              href={`/${locale}/student`}
              className="text-xs text-n-500 hover:text-accent font-semibold inline-flex items-center gap-1 transition-colors"
            >
              {isAr ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
              {isAr ? 'العودة إلى لوحة تحكم الطالب' : 'Return to Student Dashboard'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
