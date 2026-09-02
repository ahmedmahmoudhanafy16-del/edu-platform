'use client';

import React, { useState } from 'react';
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
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('الرياضيات والجبر');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) {
      toast.error('يرجى كتابة اسم الفصل والمادة');
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

      toast.success(`تم إنشاء فصل "${cls.name}" بنجاح! كود الانضمام: ${cls.code}`);
      setName('');
      onSuccess(cls);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء إنشاء الفصل');
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
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">إنشاء فصل دراسي جديد</h3>
              <p className="text-xs text-n-400">سيتم توليد كود انضمام فوري للفصل</p>
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
              اسم الفصل / المجموعة:
            </label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الصف الأول الثانوي - مجموعة الأحد"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              المادة الدراسية:
            </label>
            <Input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="مثال: الرياضيات / الفيزياء / اللغة العربية"
            />
          </div>

          <div className="p-3 bg-accent-light/60 rounded-xl border border-accent/20 text-xs text-accent-text flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent flex-shrink-0" />
            <span>يتم توليد كود دخول تلقائي يستطيع الطلاب كتابته للانضمام فوراً.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-100 dark:border-n-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary">
              <Plus className="h-4 w-4 me-1" />
              إنشاء الفصل
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
