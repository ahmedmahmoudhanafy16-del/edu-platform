import React from 'react';
import { Settings } from 'lucide-react';
import { getAuthenticatedTeacher } from '@/lib/auth';
import { TeacherSettingsClient } from '@/components/teacher/TeacherSettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TeacherSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isAr = locale === 'ar';

  let teacher: any = null;
  try {
    teacher = await getAuthenticatedTeacher();
  } catch (e) {}

  const rawTeacherName = teacher?.name || '';
  const cleanTeacherName = (rawTeacherName.includes('سارة') || rawTeacherName.toLowerCase().includes('sarah'))
    ? (isAr ? 'المعلم' : 'Teacher')
    : (rawTeacherName || (isAr ? 'المعلم' : 'Teacher'));

  // Format real teacher data without dummy fallbacks
  const serializedTeacher = {
    id: teacher?.id || '',
    name: cleanTeacherName,
    email: teacher?.email || null,
    phone: teacher?.phone || null,
    role: teacher?.role || 'TEACHER',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          {isAr ? 'إعدادات وتأمين حساب المعلم' : 'Teacher Account & Security Settings'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isAr
            ? 'تعديل الاسم الظاهر للطلاب، البريد الإلكتروني، رقم الهاتف، وتغيير كلمة المرور'
            : 'Update display name, email address, phone number, and security password'}
        </p>
      </div>

      <TeacherSettingsClient
        initialTeacher={serializedTeacher}
        locale={locale}
      />
    </div>
  );
}
