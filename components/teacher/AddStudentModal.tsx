'use client';

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, User, BookOpen, KeyRound, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createStudentAction } from '@/actions/classroom';
import { saveStudentToStore, getStudentsFromStore } from '@/lib/store';
import { generateRandomPin } from '@/lib/utils';
import { toast } from 'sonner';
import { useLocale } from 'next-intl';

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

const GRADE_NAMES_EN: Record<string, string> = {
  'الصف الثالث الإعدادي': 'Grade 9 (Prep 3)',
  'الصف الثاني الإعدادي': 'Grade 8 (Prep 2)',
  'الصف الأول الإعدادي': 'Grade 7 (Prep 1)',
  'الصف الثالث الثانوي': 'Grade 12 (Sec 3)',
  'الصف الثاني الثانوي': 'Grade 11 (Sec 2)',
  'الصف الأول الثانوي': 'Grade 10 (Sec 1)',
  'الصف السادس الابتدائي': 'Grade 6 (Primary 6)',
  'الصف الخامس الابتدائي': 'Grade 5 (Primary 5)',
  'الصف الرابع الابتدائي': 'Grade 4 (Primary 4)',
};

export function AddStudentModal({
  classrooms = [],
  defaultClassroomId,
  isOpen,
  onClose,
  onSuccess,
}: AddStudentModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
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
      const existingStudents = getStudentsFromStore();
      const existingPins = existingStudents.map((s: any) => s.defaultPassword || s.password);
      setPassword(generateRandomPin(existingPins));

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
      toast.error(isAr ? 'يرجى كتابة اسم الطالب ورقم الهاتف' : 'Please enter student name and phone number');
      return;
    }

    if (classrooms && classrooms.length > 0 && !effectiveClassroomId) {
      toast.error(isAr ? 'يرجى اختيار الفصل الدراسي' : 'Please select a classroom');
      return;
    }

    const existingStudents = getStudentsFromStore();
    const existingPins = existingStudents.map((s: any) => s.defaultPassword || s.password);
    const plainPassword = password.trim() || generateRandomPin(existingPins);

    // Prevent duplicate passwords across students
    const duplicate = existingStudents.find(
      (s: any) => (s.defaultPassword && s.defaultPassword === plainPassword) || (s.password && s.password === plainPassword)
    );
    if (duplicate) {
      toast.error(
        isAr
          ? `كلمة المرور (${plainPassword}) مستخدمة بالفعل للطالب "${duplicate.name}". يرجى اختيار كلمة مرور فريدة.`
          : `Password (${plainPassword}) is already in use by "${duplicate.name}". Please pick a unique PIN.`
      );
      return;
    }

    setLoading(true);
    try {
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
        toast.error(result.error || (isAr ? 'تعذر إضافة الطالب. يرجى المحاولة مرة أخرى.' : 'Failed to add student. Please try again.'));
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
        isAr
          ? `تم تسجيل الطالب ${student.name} بنجاح! كود الطالب: ${student.studentCode || student.id} — كلمة المرور: ${plainPassword} 🎓`
          : `Student ${student.name} enrolled successfully! Student Code: ${student.studentCode || student.id} — Password: ${plainPassword} 🎓`
      );
      setName('');
      setPhone('');
      setParentWhatsapp('');
      setPassword(generateRandomPin(existingPins));
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error adding student:', err);
      toast.error(err?.message || (isAr ? 'تعذر إضافة الطالب. تأكد من الصلاحيات والاتصال.' : 'Failed to add student. Check connection.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-md overflow-hidden shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">
                {isAr ? 'إضافة طالب جديد' : 'Add New Student'}
              </h3>
              <p className="text-xs text-n-400">
                {isAr ? 'سيتم توليد كود دخول تلقائي وربطه بولي الأمر' : 'A login PIN will be generated and linked with parent contact'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="text-n-400 hover:text-n-700 dark:hover:text-n-500 p-1.5 rounded-lg hover:bg-n-100 dark:hover:bg-n-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              {isAr ? 'اسم الطالب الثلاثي:' : 'Full Student Name:'}
            </label>
            <div className="relative">
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isAr ? 'مثال: يوسف محمود حسن' : 'e.g. Youssef Mahmoud Hassan'}
                className="pe-8"
              />
              <User className="absolute end-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-n-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                {isAr ? 'رقم هاتف الطالب:' : 'Student Phone:'}
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
                {isAr ? 'واتساب ولي الأمر:' : 'Parent WhatsApp:'}
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
                {isAr ? 'الصف الدراسي:' : 'Academic Grade:'}
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 bg-white dark:bg-n-200 outline-none focus:border-accent font-medium"
              >
                {ACADEMIC_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {isAr ? g : GRADE_NAMES_EN[g] || g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                {isAr ? 'الفصل الدراسي:' : 'Classroom:'}
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
                  <option value="">{isAr ? '(فصل افتراضي - عام)' : '(Default - General Classroom)'}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600">
                {isAr ? 'كلمة المرور (4 أرقام):' : 'Password (PIN):'}
              </label>
              <button
                type="button"
                onClick={() => {
                  const existingStudents = getStudentsFromStore();
                  const existingPins = existingStudents.map((s: any) => s.defaultPassword || s.password);
                  setPassword(generateRandomPin(existingPins));
                }}
                className="text-[11px] text-accent hover:text-accent-hover font-semibold flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                {isAr ? 'توليد كود جديد' : 'Generate New PIN'}
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
              {isAr
                ? 'كلمة مرور الطالب — سيتمكن الطالب من تسجيل الدخول بها فوراً مع كوده الخاص.'
                : 'Student password — the student will log in with this code and their unique student ID.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-100 dark:border-n-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary">
              <UserPlus className="h-4 w-4 me-1" />
              {isAr ? 'حفظ وتسجيل الطالب' : 'Save & Register Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
