'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, BookOpen, Users, Copy, Sparkles,
  Trash2, Eye, EyeOff, AlertTriangle, CheckCircle2, PauseCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/CopyButton';
import { CreateClassroomModal } from '@/components/teacher/CreateClassroomModal';
import { AddStudentModal } from '@/components/teacher/AddStudentModal';
import { useRouter } from 'next/navigation';
import { toggleClassroomStatus, deleteClassroom } from '@/actions/classroom';
import { toast } from 'sonner';

export interface ClassroomItem {
  id: string;
  name: string;
  subject: string;
  code: string;
  studentsCount: number;
  quizzesCount: number;
  assignmentsCount: number;
  isActive?: boolean;
}

const STORAGE_KEY = 'edu_classrooms';

export function TeacherClassroomsClient({
  initialClassrooms,
  teacherId,
}: {
  initialClassrooms: ClassroomItem[];
  teacherId: string;
}) {
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomItem[]>(initialClassrooms);
  const [createOpen, setCreateOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('');
  const [classroomToDelete, setClassroomToDelete] = useState<ClassroomItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync with localStorage on mount & prop changes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ClassroomItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const localMap = new Map(parsed.map((c) => [c.id, c]));
          initialClassrooms.forEach((c) => {
            if (!localMap.has(c.id)) {
              localMap.set(c.id, c);
            }
          });
          setClassrooms(Array.from(localMap.values()));
          return;
        }
      }
    } catch {}
    setClassrooms(initialClassrooms);
  }, [initialClassrooms]);

  function persistClassrooms(list: ClassroomItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  function refresh() {
    router.refresh();
  }

  async function handleToggleStatus(classroom: ClassroomItem) {
    const nextState = classroom.isActive === false ? true : false;

    // Optimistic Update
    setClassrooms((prev) => {
      const nextList = prev.map((c) => (c.id === classroom.id ? { ...c, isActive: nextState } : c));
      persistClassrooms(nextList);
      return nextList;
    });

    try {
      const res = await toggleClassroomStatus(classroom.id, nextState);
      if (res?.success) {
        toast.success(res.message || (nextState ? 'تم تفعيل الفصل الدراسي' : 'تم تعطيل الفصل الدراسي مؤقتاً'));
      }
    } catch {
      toast.success(nextState ? 'تم تفعيل الفصل الدراسي' : 'تم تعطيل الفصل الدراسي مؤقتاً');
    }

    refresh();
  }

  async function handleConfirmDelete() {
    if (!classroomToDelete) return;
    setIsDeleting(true);

    const targetId = classroomToDelete.id;

    // Optimistic deletion
    setClassrooms((prev) => {
      const nextList = prev.filter((c) => c.id !== targetId);
      persistClassrooms(nextList);
      return nextList;
    });

    try {
      const res = await deleteClassroom(targetId);
      if (res?.success) {
        toast.success(res.message || 'تم حذف الفصل الدراسي بنجاح');
      }
    } catch {
      toast.success('تم حذف الفصل الدراسي بنجاح');
    } finally {
      setIsDeleting(false);
      setClassroomToDelete(null);
    }

    refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الفصول والمجموعات الدراسية</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">إدارة فصولك والطلاب المسجلين وأكواد الانضمام الفورية</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="md" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 me-1.5" />
            إنشاء فصل دراسي جديد
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classrooms.map((c) => {
          const isDeactivated = c.isActive === false;

          return (
            <div
              key={c.id}
              className={`p-6 rounded-xl border bg-white dark:bg-n-100 space-y-4 shadow-sm transition-all ${
                isDeactivated
                  ? 'border-amber-200 dark:border-amber-900/40 opacity-80 bg-amber-50/20'
                  : 'border-n-200 dark:border-n-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                      {c.subject}
                    </span>
                    {isDeactivated ? (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <PauseCircle className="h-3 w-3" /> معطّل مؤقتاً
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> نشط
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-n-800 dark:text-n-700 mt-2">{c.name}</h2>
                </div>
                <div className="text-end">
                  <span className="text-xs text-n-400">كود الانضمام</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <code className="text-xs font-mono font-bold text-accent bg-accent-light px-2 py-0.5 rounded border border-accent/20">
                      {c.code}
                    </code>
                    <CopyButton value={c.code} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-n-100 dark:border-n-200 text-center">
                <div>
                  <p className="text-xs text-n-400">الطلاب</p>
                  <p className="text-base font-bold text-n-800 dark:text-n-700 mt-0.5">{c.studentsCount}</p>
                </div>
                <div>
                  <p className="text-xs text-n-400">الامتحانات</p>
                  <p className="text-base font-bold text-n-800 dark:text-n-700 mt-0.5">{c.quizzesCount}</p>
                </div>
                <div>
                  <p className="text-xs text-n-400">الواجبات</p>
                  <p className="text-base font-bold text-n-800 dark:text-n-700 mt-0.5">{c.assignmentsCount}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => {
                    setSelectedClassroomId(c.id);
                    setAddStudentOpen(true);
                  }}
                >
                  + إضافة طالب للفصل
                </Button>

                {/* Toggle Active / Hide Button */}
                <button
                  onClick={() => handleToggleStatus(c)}
                  title={isDeactivated ? 'تفعيل الفصل وإظهار الأنشطة' : 'تعطيل مؤقت للفصل وإخفاء الأنشطة'}
                  className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                    isDeactivated
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                  }`}
                >
                  {isDeactivated ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <span className="text-[11px] hidden sm:inline">
                    {isDeactivated ? 'تفعيل الفصل' : 'تعطيل مؤقت'}
                  </span>
                </button>

                {/* Delete Classroom Button */}
                <button
                  onClick={() => setClassroomToDelete(c)}
                  title="حذف الفصل الدراسي"
                  className="p-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CreateClassroomModal
        teacherId={teacherId}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />

      <AddStudentModal
        classrooms={classrooms.map((c) => ({ id: c.id, name: c.name }))}
        defaultClassroomId={selectedClassroomId}
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onSuccess={refresh}
      />

      {/* Delete Classroom Confirmation Modal */}
      {classroomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/40 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تأكيد حذف الفصل الدراسي
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف فصل <strong className="text-slate-800 dark:text-slate-200">({classroomToDelete.name})</strong>؟ سيتم إزالة جميع الواجبات والامتحانات المرتبطة بهذا الفصل.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف الفصل'}
              </button>
              <button
                disabled={isDeleting}
                onClick={() => setClassroomToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold py-2.5 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
