'use server';

import { prisma } from '@/lib/prisma';
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

    // Query PostgreSQL directly
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
      grade: user.grade || 'الصف الثالث الإعدادي',
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
