'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Lock, Mail, KeyRound, Phone, GraduationCap,
  Users, ShieldAlert, CheckCircle2, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function RootLoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isAr = locale === 'ar';
  const router = useRouter();

  // Role: STUDENT | TEACHER | PARENT
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'PARENT'>('STUDENT');

  // Teacher fields
  const [teacherEmail, setTeacherEmail] = useState('teacher@school.com');
  const [teacherPassword, setTeacherPassword] = useState('teacher123');

  // Student fields
  const [studentCode, setStudentCode] = useState('STU-001');
  const [studentPassword, setStudentPassword] = useState('1234');

  // Parent fields
  const [parentStudentCode, setParentStudentCode] = useState('STU-001');
  const [parentPhone, setParentPhone] = useState('01012345678');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: teacherEmail, password: teacherPassword, role: 'TEACHER' }),
      });

      if (!res.ok) {
        setError(isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
        return;
      }

      router.push(`/${locale}/teacher`);
    } catch {
      setError(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentCode, password: studentPassword, role: 'STUDENT' }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'SUSPENDED' || res.status === 403) {
          router.push(`/${locale}/suspended`);
          return;
        }
        setError(data.message || (isAr ? 'كود الطالب أو كلمة المرور غير صحيحة' : 'Invalid student code or password'));
        return;
      }

      router.push(`/${locale}/student`);
    } catch {
      setError(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/parent/dashboard?code=${parentStudentCode}&phone=${parentPhone}`);
      if (!res.ok) {
        setError(isAr ? 'تعذر العثور على بيانات الطالب أو رقم الهاتف غير مطابق' : 'Student data not found or phone does not match');
        return;
      }
      sessionStorage.setItem('parent_auth', JSON.stringify({ phone: parentPhone, studentCode: parentStudentCode }));
      router.push(`/${locale}/parent/dashboard`);
    } catch {
      setError(isAr ? 'حدث خطأ أثناء الاستعلام عن بيانات الطالب' : 'Error retrieving student report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header Bar */}
      <header className="w-full border-b border-n-200 dark:border-n-300 bg-white dark:bg-n-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🎓
            </div>
            <div>
              <span className="font-bold text-base text-n-800 dark:text-n-700 block leading-tight">
                {isAr ? 'منصة التعليم الإلكتروني' : 'EduPlatform'}
              </span>
              <span className="text-[10px] text-n-400 font-medium block">
                {isAr ? 'بوابة تسجيل الدخول الموحدة' : 'Unified Login Portal'}
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Authentication Portal */}
      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="bg-white dark:bg-n-100 rounded-2xl border border-n-200 dark:border-n-300 p-6 sm:p-8 w-full max-w-md shadow-lg space-y-6">
          
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-accent-light text-accent font-bold text-xl mb-1 border border-accent/20">
              {role === 'STUDENT' && <GraduationCap className="h-6 w-6" />}
              {role === 'TEACHER' && <Users className="h-6 w-6" />}
              {role === 'PARENT' && <UserCheck className="h-6 w-6" />}
            </div>
            <h1 className="text-xl font-bold text-n-800 dark:text-n-700">
              {isAr ? 'تسجيل الدخول للمنصة' : 'Sign in to Platform'}
            </h1>
            <p className="text-xs text-n-500 dark:text-n-400">
              {isAr
                ? 'اختر نوع حسابك للمتابعة إلى لوحة التحكم الخاصة بك'
                : 'Select your account role to proceed to your dashboard'}
            </p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-3 bg-n-100 dark:bg-n-200 p-1.5 rounded-xl border border-n-200 dark:border-n-300 gap-1">
            <button
              type="button"
              onClick={() => { setRole('STUDENT'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                role === 'STUDENT'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-n-600 dark:text-n-400 hover:text-n-800 hover:bg-white/50 dark:hover:bg-n-100/50'
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              {isAr ? 'دخول الطالب' : 'Student'}
            </button>
            <button
              type="button"
              onClick={() => { setRole('TEACHER'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                role === 'TEACHER'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-n-600 dark:text-n-400 hover:text-n-800 hover:bg-white/50 dark:hover:bg-n-100/50'
              }`}
            >
              <Users className="h-4 w-4" />
              {isAr ? 'لوحة المعلم' : 'Teacher'}
            </button>
            <button
              type="button"
              onClick={() => { setRole('PARENT'); setError(''); }}
              className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                role === 'PARENT'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-n-600 dark:text-n-400 hover:text-n-800 hover:bg-white/50 dark:hover:bg-n-100/50'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              {isAr ? 'ولي الأمر' : 'Parent'}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-xs text-bad bg-bad-light p-3 rounded-xl text-center border border-bad/20 font-medium animate-shake">
              {error}
            </div>
          )}

          {/* Student Form */}
          {role === 'STUDENT' && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1.5">
                  {isAr ? 'كود الطالب أو رقم الهاتف المسجل:' : 'Student Code or Phone Number:'}
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    placeholder="STU-001 أو 01099998888"
                    className="pe-9 font-mono font-bold tracking-wider text-center"
                  />
                  <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1.5">
                  {isAr ? 'كلمة المرور (الافتراضية: 1234):' : 'Password:'}
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••"
                    className="pe-9"
                  />
                  <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
                </div>
              </div>

              <Button type="submit" loading={loading} variant="primary" className="w-full h-11 text-xs font-bold mt-2 shadow-md">
                {isAr ? 'تسجيل دخول الطالب' : 'Sign in as Student'}
              </Button>
            </form>
          )}

          {/* Teacher Form */}
          {role === 'TEACHER' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1.5">
                  {isAr ? 'البريد الإلكتروني للمعلم أو رقم الهاتف:' : 'Teacher Email or Phone:'}
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="teacher@school.com"
                    className="pe-9"
                  />
                  <Mail className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1.5">
                  {isAr ? 'كلمة المرور:' : 'Password:'}
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pe-9"
                  />
                  <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
                </div>
              </div>

              <Button type="submit" loading={loading} variant="primary" className="w-full h-11 text-xs font-bold mt-2 shadow-md">
                {isAr ? 'دخول لوحة تحكم المعلم' : 'Sign in as Teacher'}
              </Button>
            </form>
          )}

          {/* Parent Form */}
          {role === 'PARENT' && (
            <form onSubmit={handleParentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1.5">
                  {isAr ? 'كود الطالب المراد متابعته:' : 'Student Code:'}
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={parentStudentCode}
                    onChange={(e) => setParentStudentCode(e.target.value.toUpperCase())}
                    placeholder="STU-001"
                    className="pe-9 font-mono font-bold tracking-wider text-center"
                  />
                  <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1.5">
                  {isAr ? 'رقم هاتف ولي الأمر (المسجل لدى المعلم):' : 'Registered Parent Phone Number:'}
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="01012345678"
                    className="pe-9 font-mono"
                  />
                  <Phone className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
                </div>
              </div>

              <Button type="submit" loading={loading} variant="primary" className="w-full h-11 text-xs font-bold mt-2 shadow-md">
                {isAr ? 'استعلام عن تقرير ودرجات الطالب' : 'Access Parent Portal'}
              </Button>
            </form>
          )}

          {/* Quick Demo Credentials Footer Note */}
          <div className="pt-3 border-t border-n-100 dark:border-n-200 text-center">
            <p className="text-[11px] text-n-400 leading-relaxed">
              {isAr
                ? 'الحسابات التجريبية جاهزة مسبقاً: الطالب (STU-001 / 1234) · المعلم (teacher@school.com / teacher123)'
                : 'Demo credentials prefilled: Student (STU-001 / 1234) · Teacher (teacher@school.com / teacher123)'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-n-200 dark:border-n-300 py-4 text-center text-xs text-n-400 bg-white dark:bg-n-100">
        <p>© {new Date().getFullYear()} {isAr ? 'منصة التعليم الإلكتروني — جميع الحقوق محفوظة' : 'EduPlatform — All Rights Reserved'}</p>
      </footer>
    </div>
  );
}
