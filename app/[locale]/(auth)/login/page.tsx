'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Lock, Mail, KeyRound, Phone, GraduationCap, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UnifiedLoginPage() {
  const locale = useLocale();
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
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        return;
      }

      router.push(`/${locale}/teacher`);
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
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

      if (!res.ok) {
        setError('كود الطالب أو كلمة المرور غير صحيحة');
        return;
      }

      router.push(`/${locale}/student`);
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
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
        setError('تعذر العثور على بيانات الطالب أو رقم الهاتف غير مطابق');
        return;
      }
      sessionStorage.setItem('parent_auth', JSON.stringify({ phone: parentPhone, studentCode: parentStudentCode }));
      router.push(`/${locale}/parent/dashboard`);
    } catch {
      setError('حدث خطأ أثناء الاستعلام عن بيانات الطالب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-n-50 dark:bg-n-50" dir="rtl">
      <div className="bg-white dark:bg-n-100 rounded-xl border border-n-200 dark:border-n-300 p-8 w-full max-w-md shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-accent text-white font-bold text-xl mb-3 shadow-sm">
            🎓
          </div>
          <h1 className="text-xl font-bold text-n-800 dark:text-n-700">تسجيل الدخول للمنصة</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">اختر نوع الحساب للوصول إلى لوحة التحكم الخاصة بك</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 bg-n-100 dark:bg-n-200 p-1 rounded-lg border border-n-200 dark:border-n-300">
          <button
            type="button"
            onClick={() => { setRole('STUDENT'); setError(''); }}
            className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
              role === 'STUDENT'
                ? 'bg-accent text-white shadow-sm'
                : 'text-n-600 dark:text-n-400 hover:text-n-800'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            طالب
          </button>
          <button
            type="button"
            onClick={() => { setRole('TEACHER'); setError(''); }}
            className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
              role === 'TEACHER'
                ? 'bg-accent text-white shadow-sm'
                : 'text-n-600 dark:text-n-400 hover:text-n-800'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            معلم
          </button>
          <button
            type="button"
            onClick={() => { setRole('PARENT'); setError(''); }}
            className={`py-1.5 text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${
              role === 'PARENT'
                ? 'bg-accent text-white shadow-sm'
                : 'text-n-600 dark:text-n-400 hover:text-n-800'
            }`}
          >
            👨‍👩‍👦
            ولي أمر
          </button>
        </div>

        {error && (
          <div className="text-xs text-bad bg-bad-light p-2.5 rounded-md text-center border border-bad/20 font-medium">
            {error}
          </div>
        )}

        {/* Student Form */}
        {role === 'STUDENT' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
                كود الطالب أو رقم الهاتف:
              </label>
              <div className="relative">
                <Input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                  placeholder="STU-001 أو رقم الهاتف"
                  className="pe-8 font-mono font-bold tracking-wider text-center"
                />
                <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
                كلمة المرور:
              </label>
              <div className="relative">
                <Input
                  type="password"
                  required
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="••••"
                  className="pe-8"
                />
                <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
              </div>
            </div>

            <Button type="submit" loading={loading} variant="primary" className="w-full h-10 mt-2">
              دخول كطالب
            </Button>
          </form>
        )}

        {/* Teacher Form */}
        {role === 'TEACHER' && (
          <form onSubmit={handleTeacherSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
                البريد الإلكتروني للمعلم:
              </label>
              <div className="relative">
                <Input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="pe-8"
                />
                <Mail className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
                كلمة المرور:
              </label>
              <div className="relative">
                <Input
                  type="password"
                  required
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pe-8"
                />
                <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
              </div>
            </div>

            <Button type="submit" loading={loading} variant="primary" className="w-full h-10 mt-2">
              دخول كمعلم
            </Button>
          </form>
        )}

        {/* Parent Form */}
        {role === 'PARENT' && (
          <form onSubmit={handleParentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
                كود الطالب:
              </label>
              <div className="relative">
                <Input
                  type="text"
                  required
                  value={parentStudentCode}
                  onChange={(e) => setParentStudentCode(e.target.value.toUpperCase())}
                  placeholder="STU-001"
                  className="pe-8 font-mono font-bold tracking-wider text-center"
                />
                <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-n-700 dark:text-n-600 mb-1">
                رقم هاتف ولي الأمر (المسجل):
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  required
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="01012345678"
                  className="pe-8 font-mono"
                />
                <Phone className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
              </div>
            </div>

            <Button type="submit" loading={loading} variant="primary" className="w-full h-10 mt-2">
              استعلام عن تقرير الطالب
            </Button>
          </form>
        )}

        <div className="pt-2 border-t border-n-100 dark:border-n-200 text-center">
          <Link href={`/${locale}`} className="text-xs text-n-500 hover:text-accent flex items-center justify-center gap-1">
            العودة إلى الصفحة الرئيسية
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
