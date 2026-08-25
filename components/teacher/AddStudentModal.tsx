'use client';

import React, { useState } from 'react';
import { X, UserPlus, Phone, User, BookOpen, KeyRound, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addStudentToClassroom } from '@/actions/classroom';
import { toast } from 'sonner';

interface AddStudentModalProps {
  classrooms: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ACADEMIC_GRADES = [
  'الصف الثالث الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الأول الإعدادي',
  'الصف الثالث الثانوي',
  'الصف الثاني الثانوي',
  'الصف الأول الثانوي',
  'الصف السادس الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف الرابع الابتدائي',
];

export function AddStudentModal({ classrooms, isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [grade, setGrade] = useState(ACADEMIC_GRADES[0]);
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || '');
  const [password, setPassword] = useState('1234');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !classroomId) {
      toast.error('يرجى كتابة اسم الطالب ورقم الهاتف واختيار الفصل الدراسي');
      return;
    }

    setLoading(true);
    try {
      const student = await addStudentToClassroom({
        name: name.trim(),
        phone: phone.trim(),
        parentPhone: parentPhone.trim() || phone.trim(),
        grade,
        classroomId,
        password: password.trim() || '1234',
      });

      toast.success(`تم تسجيل الطالب ${student.name} بنجاح! كود الطالب: ${student.studentCode} 🎓`);
      setName('');
      setPhone('');
      setParentPhone('');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding student:', err);
      toast.error(err?.message || 'تعذر إضافة الطالب. تأكد من الصلاحيات والاتصال.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">إضافة طالب جديد</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">سيتم توليد كود دخول تلقائي وربطه بولي الأمر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              اسم الطالب الثلاثي:
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: يوسف محمود حسن"
                className="pe-8 h-10"
              />
              <User className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                رقم هاتف الطالب:
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="pe-8 font-mono h-10 text-xs"
                />
                <Phone className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                واتساب ولي الأمر:
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="01099998888"
                  className="pe-8 font-mono h-10 text-xs"
                />
                <MessageSquare className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الصف الدراسي:
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none focus:border-blue-500 font-medium"
              >
                {ACADEMIC_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                الفصل الدراسي:
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white bg-white dark:bg-slate-800 outline-none focus:border-blue-500 font-medium"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              كلمة المرور الافتراضية:
            </label>
            <div className="relative">
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="1234"
                className="pe-8 font-mono h-10 text-xs"
              />
              <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              loading={loading}
              size="md"
              variant="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
            >
              <UserPlus className="h-4 w-4 me-1" />
              حفظ وتسجيل الطالب
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
