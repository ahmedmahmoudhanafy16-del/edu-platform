'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { X, BookOpen, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClassroom } from '@/actions/classroom';
import { toast } from 'sonner';

interface CreateClassroomModalProps {
  teacherId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cls?: any) => void;
}

export function CreateClassroomModal({ teacherId, isOpen, onClose, onSuccess }: CreateClassroomModalProps) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(isAr ? 'الرياضيات والجبر' : 'Mathematics');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) {
      toast.error(isAr ? 'يرجى كتابة اسم الفصل والمادة' : 'Please enter classroom name and subject');
      return;
    }

    setLoading(true);
    try {
      const cls = await createClassroom(name.trim(), subject.trim(), teacherId);
      if (cls?.id) {
        try {
          const stored = localStorage.getItem('edu_classrooms');
          const current: any[] = stored ? JSON.parse(stored) : [];
          const newClassroom = {
            id: cls.id,
            name: cls.name,
            subject: cls.subject,
            code: cls.code,
            studentsCount: 0,
            quizzesCount: 0,
            assignmentsCount: 0,
            isActive: true,
          };
          const updated = [newClassroom, ...current.filter((c: any) => c.id !== cls.id)];
          localStorage.setItem('edu_classrooms', JSON.stringify(updated));

          const deletedRaw = localStorage.getItem('edu_deleted_classrooms');
          if (deletedRaw) {
            const deletedSet = new Set(JSON.parse(deletedRaw));
            deletedSet.delete(cls.id);
            localStorage.setItem('edu_deleted_classrooms', JSON.stringify(Array.from(deletedSet)));
          }
        } catch {}
      }

      toast.success(
        isAr
          ? `تم إنشاء فصل "${cls.name}" بنجاح! كود الانضمام: ${cls.code}`
          : `Classroom "${cls.name}" created successfully! Join Code: ${cls.code}`
      );
      setName('');
      onSuccess(cls);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || (isAr ? 'حدث خطأ أثناء إنشاء الفصل' : 'An error occurred while creating classroom'));
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
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">
                {isAr ? 'إنشاء فصل دراسي جديد' : 'Create New Classroom'}
              </h3>
              <p className="text-xs text-n-400">
                {isAr ? 'سيتم توليد كود انضمام فوري للفصل' : 'An instant join code will be generated'}
              </p>
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
              {isAr ? 'اسم الفصل / المجموعة:' : 'Classroom / Group Name:'}
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isAr ? 'مثال: الصف الأول الثانوي - مجموعة الأحد' : 'e.g. Grade 10 - Sunday Group'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              {isAr ? 'المادة الدراسية:' : 'Subject:'}
            </label>
            <Input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={isAr ? 'مثال: الرياضيات / الفيزياء / اللغة الإنجليزية' : 'e.g. Mathematics / Physics / English'}
            />
          </div>

          <div className="p-3 bg-accent-light/60 rounded-xl border border-accent/20 text-xs text-accent-text flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
            <span>
              {isAr
                ? 'يتم توليد كود دخول تلقائي يستطيع الطلاب كتابته للانضمام فوراً.'
                : 'An automatic access code is generated for students to join instantly.'}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-100 dark:border-n-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary">
              <Plus className="h-4 w-4 me-1" />
              {isAr ? 'إنشاء الفصل' : 'Create Classroom'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
