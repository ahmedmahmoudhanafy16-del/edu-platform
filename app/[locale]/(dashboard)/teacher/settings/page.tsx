import React from 'react';
import { prisma } from '@/lib/prisma';
import { Settings, User, Mail, Phone, Lock, Save, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAuthenticatedTeacher } from '@/lib/auth';

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          {isAr ? 'إعدادات حساب المعلم' : 'Teacher Account Settings'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isAr
            ? 'تعديل البيانات الشخصية، البريد الإلكتروني، وتأمين الحساب'
            : 'Update personal profile, contact information, and security preferences'}
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
            {teacher?.name?.charAt(0) || (isAr ? 'أ' : 'T')}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {teacher?.name || (isAr ? 'أ/ سارة أحمد' : 'Ms. Sarah Ahmed')}
            </h2>
            <p className="text-xs text-slate-500">
              {teacher?.email || 'teacher@school.com'} {isAr ? '(حساب المعلم الأساسي)' : '(Primary Teacher Account)'}
            </p>
          </div>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'الاسم الظاهر للطلاب:' : 'Display Name for Students:'}
              </label>
              <div className="relative">
                <Input defaultValue={teacher?.name || (isAr ? 'أ/ سارة أحمد' : 'Ms. Sarah Ahmed')} className="pe-8 h-10" />
                <User className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'البريد الإلكتروني:' : 'Email Address:'}
              </label>
              <div className="relative">
                <Input defaultValue={teacher?.email || 'teacher@school.com'} type="email" className="pe-8 h-10" />
                <Mail className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'رقم الهاتف (للتواصل والتنبيهات):' : 'Phone Number (Alerts & Contact):'}
              </label>
              <div className="relative">
                <Input defaultValue={teacher?.phone || '01011112222'} type="tel" className="pe-8 font-mono h-10 text-xs" />
                <Phone className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'تغيير كلمة المرور:' : 'Change Password:'}
              </label>
              <div className="relative">
                <Input
                  placeholder={isAr ? 'اتركه فارغاً للإبقاء على الحالية' : 'Leave empty to keep current password'}
                  type="password"
                  className="pe-8 h-10 text-xs"
                />
                <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
              <Save className="h-4 w-4 me-1.5" />
              {isAr ? 'حفظ التعديلات' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
