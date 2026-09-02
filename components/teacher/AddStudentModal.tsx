'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, User, BookOpen, KeyRound, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createStudentAction } from '@/actions/classroom';
import { saveStudentToStore } from '@/lib/store';
import { generateRandomPin } from '@/lib/utils';
import { toast } from 'sonner';

interface AddStudentModalProps {
  classrooms: { id: string; name: string }[];
  defaultClassroomId?: string;
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

export function AddStudentModal({
  classrooms = [],
  defaultClassroomId,
  isOpen,
  onClose,
  onSuccess,
}: AddStudentModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');
  const [gradeLevel, setGradeLevel] = useState(ACADEMIC_GRADES[0]);
  const [classroomId, setClassroomId] = useState(defaultClassroomId || classrooms[0]?.id || '');
  const [password, setPassword] = useState(() => generateRandomPin());
  const [loading, setLoading] = useState(false);

  // Keep classroomId and password perfectly synchronized whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setPassword(generateRandomPin());

      if (defaultClassroomId) {
        setClassroomId(defaultClassroomId);
      } else if (classrooms && classrooms.length > 0) {
        if (!classroomId || !classrooms.some((c) => c.id === classroomId)) {
          setClassroomId(classrooms[0].id);
        }
      }
    }
  }, [isOpen, defaultClassroomId, classrooms]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const effectiveClassroomId =
      classroomId ||
      defaultClassroomId ||
      (classrooms && classrooms.length > 0 ? classrooms[0].id : '') ||
      '';

    if (!cleanName || !cleanPhone) {
      toast.error('يرجى كتابة اسم الطالب ورقم الهاتف');
      return;
    }

    if (classrooms && classrooms.length > 0 && !effectiveClassroomId) {
      toast.error('يرجى اختيار الفصل الدراسي');
      return;
    }

    setLoading(true);
    try {
      const plainPassword = password.trim() || '1234';

      const result = await createStudentAction({
        name: cleanName,
        phone: cleanPhone,
        parentPhone: parentWhatsapp.trim() || cleanPhone,
        parentWhatsapp: parentWhatsapp.trim() || cleanPhone,
        grade: gradeLevel,
        gradeLevel,
        classroom: effectiveClassroomId,
        classroomId: effectiveClassroomId,
        password: plainPassword,
      });

      if (!result.success || !result.student) {
        toast.error(result.error || 'تعذر إضافة الطالب. يرجى المحاولة مرة أخرى.');
        return;
      }

      const student = result.student;

      // Immediately save to client-side localStorage store for zero-latency UI update
      if (typeof window !== 'undefined') {
        saveStudentToStore(student);
        window.dispatchEvent(new Event('edu_store_updated'));
        window.dispatchEvent(new Event('storage'));
        fetch('/api/students/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student: { ...student, password: plainPassword, defaultPassword: plainPassword } }),
        }).catch(() => {});
      }

      toast.success(
        `تم تسجيل الطالب ${student.name} بنجاح! كود الطالب: ${student.studentCode || student.id} — كلمة المرور: ${plainPassword} 🎓`
      );
      setName('');
      setPhone('');
      setParentWhatsapp('');
      setPassword(generateRandomPin());
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-md overflow-hidden shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">إضافة طالب جديد</h3>
              <p className="text-xs text-n-400">سيتم توليد كود دخول تلقائي وربطه بولي الأمر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-n-400 hover:text-n-700 dark:hover:text-n-500 p-1.5 rounded-lg hover:bg-n-100 dark:hover:bg-n-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              اسم الطالب الثلاثي:
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: يوسف محمود حسن"
                className="pe-8"
              />
              <User className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                رقم هاتف الطالب:
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="pe-8 font-mono text-xs"
                />
                <Phone className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                واتساب ولي الأمر:
              </label>
              <div className="relative">
                <Input
                  type="tel"
                  value={parentWhatsapp}
                  onChange={(e) => setParentWhatsapp(e.target.value)}
                  placeholder="01099998888"
                  className="pe-8 font-mono text-xs"
                />
                <MessageSquare className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ok" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                الصف الدراسي:
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 bg-white dark:bg-n-200 outline-none focus:border-accent font-medium"
              >
                {ACADEMIC_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                الفصل الدراسي:
              </label>
              <select
                value={classroomId || (classrooms && classrooms[0]?.id) || ''}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 bg-white dark:bg-n-200 outline-none focus:border-accent font-medium"
              >
                {classrooms && classrooms.length > 0 ? (
                  classrooms.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option value="">(فصل افتراضي - عام)</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600">
                كلمة المرور (4 أرقام):
              </label>
              <button
                type="button"
                onClick={() => setPassword(generateRandomPin())}
                className="text-[11px] text-accent hover:text-accent-hover font-semibold flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                توليد كود جديد
              </button>
            </div>
            <div className="relative">
              <Input
                type="text"
                required
                maxLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="مثال: 1234"
                className="pe-8 font-mono text-center text-sm tracking-widest font-bold bg-n-50 dark:bg-n-200"
              />
              <KeyRound className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
            </div>
            <p className="text-[11px] text-n-400 mt-1">
              كلمة مرور الطالب — سيتمكن الطالب من تسجيل الدخول بها فوراً مع كوده الخاص.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-100 dark:border-n-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary">
              <UserPlus className="h-4 w-4 me-1" />
              حفظ وتسجيل الطالب
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
