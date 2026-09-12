'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';

export interface UpdateProfileInput {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TeacherActionResponse {
  success: boolean;
  error?: string;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    role: string;
  };
}

/**
 * Updates teacher profile name, email, and phone number.
 * Validates inputs, checks email uniqueness, updates Prisma,
 * synchronizes session cookie, and revalidates dashboard paths.
 */
export async function updateTeacherProfileAction(
  data: UpdateProfileInput
): Promise<TeacherActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return { success: false, error: 'غير مصرح: يجب تسجيل الدخول بحساب المعلم' };
    }

    const cleanName = (data.name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'يجب أن يتكون اسم المعلم من حرفين على الأقل' };
    }

    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return { success: false, error: 'صيغة البريد الإلكتروني غير صالحة' };
      }

      // Ensure no collision with another user's email
      const existingUser = await prisma.user.findFirst({
        where: {
          email: cleanEmail,
          NOT: { id: user.id },
        },
      });

      if (existingUser) {
        return { success: false, error: 'هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر' };
      }
    }

    const cleanPhone = (data.phone || '').trim();

    // Update teacher in database
    let updatedUser: any = null;
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: cleanName,
          ...(cleanEmail ? { email: cleanEmail } : {}),
          phone: cleanPhone || null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        },
      });
    } catch (dbErr: any) {
      console.error('[updateTeacherProfileAction] DB error:', dbErr);
      return { success: false, error: 'حدث خطأ أثناء حفظ البيانات في قاعدة البيانات' };
    }

    // Synchronize session cookie
    try {
      const cookieStore = await cookies();
      const existingCookie = cookieStore.get('user_session');
      let sessionData: any = {};
      if (existingCookie?.value) {
        try {
          sessionData = JSON.parse(existingCookie.value);
        } catch {}
      }

      const newSession = {
        ...sessionData,
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: 'TEACHER',
      };

      cookieStore.set('user_session', JSON.stringify(newSession), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    } catch (cookieErr) {
      console.warn('[updateTeacherProfileAction] Cookie sync warning:', cookieErr);
    }

    // Revalidate dashboard routes
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/ar/teacher');
      revalidatePath('/en/teacher');
      revalidatePath('/ar/teacher/settings');
      revalidatePath('/en/teacher/settings');
    } catch {}

    return {
      success: true,
      message: 'تم تحديث بيانات الحساب بنجاح',
      user: updatedUser,
    };
  } catch (error: any) {
    console.error('[updateTeacherProfileAction] Fatal error:', error);
    return { success: false, error: error.message || 'حدث خطأ غير متوقع' };
  }
}

/**
 * Updates teacher password securely.
 * Requires verification of current password, validates length,
 * checks matching confirmation, and hashes with bcrypt.
 */
export async function updateTeacherPasswordAction(
  data: UpdatePasswordInput
): Promise<TeacherActionResponse> {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TEACHER') {
      return { success: false, error: 'غير مصرح: يجب تسجيل الدخول بحساب المعلم' };
    }

    const currentPassword = String(data.currentPassword || '').trim();
    const newPassword = String(data.newPassword || '').trim();
    const confirmPassword = String(data.confirmPassword || '').trim();

    if (!currentPassword) {
      return { success: false, error: 'يرجى كتابة كلمة المرور الحالية' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف أو أرقام' };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' };
    }

    // Fetch existing teacher security credentials
    let dbTeacher: any = null;
    try {
      dbTeacher = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, password: true, passwordHash: true },
      });
    } catch (err) {
      console.error('[updateTeacherPasswordAction] DB lookup error:', err);
      return { success: false, error: 'فشل في التحقق من بيانات المعلم' };
    }

    if (!dbTeacher) {
      return { success: false, error: 'حساب المعلم غير موجود في النظام' };
    }

    // Verify current password against plaintext or bcrypt hash
    let isCurrentValid = false;
    const dbPass = String(dbTeacher.password || '').trim();

    if (dbPass && currentPassword === dbPass) {
      isCurrentValid = true;
    } else if (dbTeacher.passwordHash && dbTeacher.passwordHash.startsWith('$2')) {
      try {
        isCurrentValid = await bcrypt.compare(currentPassword, dbTeacher.passwordHash);
      } catch {
        isCurrentValid = false;
      }
    } else if (dbPass && dbPass.startsWith('$2')) {
      try {
        isCurrentValid = await bcrypt.compare(currentPassword, dbPass);
      } catch {
        isCurrentValid = false;
      }
    }

    if (!isCurrentValid) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    }

    // Hash new password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: newPassword,
          passwordHash,
        },
      });
    } catch (dbUpdateErr) {
      console.error('[updateTeacherPasswordAction] DB update error:', dbUpdateErr);
      return { success: false, error: 'فشل في حفظ كلمة المرور الجديدة في قاعدة البيانات' };
    }

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    };
  } catch (error: any) {
    console.error('[updateTeacherPasswordAction] Fatal error:', error);
    return { success: false, error: error.message || 'حدث خطأ أثناء تغيير كلمة المرور' };
  }
}
