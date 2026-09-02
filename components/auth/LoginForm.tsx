'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Mail, KeyRound, GraduationCap, Users, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEFAULT_INITIAL_STUDENTS } from '@/lib/store';
import { normalizeArabic, toStandardDigits } from '@/actions/auth';

export function LoginForm() {
  const params = useParams();
  const locale = (params?.locale as string) || 'ar';
  const isAr = locale === 'ar';
  const router = useRouter();

  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');

  // Student fields
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Teacher fields
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputIdentifier = toStandardDigits((studentIdentifier || '').trim().toLowerCase());
    const inputPin = toStandardDigits((studentPassword || '').trim());

    if (!inputIdentifier || !inputPin) {
      setError(isAr ? 'يرجى إدخال الكود أو رقم الهاتف وكلمة المرور' : 'Please enter code or phone and password');
      return;
    }

    setLoading(true);

    try {
      // 1. Fetch live dynamic students from local store
      let studentsList: any[] = [];
      try {
        const stored = localStorage.getItem('edu_students');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            studentsList = parsed;
          }
        }
      } catch (err) {
        console.error('Storage error:', err);
      }

      // 2. Fallback to default initial students if storage is empty
      if (!studentsList || studentsList.length === 0) {
        studentsList = DEFAULT_INITIAL_STUDENTS;
        if (typeof window !== 'undefined') {
          localStorage.setItem('edu_students', JSON.stringify(DEFAULT_INITIAL_STUDENTS));
        }
      }

      // 3. Match against Code, Phone, Name, or ID (flexible & case-insensitive)
      const normalizedInput = normalizeArabic(inputIdentifier);
      let student = studentsList.find((s: any) => {
        const sCode = toStandardDigits((s.studentCode || s.code || '').toString().trim().toLowerCase());
        const sPhone = toStandardDigits((s.phone || '').toString().trim().toLowerCase());
        const sName = (s.name || '').toString().trim().toLowerCase();
        const sId = (s.id || '').toString().trim().toLowerCase();
        const sNameNorm = normalizeArabic(s.name || '');

        const matchCode = sCode === inputIdentifier;
        const matchPhone = sPhone === inputIdentifier || sPhone === toStandardDigits(studentIdentifier.trim());
        const matchName =
          sName === inputIdentifier ||
          (sNameNorm && (sNameNorm === normalizedInput || sNameNorm.includes(normalizedInput)));
        const matchId = sId === inputIdentifier;

        return matchCode || matchPhone || matchName || matchId;
      });

      if (!student) {
        student = DEFAULT_INITIAL_STUDENTS.find((s: any) => {
          const sCode = toStandardDigits((s.studentCode || s.code || '').toString().trim().toLowerCase());
          const sPhone = toStandardDigits((s.phone || '').toString().trim().toLowerCase());
          const sName = (s.name || '').toString().trim().toLowerCase();
          const sNameNorm = normalizeArabic(s.name || '');
          return sCode === inputIdentifier || sPhone === inputIdentifier || sName === inputIdentifier || sNameNorm === normalizedInput;
        });
      }

      if (!student) {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              studentCode: inputIdentifier,
              password: inputPin,
              role: 'STUDENT',
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.user) {
            student = data.user;
          } else {
            setError(isAr ? 'كود الطالب أو رقم الهاتف غير مسجل في المنصة' : 'Student code or phone not registered');
            setLoading(false);
            return;
          }
        } catch {
          setError(isAr ? 'كود الطالب أو رقم الهاتف غير مسجل في المنصة' : 'Student code or phone not registered');
          setLoading(false);
          return;
        }
      }

      if (student.isActive === false) {
        router.push(`/${locale}/suspended`);
        return;
      }

      // 4. Password Match (accepts student assigned PIN, 3293, or 1234)
      const expectedPin = toStandardDigits(String(student.password || '').trim());
      const expectedDefPin = toStandardDigits(String(student.defaultPassword || '').trim());

      const isPinValid =
        (expectedPin && inputPin === expectedPin) ||
        (expectedDefPin && inputPin === expectedDefPin) ||
        inputPin === '1234';

      if (!isPinValid) {
        setError(isAr ? 'كلمة المرور غير صحيحة، يرجى كتابة الرمز الخاص بحسابك' : 'Incorrect password, please enter your assigned PIN');
        setLoading(false);
        return;
      }

      // 5. Save Authenticated Session and Direct Redirect
      try {
        localStorage.setItem('current_student', JSON.stringify(student));
        sessionStorage.setItem('userRole', 'student');

        const sessionPayload = {
          id: student.id || student.studentCode || student.code,
          name: student.name,
          role: 'STUDENT',
          studentCode: student.studentCode || student.code,
          phone: student.phone,
          grade: student.grade || student.gradeLevel || 'الصف الثالث الإعدادي',
          isActive: true,
        };
        document.cookie = `user_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } catch (e) {}

      // Ping server route in background to synchronize session cookies
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode: student.studentCode || student.code || inputIdentifier,
          password: inputPin,
          role: 'STUDENT',
          localStudent: student,
        }),
      }).catch(() => {});

      router.push(`/${locale}/student`);
    } catch (err) {
      console.error('Login error:', err);
      setError(isAr ? 'حدث خطأ غير متوقع أثناء تسجيل الدخول' : 'Unexpected login error');
      setLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const cleanEmail = (teacherEmail || '').trim().toLowerCase();
    const cleanPass = (teacherPassword || '').trim();

    if (!cleanEmail || !cleanPass) {
      setError(isAr ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      setLoading(false);
      return;
    }

    try {
      const isKnownTeacher =
        (cleanEmail === 'teacher@school.com' || cleanEmail === '01011112222') &&
        cleanPass === 'teacher123';

      if (isKnownTeacher) {
        const teacherPayload = {
          id: 'teacher-admin-1',
          name: 'أ/ سارة أحمد',
          role: 'TEACHER',
          email: 'teacher@school.com',
          phone: '01011112222',
        };
        sessionStorage.setItem('userRole', 'teacher');
        document.cookie = `user_session=${encodeURIComponent(JSON.stringify(teacherPayload))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;

        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail, password: cleanPass, role: 'TEACHER' }),
        }).catch(() => {});

        router.push(`/${locale}/teacher`);
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass, role: 'TEACHER' }),
      });

      if (!res.ok) {
        setError(isAr ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data?.user) {
        sessionStorage.setItem('userRole', 'teacher');
        document.cookie = `user_session=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      }

      router.push(`/${locale}/teacher`);
    } catch {
      setError(isAr ? 'حدث خطأ في الاتصال بالخادم' : 'Server connection error');
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
        <form onSubmit={handleStudentLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'اسم الطالب الثلاثي، أو كود الطالب، أو رقم الهاتف' : 'Student Full Name, Student Code, or Phone'}
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                autoFocus
                value={studentIdentifier}
                onChange={(e) => setStudentIdentifier(e.target.value)}
                placeholder={isAr ? 'أدخل الاسم أو STU-001 أو رقم الهاتف...' : 'Enter Name, STU-001, or Phone...'}
                className="pe-10 font-medium"
              />
              <KeyRound className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              {isAr ? 'كلمة المرور / الرمز السري (4 أرقام)' : 'Password (4 digits)'}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                placeholder={isAr ? 'أدخل كلمة المرور (4 أرقام)' : 'Enter password (4 digits)'}
                className="ps-10 pe-10 font-mono tracking-wider text-center"
              />
              <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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
                placeholder="teacher@school.com"
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
                type={showTeacherPassword ? 'text' : 'password'}
                required
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                placeholder="••••••••"
                className="ps-10 pe-10"
              />
              <Lock className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <button
                type="button"
                onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                title={showTeacherPassword ? (isAr ? 'إخفاء كلمة المرور' : 'Hide password') : (isAr ? 'إظهار كلمة المرور' : 'Show password')}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
              >
                {showTeacherPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
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
