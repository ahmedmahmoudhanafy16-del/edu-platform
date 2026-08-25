'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Lock, Mail, KeyRound, Phone, GraduationCap, Users, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function UnifiedLoginPage() {
  const locale = useLocale();
  const router = useRouter();

  // Role: TEACHER | STUDENT | PARENT
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | 'PARENT'>('STUDENT');

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 w-full max-w-md shadow-lg space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-2xl mb-3 shadow-md">
            🎓
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">تسجيل الدخول للمنصة</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">اختر نوع الحساب للوصول إلى لوحة التحكم الخاصة بك</p>
        </div>

        {/* Tabs for Role Selection */}
        <Tabs defaultValue="STUDENT" value={role} onValueChange={(v) => { setRole(v as any); setError(''); }}>
          <TabsList className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl mb-4">
            <TabsTrigger value="STUDENT" className="text-xs font-bold gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <GraduationCap className="h-3.5 w-3.5" />
              طالب
            </TabsTrigger>
            <TabsTrigger value="TEACHER" className="text-xs font-bold gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Users className="h-3.5 w-3.5" />
              معلم
            </TabsTrigger>
            <TabsTrigger value="PARENT" className="text-xs font-bold gap-1.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              👨‍👩‍👦
              ولي أمر
            </TabsTrigger>
          </TabsList>

          {error && (
            <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 p-3 rounded-lg text-center border border-red-200 dark:border-red-800 mb-4 flex items-center justify-center gap-1.5 font-medium">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              {error}
            </div>
          )}

          {/* Student Form */}
          <TabsContent value="STUDENT">
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  كود الطالب أو رقم الهاتف:
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                    placeholder="STU-001 أو رقم الهاتف"
                    className="pe-8 font-mono font-bold tracking-wider text-center h-10"
                  />
                  <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور:
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={studentPassword}
                    onChange={(e) => setStudentPassword(e.target.value)}
                    placeholder="••••"
                    className="pe-8 h-10"
                  />
                  <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm">
                دخول كطالب
              </Button>
            </form>
          </TabsContent>

          {/* Teacher Form */}
          <TabsContent value="TEACHER">
            <form onSubmit={handleTeacherSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  البريد الإلكتروني للمعلم:
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="teacher@school.com"
                    className="pe-8 h-10"
                  />
                  <Mail className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  كلمة المرور:
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pe-8 h-10"
                  />
                  <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm">
                دخول كمعلم
              </Button>
            </form>
          </TabsContent>

          {/* Parent Form */}
          <TabsContent value="PARENT">
            <form onSubmit={handleParentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  كود الطالب:
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    value={parentStudentCode}
                    onChange={(e) => setParentStudentCode(e.target.value.toUpperCase())}
                    placeholder="STU-001"
                    className="pe-8 font-mono font-bold tracking-wider text-center h-10"
                  />
                  <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  رقم هاتف ولي الأمر (المسجل):
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="01012345678"
                    className="pe-8 font-mono h-10"
                  />
                  <Phone className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <Button type="submit" loading={loading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm">
                استعلام عن تقرير الطالب
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
          <Link href={`/${locale}`} className="text-xs text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1">
            العودة إلى الصفحة الرئيسية
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
