'use client';

export interface StudentAuthResult {
  success: boolean;
  error?: string;
  student?: any;
}

export function toStandardDigits(str: string): string {
  if (!str) return '';
  return str
    .replace(/[٠۰]/g, '0')
    .replace(/[١۱]/g, '1')
    .replace(/[٢۲]/g, '2')
    .replace(/[٣۳]/g, '3')
    .replace(/[٤۴]/g, '4')
    .replace(/[٥۵]/g, '5')
    .replace(/[٦۶]/g, '6')
    .replace(/[٧۷]/g, '7')
    .replace(/[٨۸]/g, '8')
    .replace(/[٩۹]/g, '9');
}

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove diacritics
    .replace(/\s+/g, ' ');
}

import { verifyStudentCredentialsAction } from './auth-server';

export { verifyStudentCredentialsAction };

/**
 * Server-Authoritative Production Student Authentication:
 * 1. Communicates exclusively with the central Server API (/api/auth/login).
 * 2. Authenticates directly against the central Supabase database.
 * 3. Zero mock data, zero fake arrays, zero client-side credentials bypass.
 */
export async function verifyStudentCredentials(inputIdentifier: string, inputPin: string): Promise<StudentAuthResult> {
  const cleanIdentifier = toStandardDigits((inputIdentifier || '').trim());
  const cleanPin = toStandardDigits((inputPin || '').trim());

  if (!cleanIdentifier || !cleanPin) {
    return { success: false, error: 'يرجى إدخال الكود أو رقم الهاتف وكلمة المرور' };
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: cleanIdentifier,
        password: cleanPin,
        role: 'STUDENT',
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok && data?.success && data?.user) {
      const student = data.user;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('current_student', JSON.stringify(student));
          sessionStorage.setItem('userRole', 'student');

          const sessionPayload = {
            id: student.id || student.studentCode,
            name: student.name,
            role: 'STUDENT',
            studentCode: student.studentCode,
            phone: student.phone || '',
            grade: student.grade || '',
            isActive: true,
          };
          document.cookie = `user_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
        } catch (e) {}
      }

      return { success: true, student };
    }

    if (res.status === 403 || data?.error === 'SUSPENDED') {
      return { success: false, error: data?.message || 'تم تعليق هذا الحساب. يرجى مراجعة إدارة المنصة.' };
    }

    if (res.status === 401) {
      return { success: false, error: data?.error || 'كلمة المرور غير صحيحة، يرجى كتابة الرمز الخاص بحسابك' };
    }

    if (res.status === 404) {
      return { success: false, error: data?.error || 'كود الطالب غير صحيح أو غير مسجل' };
    }

    return {
      success: false,
      error: data?.error || 'بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة مجدداً',
    };
  } catch (netErr: any) {
    console.error('[Auth] Server fetch error:', netErr);
    return {
      success: false,
      error: 'تعذر الاتصال بالخادم السحابي المركزي، يرجى التحقق من اتصال الإنترنت والمحاولة ثانية',
    };
  }
}

// Aliases for comprehensive backwards compatibility
export const authenticateStudentStrictly = verifyStudentCredentials;
export const authenticateStudent = verifyStudentCredentials;
export const verifyStudentLogin = verifyStudentCredentials;
