'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  Lock, Mail, KeyRound, GraduationCap, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { verifyStudentCredentials } from '@/actions/auth';

export default function LoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isAr = locale === 'ar';
  const router = useRouter();

  // Role: STUDENT | TEACHER (Default is STUDENT)
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  // Student fields
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Teacher fields
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verifyStudentCredentials(studentIdentifier, studentPassword);

      if (!result.success) {
        if (result.error?.includes('تعليق') || result.error?.includes('محظور')) {
          router.push(`/${locale}/suspended`);
          return;
        }
        setError(result.error || (isAr ? 'كود الطالب أو كلمة المرور غير صحيحة' : 'Invalid student code or password'));
        return;
      }

      router.push(`/${locale}/student`);
    } catch {
      setError(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

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
              {role === 'STUDENT' ? <GraduationCap className="h-6 w-6" /> : <Users className="h-6 w-6" />}
            </div>
            <h1 className="text-xl font-bold text-n-800 dark:text-n-700">
              {role === 'STUDENT' && (isAr ? 'تسجيل دخول الطالب' : 'Student Login')}
              {role === 'TEACHER' && (isAr ? 'تسجيل دخول المعلم' : 'Teacher Login')}
            </h1>
            <p className="text-xs text-n-400">
              {role === 'STUDENT' && (isAr ? 'أدخل كود الطالب وكلمة المرور للوصول لحصصك وامتحاناتك' : 'Enter your student code and password')}
              {role === 'TEACHER' && (isAr ? 'أدخل البريد الإلكتروني للمتابعة وإدارة المحتوى والطلاب' : 'Enter your teacher credentials')}
            </p>
          </div>

          {/* Role Tabs Switcher: Exactly 2 Roles (Student & Teacher) */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-n-100 dark:bg-n-200 rounded-xl border border-n-200 dark:border-n-300 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setRole('STUDENT'); setError(''); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === 'STUDENT'
                  ? 'bg-white dark:bg-n-100 text-accent shadow-sm border border-n-200/60 dark:border-n-300'
                  : 'text-n-500 hover:text-n-700'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {isAr ? 'دخول الطالب' : 'Student'}
            </button>

            <button
              type="button"
              onClick={() => { setRole('TEACHER'); setError(''); }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                role === 'TEACHER'
                  ? 'bg-white dark:bg-n-100 text-accent shadow-sm border border-n-200/60 dark:border-n-300'
                  : 'text-n-500 hover:text-n-700'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              {isAr ? 'لوحة تحكم المعلم' : 'Teacher'}
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
                  {isAr ? 'اسم الطالب الثلاثي، أو كود الطالب، أو رقم الهاتف' : 'Student Full Name, Student Code, or Phone:'}
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={studentIdentifier}
                    onChange={(e) => setStudentIdentifier(e.target.value)}
                    placeholder={isAr ? 'أدخل الاسم أو STU-001 أو رقم الهاتف...' : 'Enter Name, STU-001, or Phone...'}
                    className="pe-9 font-medium text-center"
                  />
                  <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
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
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••••••"
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
                    placeholder={isAr ? 'example@domain.com' : 'teacher@example.com'}
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
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-n-200 dark:border-n-300 py-4 text-center text-xs text-n-400 bg-white dark:bg-n-100">
        <p>© {new Date().getFullYear()} {isAr ? 'منصة التعليم الإلكتروني — جميع الحقوق محفوظة' : 'EduPlatform — All Rights Reserved'}</p>
      </footer>
    </div>
  );
}
