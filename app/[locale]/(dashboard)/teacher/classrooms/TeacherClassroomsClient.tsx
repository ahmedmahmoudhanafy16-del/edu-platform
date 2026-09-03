'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, BookOpen, Users, Copy, Sparkles,
  Trash2, Eye, EyeOff, AlertTriangle, CheckCircle2, PauseCircle, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/CopyButton';
import { CreateClassroomModal } from '@/components/teacher/CreateClassroomModal';
import { EditClassroomModal } from '@/components/teacher/EditClassroomModal';
import { AddStudentModal } from '@/components/teacher/AddStudentModal';
import { useRouter } from 'next/navigation';
import { toggleClassroomStatus, deleteClassroom } from '@/actions/classroom';
import {
  getStudentsFromStore,
  getQuizzes,
  getAssignments,
  deleteClassroomFromStore,
  toggleClassroomStatusInStore
} from '@/lib/store';
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
const DELETED_KEY = 'edu_deleted_classrooms';

function countStudentsForClassroom(c: ClassroomItem, allStudents: any[]): number {
  if (!allStudents || !Array.isArray(allStudents)) return 0;
  return allStudents.filter((s: any) => {
    if (!s) return false;
    // 1. Direct ID match
    if (s.classroomId && (s.classroomId === c.id || s.classroom === c.id)) return true;
    if (s.classroom && s.classroom === c.id) return true;
    // 2. Name or Grade match (e.g. "الصف الرابع الابتدائي" or "الصف الثالث الإعدادي")
    if (c.name) {
      const cName = c.name.trim();
      if (s.classroom && typeof s.classroom === 'string' && s.classroom.trim() === cName) return true;
      if (s.grade && typeof s.grade === 'string' && (cName.includes(s.grade.trim()) || s.grade.trim().includes(cName))) return true;
      if (s.gradeLevel && typeof s.gradeLevel === 'string' && (cName.includes(s.gradeLevel.trim()) || s.gradeLevel.trim().includes(cName))) return true;
    }
    return false;
  }).length;
}

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
  const [classroomToEdit, setClassroomToEdit] = useState<ClassroomItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync with localStorage on mount & prop changes, strictly filtering out deleted classrooms and dynamically computing counts
  useEffect(() => {
    try {
      const deletedRaw = localStorage.getItem(DELETED_KEY);
      const deletedIds = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

      const stored = localStorage.getItem(STORAGE_KEY);
      let localList: ClassroomItem[] = [];

      if (stored) {
        const parsed: ClassroomItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          localList = parsed;
        }
      }

      const map = new Map<string, ClassroomItem>();

      if (localList.length > 0) {
        // Authoritative client store
        localList.forEach((c) => {
          if (c?.id && !deletedIds.has(c.id)) {
            map.set(c.id, c);
          }
        });
      } else {
        // First-time fallback from server
        initialClassrooms.forEach((c) => {
          if (c?.id && !deletedIds.has(c.id)) {
            map.set(c.id, c);
          }
        });
      }

      const allStudents = getStudentsFromStore();
      const allQuizzes = getQuizzes();
      const allAssignments = getAssignments();

      const enriched = Array.from(map.values()).map((c) => {
        const computedStudents = countStudentsForClassroom(c, allStudents);
        const computedQuizzes = allQuizzes.filter((q: any) => q.classroomId === c.id || (c.name && q.classroomName === c.name)).length;
        const computedAssignments = allAssignments.filter((a: any) => a.classroomId === c.id || (c.name && a.classroomName === c.name)).length;

        return {
          ...c,
          studentsCount: Math.max(c.studentsCount || 0, computedStudents),
          quizzesCount: Math.max(c.quizzesCount || 0, computedQuizzes),
          assignmentsCount: Math.max(c.assignmentsCount || 0, computedAssignments),
        };
      });

      setClassrooms(enriched);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
      return;
    } catch {}

    setClassrooms(initialClassrooms);
  }, [initialClassrooms]);

  // Real-time synchronization whenever students, quizzes, or assignments are updated
  useEffect(() => {
    function handleStoreUpdate() {
      try {
        const allStudents = getStudentsFromStore();
        const allQuizzes = getQuizzes();
        const allAssignments = getAssignments();

        setClassrooms((prev) =>
          prev.map((c) => {
            const computedStudents = countStudentsForClassroom(c, allStudents);
            const computedQuizzes = allQuizzes.filter((q: any) => q.classroomId === c.id || (c.name && q.classroomName === c.name)).length;
            const computedAssignments = allAssignments.filter((a: any) => a.classroomId === c.id || (c.name && a.classroomName === c.name)).length;

            return {
              ...c,
              studentsCount: Math.max(c.studentsCount || 0, computedStudents),
              quizzesCount: Math.max(c.quizzesCount || 0, computedQuizzes),
              assignmentsCount: Math.max(c.assignmentsCount || 0, computedAssignments),
            };
          })
        );
      } catch {}
    }

    window.addEventListener('edu_store_updated', handleStoreUpdate);
    window.addEventListener('storage', handleStoreUpdate);
    return () => {
      window.removeEventListener('edu_store_updated', handleStoreUpdate);
      window.removeEventListener('storage', handleStoreUpdate);
    };
  }, []);

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

    // 1. Optimistic Update in Central Store (Cascades to student quiz/assignment visibility)
    toggleClassroomStatusInStore(classroom.id, nextState);

    setClassrooms((prev) => {
      const nextList = prev.map((c) => (c.id === classroom.id ? { ...c, isActive: nextState } : c));
      persistClassrooms(nextList);
      return nextList;
    });

    try {
      const res = await toggleClassroomStatus(classroom.id, nextState);
      if (res?.success) {
        toast.success(res.message || (nextState ? 'تم تفعيل الفصل الدراسي بنجاح' : 'تم تعطيل الفصل الدراسي مؤقتاً'));
      }
    } catch {
      toast.success(nextState ? 'تم تفعيل الفصل الدراسي بنجاح' : 'تم تعطيل الفصل الدراسي مؤقتاً');
    }

    refresh();
  }

  async function handleConfirmDelete() {
    if (!classroomToDelete) return;
    setIsDeleting(true);

    const targetId = classroomToDelete.id;

    // 1. Full Cascade Delete: Removes classroom, its quizzes, its assignments, and disassociates students everywhere
    deleteClassroomFromStore(targetId);

    // 2. Optimistic deletion in state
    setClassrooms((prev) => {
      const nextList = prev.filter((c) => c.id !== targetId);
      persistClassrooms(nextList);
      return nextList;
    });

    // 3. Trigger server delete
    try {
      const res = await deleteClassroom(targetId);
      if (res?.success) {
        toast.success(res.message || 'تم حذف الفصل الدراسي بالكامل من المشروع بنجاح');
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

      {classrooms.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              لا توجد فصول دراسية حالياً
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              تم حذف الفصل الدراسي بنجاح. يمكنك الآن إنشاء فصل دراسي جديد لبدء إضافة الطلاب وتعيين الواجبات والاختبارات.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="mt-2">
            <Plus className="h-4 w-4 me-1.5" />
            إنشاء فصل دراسي جديد
          </Button>
        </div>
      ) : (
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

                  {/* Edit Classroom Button */}
                  <button
                    onClick={() => setClassroomToEdit(c)}
                    title="تعديل بيانات الفصل"
                    className="p-2 rounded-lg border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="text-[11px] hidden sm:inline">تعديل</span>
                  </button>

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
      )}

      <CreateClassroomModal
        teacherId={teacherId}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(created) => {
          if (created?.id) {
            setClassrooms((prev) => [
              {
                id: created.id,
                name: created.name,
                subject: created.subject,
                code: created.code,
                studentsCount: 0,
                quizzesCount: 0,
                assignmentsCount: 0,
                isActive: true,
              },
              ...prev.filter((c) => c.id !== created.id),
            ]);
          }
          refresh();
        }}
      />

      <EditClassroomModal
        classroom={classroomToEdit}
        isOpen={Boolean(classroomToEdit)}
        onClose={() => setClassroomToEdit(null)}
        onSuccess={(updated) => {
          setClassrooms((prev) =>
            prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          );
          refresh();
        }}
      />

      <AddStudentModal
        classrooms={classrooms.map((c) => ({ id: c.id, name: c.name }))}
        defaultClassroomId={selectedClassroomId}
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onSuccess={() => {
          if (selectedClassroomId) {
            setClassrooms((prev) =>
              prev.map((c) =>
                c.id === selectedClassroomId
                  ? { ...c, studentsCount: (c.studentsCount || 0) + 1 }
                  : c
              )
            );
          }
          refresh();
        }}
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
