'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Lock, Mail, KeyRound, GraduationCap, Users, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { verifyStudentCredentials, normalizeArabic } from '@/actions/auth';
import { getConsistentStudentPin } from '@/lib/utils';

const defaultStudents = [
  {
    id: 'demo-student-1',
    name: 'أحمد محمد علي',
    studentCode: 'STU-001',
    code: 'STU-001',
    phone: '01099998888',
    password: '3842',
    defaultPassword: '3842',
    role: 'STUDENT',
    grade: 'الصف الثالث الإعدادي',
  },
  {
    id: 'demo-student-2',
    name: 'زياد طارق إبراهيم',
    studentCode: 'STU-777',
    code: 'STU-777',
    phone: '01055554444',
    password: '7195',
    defaultPassword: '7195',
    role: 'STUDENT',
    grade: 'الصف الثالث الإعدادي',
  },
];

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
    setLoading(true);
    setError('');

    const cleanIdentifier = (studentIdentifier || '').trim().toLowerCase();
    const cleanPin = (studentPassword || '').trim();

    if (!cleanIdentifier || !cleanPin) {
      setError(isAr ? 'يرجى إدخال كود الطالب/الهاتف وكلمة المرور' : 'Please enter student code/phone and password');
      setLoading(false);
      return;
    }

    try {
      // 1. Direct & Robust Client-Side Authentication from dynamic storage
      let studentsList: any[] = [];
      try {
        const localStudents = localStorage.getItem('edu_students');
        if (localStudents) {
          const parsed = JSON.parse(localStudents);
          if (Array.isArray(parsed)) studentsList = parsed;
        }
      } catch (err) {
        console.error('Storage error:', err);
      }

      // Merge with initial/default students if empty
      if (!studentsList || studentsList.length === 0) {
        studentsList = defaultStudents;
      }

      const normalizedInput = normalizeArabic(cleanIdentifier);
      const cleanUpper = cleanIdentifier.toUpperCase();

      // Flexible Match: Code, StudentCode, Phone, Name, or ID
      const matchedStudent = studentsList.find((s: any) => {
        const matchCode = s.code && (s.code.trim().toLowerCase() === cleanIdentifier || s.code.trim().toUpperCase() === cleanUpper);
        const matchStudentCode = s.studentCode && (s.studentCode.trim().toLowerCase() === cleanIdentifier || s.studentCode.trim().toUpperCase() === cleanUpper);
        const matchPhone = s.phone && (s.phone.trim() === cleanIdentifier || s.phone.trim() === studentIdentifier.trim());
        const matchId = s.id && (s.id.trim().toLowerCase() === cleanIdentifier || s.id.trim().toUpperCase() === cleanUpper);
        
        const sNameNorm = normalizeArabic(s.name || '');
        const matchName =
          s.name &&
          (s.name.trim().toLowerCase() === cleanIdentifier ||
            (sNameNorm && (sNameNorm === normalizedInput || sNameNorm.includes(normalizedInput) || normalizedInput.includes(sNameNorm))));

        return matchCode || matchStudentCode || matchPhone || matchName || matchId;
      });

      if (matchedStudent) {
        if (matchedStudent.isActive === false) {
          router.push(`/${locale}/suspended`);
          return;
        }

        // Verify PIN (allow direct match, defaultPassword, derived PIN, or '1234' fallback)
        const storedPass = String(matchedStudent.password || matchedStudent.defaultPassword || '').trim();
        const storedDefPass = String(matchedStudent.defaultPassword || matchedStudent.password || '').trim();
        const derivedPin = getConsistentStudentPin(matchedStudent.studentCode || matchedStudent.code || matchedStudent.id);

        const isPinMatch =
          cleanPin === storedPass ||
          cleanPin === storedDefPass ||
          cleanPin === derivedPin ||
          cleanPin === '1234';

        if (!isPinMatch) {
          setError(isAr ? 'كلمة المرور غير صحيحة، يرجى التأكد من الرمز المكون من 4 أرقام' : 'Invalid password');
          setLoading(false);
          return;
        }

        // Save session and cookies
        try {
          localStorage.setItem('current_student', JSON.stringify(matchedStudent));
          const sessionPayload = {
            id: matchedStudent.id || matchedStudent.studentCode || matchedStudent.code,
            name: matchedStudent.name,
            role: 'STUDENT',
            studentCode: matchedStudent.studentCode || matchedStudent.code,
            phone: matchedStudent.phone,
            grade: matchedStudent.grade || matchedStudent.gradeLevel || 'الصف الثالث الإعدادي',
            isActive: true,
          };
          document.cookie = `user_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        } catch (e) {}

        // Ping server route in background to ensure server session sync
        fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentCode: matchedStudent.studentCode || matchedStudent.code || cleanUpper,
            password: cleanPin,
            role: 'STUDENT',
            localStudent: matchedStudent,
          }),
        }).catch(() => {});

        router.push(`/${locale}/student`);
        return;
      }

      // 2. Fallback to centralized server action verification for DB students
      const result = await verifyStudentCredentials(studentIdentifier, studentPassword);

      if (!result.success) {
        if (result.error?.includes('تعليق') || result.error?.includes('محظور')) {
          router.push(`/${locale}/suspended`);
          return;
        }
        setError(result.error || (isAr ? 'كود الطالب أو كلمة المرور غير صحيحة' : 'Invalid student credentials'));
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
              {isAr ? 'كلمة المرور / الرمز السري' : 'Password'}
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
