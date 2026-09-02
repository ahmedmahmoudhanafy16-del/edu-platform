import React from 'react';
import { Settings, Lock, Phone, User, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAuthenticatedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const student = await getAuthenticatedStudent();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-blue-600" />
          إعدادات حساب الطالب
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          تعديل رقم الهاتف، تحديث بيانات ولي الأمر، وتغيير كلمة المرور
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
        <form className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                اسم الطالب:
              </label>
              <Input disabled defaultValue={student?.name} className="h-10 bg-slate-50 dark:bg-slate-800 cursor-not-allowed" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                كود الطالب (غير قابل للتعديل):
              </label>
              <Input disabled defaultValue={student?.studentCode || '—'} className="h-10 font-mono font-bold bg-slate-50 dark:bg-slate-800 cursor-not-allowed text-blue-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                رقم هاتف الطالب:
              </label>
              <Input defaultValue={student?.phone || ''} type="tel" className="h-10 font-mono" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                واتساب ولي الأمر:
              </label>
              <Input defaultValue={student?.parentPhone || student?.phone || ''} type="tel" className="h-10 font-mono" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              تغيير كلمة المرور:
            </label>
            <Input placeholder="اتركه فارغاً للإبقاء على كلمة المرور الحالية" type="password" className="h-10" />
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
