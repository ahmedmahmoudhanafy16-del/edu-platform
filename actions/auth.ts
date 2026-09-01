'use client';

export interface StudentAuthResult {
  success: boolean;
  error?: string;
  student?: any;
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

import { DEFAULT_INITIAL_STUDENTS } from '@/lib/store';

const defaultStudentsList = DEFAULT_INITIAL_STUDENTS;

/**
 * Strict Individual Student Authentication:
 * Matches student exclusively by their unique Code, registered Phone, Name, or ID.
 * Strictly verifies the specific password assigned to THIS student record (no shared '1234' fallback).
 */
export async function verifyStudentCredentials(inputIdentifier: string, inputPin: string): Promise<StudentAuthResult> {
  const cleanIdentifier = (inputIdentifier || '').trim();
  const cleanPin = (inputPin || '').trim();

  if (!cleanIdentifier || !cleanPin) {
    return { success: false, error: 'يرجى إدخال الكود أو رقم الهاتف وكلمة المرور' };
  }

  const normalizedInput = normalizeArabic(cleanIdentifier);
  const cleanUpper = cleanIdentifier.toUpperCase();
  const cleanLower = cleanIdentifier.toLowerCase();

  // 1. Retrieve all dynamic students from localStorage
  let students: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem('edu_students');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) students = parsed;
      }
    } catch (e) {
      console.error('Failed to parse edu_students', e);
    }
  }

  // 2. Fallback to default initial list if empty
  if (!students || students.length === 0) {
    students = defaultStudentsList;
  }

  // 3. Match against Student's own Code, Phone, Name, or ID
  const matchedStudent = students.find((s: any) => {
    const sNameNorm = normalizeArabic(s.name || '');
    const matchName =
      s.name &&
      (s.name.trim().toLowerCase() === cleanLower ||
        (sNameNorm && (sNameNorm === normalizedInput || sNameNorm.includes(normalizedInput) || normalizedInput.includes(sNameNorm))));

    const matchCode =
      s.code && (s.code.toString().trim().toUpperCase() === cleanUpper || s.code.toString().trim().toLowerCase() === cleanLower);

    const matchStudentCode =
      s.studentCode &&
      (s.studentCode.toString().trim().toUpperCase() === cleanUpper || s.studentCode.toString().trim().toLowerCase() === cleanLower);

    const matchId =
      s.id && (s.id.toString().trim().toUpperCase() === cleanUpper || s.id.toString().trim().toLowerCase() === cleanLower);

    const matchPhone =
      s.phone && (s.phone.toString().trim() === cleanIdentifier || s.phone.toString().trim() === cleanUpper);

    return matchName || matchCode || matchStudentCode || matchId || matchPhone;
  });

  // 4. If matched in local store
  if (matchedStudent) {
    if (matchedStudent.isActive === false) {
      return { success: false, error: 'تم تعليق هذا الحساب. يرجى مراجعة المعلمة.' };
    }

    // Strict Password Match: ONLY matches THIS specific student's assigned password
    const studentPassword = String(matchedStudent.password || '').trim();
    const studentDefaultPassword = String(matchedStudent.defaultPassword || '').trim();

    const isPinMatch =
      (studentPassword && cleanPin === studentPassword) ||
      (studentDefaultPassword && cleanPin === studentDefaultPassword);

    if (!isPinMatch) {
      return {
        success: false,
        error: 'كلمة المرور غير صحيحة، يرجى كتابة الرمز الخاص بحسابك',
      };
    }

    // Save Current Student Session
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('current_student', JSON.stringify(matchedStudent));
        sessionStorage.setItem('userRole', 'student');

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
    }

    // Sync session on server route
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode: matchedStudent.studentCode || matchedStudent.code || cleanUpper,
          password: cleanPin,
          role: 'STUDENT',
          localStudent: matchedStudent,
        }),
      });
    } catch (e) {}

    return { success: true, student: matchedStudent };
  }

  // 5. Fallback to API route for server DB students if not found locally
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

    if (!res.ok) {
      if (data.error === 'SUSPENDED' || res.status === 403) {
        return { success: false, error: 'تم تعليق هذا الحساب. يرجى مراجعة المعلمة.' };
      }
      return {
        success: false,
        error: data.error || 'كود الطالب أو رقم الهاتف غير مسجل في النظام',
      };
    }

    if (typeof window !== 'undefined' && data.user) {
      localStorage.setItem('current_student', JSON.stringify(data.user));
      sessionStorage.setItem('userRole', 'student');
    }

    return { success: true, student: data.user };
  } catch (err) {
    return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
  }
}

// Aliases for comprehensive backwards compatibility
export const authenticateStudentStrictly = verifyStudentCredentials;
export const authenticateStudent = verifyStudentCredentials;
export const verifyStudentLogin = verifyStudentCredentials;
