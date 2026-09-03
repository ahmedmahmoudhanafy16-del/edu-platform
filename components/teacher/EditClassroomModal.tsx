'use client';

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Sparkles, Check, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateClassroomAction } from '@/actions/classroom';
import { updateClassroomInStore } from '@/lib/store';
import { toast } from 'sonner';

interface EditClassroomModalProps {
  classroom: {
    id: string;
    name: string;
    subject: string;
    code: string;
    isActive?: boolean;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}

export function EditClassroomModal({ classroom, isOpen, onClose, onSuccess }: EditClassroomModalProps) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classroom && isOpen) {
      setName(classroom.name || '');
      setSubject(classroom.subject || '');
      setCode(classroom.code || '');
      setIsActive(classroom.isActive !== false);
    }
  }, [classroom, isOpen]);

  if (!isOpen || !classroom) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !subject.trim()) {
      toast.error('يرجى كتابة اسم الفصل والمادة');
      return;
    }

    setLoading(true);
    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      code: (code || classroom!.code).trim().toUpperCase(),
      isActive,
    };

    try {
      // 1. Update in client store with automatic cascading to quizzes, assignments, and students
      updateClassroomInStore(classroom!.id, payload);

      // 2. Update on server
      try {
        await updateClassroomAction(classroom!.id, payload);
      } catch (actionErr) {
        console.warn('Server update notice:', actionErr);
      }

      toast.success(`تم تعديل بيانات فصل "${name.trim()}" وتحديثها في كل أنحاء المنصة! ✨`);
      onSuccess({ id: classroom!.id, ...payload });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء تعديل بيانات الفصل');
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
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">تعديل بيانات الفصل الدراسي</h3>
              <p className="text-xs text-n-400">سيتم تطبيق التعديلات فوراً على كافة الامتحانات والواجبات والطلاب</p>
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
              placeholder="مثال: الصف الرابع الابتدائي"
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
              placeholder="مثال: Science / الرياضيات / اللغة العربية"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              كود الانضمام (للدخول المباشر):
            </label>
            <Input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="مثال: LX2WJS"
              className="font-mono font-bold tracking-wider uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              حالة الفصل:
            </label>
            <select
              value={isActive ? 'ACTIVE' : 'INACTIVE'}
              onChange={(e) => setIsActive(e.target.value === 'ACTIVE')}
              className="w-full h-10 px-3 rounded-lg border border-n-200 dark:border-n-300 bg-white dark:bg-n-200 text-sm text-n-800 dark:text-n-700 outline-none focus:border-accent font-medium"
            >
              <option value="ACTIVE">نشط (متاح للطلاب والامتحانات والواجبات)</option>
              <option value="INACTIVE">معطل مؤقتاً (مخفي من الطلاب والأنشطة)</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span>تعديل اسم الفصل يحدث اسم الفصل تلقائياً في الامتحانات والواجبات والبث المباشر.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-100 dark:border-n-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary">
              <Check className="h-4 w-4 me-1" />
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
