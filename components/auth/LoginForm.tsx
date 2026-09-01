'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Mail, KeyRound, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyStudentLogin } from '@/actions/auth';

export function LoginForm() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isAr = locale === 'ar';
  const router = useRouter();

  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  // Student fields
  const [studentCode, setStudentCode] = useState('');
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
      const res = await verifyStudentLogin(studentCode, studentPassword);

      if (!res.success) {
        if (res.error?.includes('تعليق') || res.error?.includes('محظور')) {
          router.push(`/${locale}/suspended`);
          return;
        }
        setError(res.error || (isAr ? 'كود الطالب أو كلمة المرور غير صحيحة' : 'Invalid student code or password'));
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => {
            setRole('STUDENT');
            setError('');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
            role === 'STUDENT'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <GraduationCap className="h-4 w-4" />
          <span>{isAr ? 'دخول الطالب' : 'Student Login'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setRole('TEACHER');
            setError('');
          }}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
            role === 'TEACHER'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{isAr ? 'لوحة تحكم المعلم' : 'Teacher Portal'}</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3.5 rounded-xl text-xs font-semibold bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-center animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      {/* Student Login Form */}
      {role === 'STUDENT' && (
        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'كود الطالب أو رقم الهاتف' : 'Student Code or Phone'}
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                autoFocus
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder={isAr ? 'مثال: STU-001 أو 010...' : 'e.g. STU-001 or 010...'}
                className="pe-10 font-medium"
              />
              <KeyRound className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'كلمة المرور / الرمز السري' : 'Password'}
            </label>
            <div className="relative">
              <Input
                type="password"
                required
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder="••••"
                className="pe-10"
              />
              <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md shadow-blue-500/20"
          >
            {loading ? (isAr ? 'جاري تسجيل الدخول...' : 'Logging in...') : (isAr ? 'تسجيل دخول الطالب' : 'Sign in as Student')}
          </Button>
        </form>
      )}

      {/* Teacher Login Form */}
      {role === 'TEACHER' && (
        <form onSubmit={handleTeacherSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'البريد الإلكتروني للمعلم' : 'Teacher Email'}
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                autoFocus
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder={isAr ? 'teacher@school.com' : 'teacher@school.com'}
                className="pe-10 font-medium"
              />
              <Mail className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Input
                type="password"
                required
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                placeholder="••••••••"
                className="pe-10"
              />
              <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 text-sm shadow-md shadow-blue-500/20"
          >
            {loading ? (isAr ? 'جاري التحقق...' : 'Verifying...') : (isAr ? 'دخول لوحة التحكم' : 'Sign in to Dashboard')}
          </Button>
        </form>
      )}
    </div>
  );
}
