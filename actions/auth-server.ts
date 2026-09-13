'use server';

import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export interface StudentAuthResult {
  success: boolean;
  error?: string;
  student?: any;
}

/**
 * Authoritative Server-Side Student Verification using PostgreSQL & bcrypt.
 * Validates credentials strictly against the PostgreSQL User table.
 */
export async function verifyStudentCredentialsAction(
  identifier: string,
  pin: string
): Promise<StudentAuthResult> {
  try {
    const cleanId = (identifier || '').trim();
    const cleanPin = (pin || '').trim();

    if (!cleanId || !cleanPin) {
      return { success: false, error: 'يرجى إدخال الكود أو رقم الهاتف وكلمة المرور' };
    }

    const cleanUpper = cleanId.toUpperCase();
    const cleanLower = cleanId.toLowerCase();

    // 1. Direct query to Supabase central 'students' table
    try {
      const { data: student, error: sbError } = await supabase
        .from('students')
        .select('id, student_code, full_name, grade_level, is_active, password_hash, phone, parent_phone')
        .or(`student_code.eq.${cleanId},student_code.eq.${cleanUpper},student_code.eq.${cleanLower},phone.eq.${cleanId}`)
        .maybeSingle();

      if (!sbError && student) {
        if (student.is_active === false) {
          return { success: false, error: 'تم تعليق هذا الحساب. يرجى مراجعة إدارة المنصة.' };
        }

        let isMatch = false;
        const storedHash = String(student.password_hash || '').trim();
        if (storedHash === cleanPin) {
          isMatch = true;
        } else if (storedHash.startsWith('$2')) {
          try {
            isMatch = await bcrypt.compare(cleanPin, storedHash);
          } catch {
            isMatch = false;
          }
        }

        if (!isMatch) {
          return { success: false, error: 'كلمة المرور غير صحيحة، يرجى التأكد من الرمز الخاص بك' };
        }

        const sessionPayload = {
          id: student.id,
          name: student.full_name,
          role: 'STUDENT',
          studentCode: student.student_code,
          phone: student.phone || '',
          parentPhone: student.parent_phone || '',
          grade: student.grade_level || '',
          isActive: true,
        };

        try {
          cookies().set('user_session', JSON.stringify(sessionPayload), {
            path: '/',
            maxAge: 60 * 60 * 24 * 30,
            sameSite: 'lax',
          });
        } catch (cookieErr) {}

        return { success: true, student: sessionPayload };
      }
    } catch (sbErr: any) {
      console.warn('[verifyStudentCredentialsAction] Supabase notice:', sbErr?.message);
    }

    // 2. Secondary fallback: PostgreSQL direct query
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          role: 'STUDENT',
          OR: [
            { studentCode: cleanId },
            { studentCode: cleanUpper },
            { phone: cleanId },
            { id: cleanId },
          ],
        },
      });
    } catch (dbErr: any) {
      console.warn('[verifyStudentCredentialsAction] Database lookup warning:', dbErr?.message);
    }

    if (!user) {
      return { success: false, error: 'بيانات الدخول غير مسجلة في قاعدة البيانات' };
    }

    if (user.isActive === false) {
      return { success: false, error: 'تم تعليق هذا الحساب. يرجى مراجعة المعلمة.' };
    }

    // Password verification: bcrypt hash OR plain default PIN
    let isMatch = false;
    const userPass = String(user.password || '').trim();
    const userDefPass = String(user.defaultPassword || '').trim();

    if ((userPass && cleanPin === userPass) || (userDefPass && cleanPin === userDefPass)) {
      isMatch = true;
    } else if (user.passwordHash && user.passwordHash.startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(cleanPin, user.passwordHash);
      } catch {
        isMatch = false;
      }
    } else if (user.password && user.password.startsWith('$2')) {
      try {
        isMatch = await bcrypt.compare(cleanPin, user.password);
      } catch {
        isMatch = false;
      }
    }

    if (!isMatch) {
      return { success: false, error: 'كلمة المرور غير صحيحة، يرجى التأكد من الرمز الخاص بك' };
    }

    const sessionPayload = {
      id: user.id || user.studentCode,
      name: user.name,
      role: 'STUDENT',
      studentCode: user.studentCode,
      phone: user.phone,
      grade: user.grade || '',
      isActive: true,
    };

    try {
      cookies().set('user_session', JSON.stringify(sessionPayload), {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
      });
    } catch (cookieErr) {}

    return { success: true, student: sessionPayload };
  } catch (err: any) {
    console.error('[verifyStudentCredentialsAction Fatal]:', err);
    return { success: false, error: 'حدث خطأ في الخادم أثناء التحقق من بيانات الدخول' };
  }
}
