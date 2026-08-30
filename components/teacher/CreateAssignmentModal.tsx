'use client';

import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Calendar, Edit, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAssignment, updateAssignment } from '@/actions/assignment';
import { toast } from 'sonner';

export interface AssignmentToEdit {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  classroomId?: string;
  grade?: string;
  fileUrl?: string | null;
  isClosed?: boolean;
}

interface CreateAssignmentModalProps {
  classrooms: { id: string; name: string }[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedAssignment?: any) => void;
  assignmentToEdit?: AssignmentToEdit | null;
}

export function CreateAssignmentModal({
  classrooms,
  isOpen,
  onClose,
  onSuccess,
  assignmentToEdit,
}: CreateAssignmentModalProps) {
  const isEditing = Boolean(assignmentToEdit && assignmentToEdit.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classroomId, setClassroomId] = useState(classrooms[0]?.id || '');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [maxScore, setMaxScore] = useState(10);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (assignmentToEdit) {
        setTitle(assignmentToEdit.title || '');
        setDescription(assignmentToEdit.description || '');
        setClassroomId(assignmentToEdit.classroomId || classrooms[0]?.id || '');
        if (assignmentToEdit.dueDate) {
          try {
            setDueDate(new Date(assignmentToEdit.dueDate).toISOString().split('T')[0]);
          } catch {
            const d = new Date();
            d.setDate(d.getDate() + 7);
            setDueDate(d.toISOString().split('T')[0]);
          }
        }
        setMaxScore(assignmentToEdit.maxScore || 10);
      } else {
        setTitle('');
        setDescription('');
        setClassroomId(classrooms[0]?.id || '');
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setDueDate(d.toISOString().split('T')[0]);
        setMaxScore(10);
      }
    }
  }, [isOpen, assignmentToEdit, classrooms]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('يرجى كتابة عنوان الواجب');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        classroomId: classroomId || undefined,
        dueDate: new Date(dueDate).toISOString(),
        maxScore: Number(maxScore) || 10,
      };

      let res: any = null;
      if (isEditing && assignmentToEdit?.id) {
        res = await updateAssignment(assignmentToEdit.id, payload);
      } else {
        res = await createAssignment(payload);
      }

      if (!res || !res.success) {
        throw new Error(res?.error || 'حدث خطأ أثناء حفظ الواجب');
      }

      toast.success(
        isEditing
          ? `تم تحديث الواجب "${title}" بنجاح!`
          : `تم نشر الواجب "${title}" للطلاب بنجاح!`
      );
      
      const returnedAssignment = res?.assignment || {
        id: `assign-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        classroomId,
        dueDate: new Date(dueDate).toISOString(),
        maxScore: Number(maxScore) || 10,
        isClosed: false,
        submissions: [],
      };

      onSuccess(returnedAssignment);
      onClose();
    } catch (err: any) {
      console.error('Assignment submit error:', err);
      toast.error(err?.message || 'حدث خطأ أثناء معالجة الواجب');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-lg overflow-hidden shadow-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-n-200 dark:border-n-300">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-light flex items-center justify-center">
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-base font-bold text-n-800 dark:text-n-700">
                {isEditing ? 'تعديل بيانات الواجب الدراسي' : 'إضافة واجب دراسي جديد'}
              </h3>
              <p className="text-xs text-n-400">
                {isEditing
                  ? 'تحديث تفاصيل التكليف، تاريخ الاستحقاق، والدرجة القصوى'
                  : 'سيظهر فوراً لجميع طلاب الفصل المحدد'}
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
              عنوان الواجب:
            </label>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: حل تدريبات درس التحليل التبادلي"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                الفصل الدراسي:
              </label>
              <select
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-n-200 dark:border-n-300 text-xs text-n-800 dark:text-n-700 bg-white dark:bg-n-200 outline-none focus:border-accent"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
                الدرجة القصوى:
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              آخر موعد للتسليم:
            </label>
            <Input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-n-700 dark:text-n-600 mb-1">
              تفاصيل وتعليمات الواجب:
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب أرقام الصفحات أو المسائل المطلوبة بالتفصيل..."
              className="w-full p-3 rounded-xl border border-n-200 dark:border-n-300 bg-n-50 dark:bg-n-200 text-xs text-n-800 dark:text-n-700 outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-n-100 dark:border-n-200">
            <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={loading}>
              إلغاء
            </Button>
            <Button type="submit" loading={loading} size="md" variant="primary" className="font-semibold">
              {isEditing ? (
                <>
                  <Check className="h-4 w-4 me-1" />
                  حفظ التعديلات
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 me-1" />
                  نشر الواجب للطلاب
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
