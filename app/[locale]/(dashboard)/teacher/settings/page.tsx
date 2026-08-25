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

  const teacher = await getAuthenticatedTeacher();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          إعدادات حساب المعلم
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          تعديل البيانات الشخصية، البريد الإلكتروني، وتأمين الحساب
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-md">
            {teacher?.name?.charAt(0) || 'أ'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{teacher?.name || 'أ/ سارة أحمد'}</h2>
            <p className="text-xs text-slate-500">{teacher?.email || 'teacher@school.com'} (حساب المعلم الأساسي)</p>
          </div>
        </div>

        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الاسم الظاهر للطلاب:
              </label>
              <div className="relative">
                <Input defaultValue={teacher?.name || 'أ/ سارة أحمد'} className="pe-8 h-10" />
                <User className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                البريد الإلكتروني:
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
                رقم الهاتف (للتواصل والتنبيهات):
              </label>
              <div className="relative">
                <Input defaultValue={teacher?.phone || '01011112222'} type="tel" className="pe-8 font-mono h-10 text-xs" />
                <Phone className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                تغيير كلمة المرور:
              </label>
              <div className="relative">
                <Input placeholder="اتركه فارغاً للإبقاء على الحالية" type="password" className="pe-8 h-10 text-xs" />
                <Lock className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
              <Save className="h-4 w-4 ml-1.5" />
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
