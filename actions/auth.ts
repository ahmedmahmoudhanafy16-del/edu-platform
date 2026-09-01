'use client';

export interface StudentAuthResult {
  success: boolean;
  error?: string;
  student?: any;
}

/**
 * Dynamic Student Credential Verification
 * Checks localStorage active students first (handles newly added students like STU-633 with custom/updated PINs),
 * then synchronizes session cookie and current_student.
 */
export async function verifyStudentLogin(identifier: string, pin: string): Promise<StudentAuthResult> {
  const cleanId = (identifier || '').trim().toUpperCase();
  const cleanPin = (pin || '').trim();

  if (!cleanId || !cleanPin) {
    return { success: false, error: 'يرجى إدخال كود الطالب وكلمة المرور' };
  }

  // 1. Get dynamic students from client store (localStorage)
  let studentsList: any[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('edu_students');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) studentsList = parsed;
      }
    } catch (e) {
      console.warn('[verifyStudentLogin] Failed to parse local edu_students:', e);
    }
  }

  // 2. Find student by code, studentCode, id, or phone
  const foundStudent = studentsList.find((s: any) => {
    const sCode = (s.code || s.studentCode || s.id || '').toString().trim().toUpperCase();
    const sPhone = (s.phone || '').toString().trim();
    const isIdMatch = sCode === cleanId || sPhone === identifier.trim() || sPhone === cleanId;

    if (!isIdMatch) return false;

    const sPass = String(s.password ?? s.defaultPassword ?? '').trim();
    const sDefPass = String(s.defaultPassword ?? s.password ?? '').trim();

    return sPass === cleanPin || sDefPass === cleanPin;
  });

  // 3. If found locally, check suspension and activate session
  if (foundStudent) {
    if (foundStudent.isActive === false) {
      return { success: false, error: 'تم تعليق هذا الحساب. يرجى مراجعة المعلمة.' };
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('current_student', JSON.stringify(foundStudent));

        // Also set client cookie for seamless server components
        const sessionPayload = {
          id: foundStudent.id || foundStudent.studentCode || foundStudent.code,
          name: foundStudent.name,
          role: 'STUDENT',
          studentCode: foundStudent.studentCode || foundStudent.code,
          phone: foundStudent.phone,
          grade: foundStudent.grade || foundStudent.gradeLevel || 'الصف الثالث الإعدادي',
          isActive: true,
        };
        document.cookie = `user_session=${encodeURIComponent(JSON.stringify(sessionPayload))}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } catch (e) {}
    }

    // Ping API route to ensure server session cookie is set
    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode: cleanId,
          password: cleanPin,
          role: 'STUDENT',
          localStudent: foundStudent,
        }),
      });
    } catch (e) {}

    return { success: true, student: foundStudent };
  }

  // 4. Fallback to API route for server-seeded / DB students
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: cleanId,
        password: cleanPin,
        role: 'STUDENT',
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (data.error === 'SUSPENDED' || res.status === 403) {
        return { success: false, error: 'تم تعليق هذا الحساب. يرجى مراجعة المعلمة.' };
      }
      return { success: false, error: data.error || 'كود الطالب أو كلمة المرور غير صحيحة' };
    }

    if (typeof window !== 'undefined' && data.user) {
      localStorage.setItem('current_student', JSON.stringify(data.user));
    }

    return { success: true, student: data.user };
  } catch (err) {
    return { success: false, error: 'حدث خطأ في الاتصال بالخادم' };
  }
}
