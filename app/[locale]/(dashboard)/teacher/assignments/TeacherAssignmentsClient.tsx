'use client';

import React, { useState } from 'react';
import {
  Plus,
  Users,
  Award,
  FileText,
  Edit,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateAssignmentModal } from '@/components/teacher/CreateAssignmentModal';
import { GradeSubmissionsModal } from '@/components/teacher/GradeSubmissionsModal';
import { deleteAssignment, toggleAssignmentLock } from '@/actions/assignment';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  isClosed?: boolean;
  classroomName: string;
  classroomId: string;
  submissions: {
    id: string;
    studentName: string;
    studentCode: string;
    answerText: string | null;
    fileUrl: string | null;
    grade: number | null;
    teacherNote: string | null;
    status: string;
    submittedAt: string;
  }[];
}

export function TeacherAssignmentsClient({
  initialAssignments,
  classrooms,
}: {
  initialAssignments: AssignmentItem[];
  classrooms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentItem[]>(initialAssignments);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<AssignmentItem | null>(null);

  // Delete dialog state
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Grading modal state
  const [gradingAssignment, setGradingAssignment] = useState<AssignmentItem | null>(null);

  // Sync state with props
  React.useEffect(() => {
    setAssignments(initialAssignments);
  }, [initialAssignments]);

  function refresh() {
    router.refresh();
  }

  function handleCreateNew() {
    setAssignmentToEdit(null);
    setModalOpen(true);
  }

  function handleEdit(item: AssignmentItem) {
    setAssignmentToEdit(item);
    setModalOpen(true);
  }

  async function handleToggleLock(item: AssignmentItem) {
    const nextLocked = !item.isClosed;

    // Optimistic update
    setAssignments((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, isClosed: nextLocked } : a))
    );

    try {
      const res = await toggleAssignmentLock(item.id, nextLocked);
      if (res.success) {
        toast.success(res.message);
      } else {
        // Revert
        setAssignments((prev) =>
          prev.map((a) => (a.id === item.id ? { ...a, isClosed: !nextLocked } : a))
        );
        toast.error(res.error || 'فشل تغيير حالة تسليم الواجب');
      }
    } catch (err: any) {
      setAssignments((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, isClosed: !nextLocked } : a))
      );
      toast.error('حدث خطأ أثناء تعديل حالة الواجب');
    }
  }

  async function handleConfirmDelete() {
    if (!assignmentToDelete) return;
    setDeleteLoading(true);

    try {
      const res = await deleteAssignment(assignmentToDelete.id);
      if (res.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentToDelete.id));
        toast.success(res.message || 'تم حذف الواجب بنجاح');
        setAssignmentToDelete(null);
        refresh();
      } else {
        toast.error(res.error || 'فشل حذف الواجب');
      }
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ أثناء حذف الواجب');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الواجبات والتصحيح السريع</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            إدارة وتعديل التكليفات الدراسية، التحكم في فترات التسليم، وتصحيح أعمال الطلاب
          </p>
        </div>
        <Button size="md" variant="primary" onClick={handleCreateNew}>
          <Plus className="h-4 w-4 me-1.5" />
          إضافة واجب جديد
        </Button>
      </div>

      {/* Assignments List */}
      <div className="space-y-4" dir="rtl">
        {assignments.length === 0 ? (
          <div className="p-12 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100">
            <FileText className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-n-800 dark:text-n-700">لا توجد واجبات مضافة بعد</p>
            <p className="text-xs text-n-400 mt-1">اضغط على زر "إضافة واجب جديد" أعلاه لنشر أول تكليف للطلاب</p>
          </div>
        ) : (
          assignments.map((a) => {
            const isClosed = Boolean(a.isClosed);

            return (
              <div
                key={a.id}
                className={`p-6 rounded-2xl border transition-all duration-200 bg-white dark:bg-n-100 space-y-4 shadow-sm ${
                  isClosed
                    ? 'border-warn/40 bg-warn-light/10 opacity-95'
                    : 'border-n-200 dark:border-n-300'
                }`}
              >
                {/* Header & Actions */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                        {a.classroomName}
                      </span>
                      {isClosed ? (
                        <span className="text-[10px] font-bold text-warn bg-warn-light px-2 py-0.5 rounded border border-warn/30 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          مغلق للتسليم
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-ok bg-ok-light px-2 py-0.5 rounded border border-ok/30 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          مفتوح للتسليم
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-bold text-n-800 dark:text-n-700 leading-snug">{a.title}</h2>
                    {a.description && <p className="text-xs text-n-500 leading-relaxed">{a.description}</p>}
                  </div>

                  {/* Top Right Actions: Lock Toggle, Edit, Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(a)}
                      className={`p-2 rounded-lg border transition-colors ${
                        isClosed
                          ? 'text-warn bg-warn-light border-warn/30 hover:bg-warn/20'
                          : 'text-ok bg-ok-light border-ok/30 hover:bg-ok/20'
                      }`}
                      title={isClosed ? 'فتح التسليم للطلاب' : 'قفل التسليم (منع التسليمات المتأخرة)'}
                    >
                      {isClosed ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(a)}
                      className="p-2 rounded-lg border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 hover:text-accent hover:border-accent hover:bg-accent-light transition-colors"
                      title="تعديل بيانات الواجب"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAssignmentToDelete(a)}
                      className="p-2 rounded-lg border border-n-200 dark:border-n-300 text-n-600 dark:text-n-400 hover:text-bad hover:border-bad hover:bg-bad-light transition-colors"
                      title="حذف هذا الواجب نهائياً"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics & Due Date */}
                <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl bg-n-50/50 dark:bg-n-200/50 border border-n-100 dark:border-n-200 text-xs">
                  <span className="font-semibold text-n-700 dark:text-n-600 flex items-center gap-1">
                    الدرجة القصوى: <strong className="text-accent">{a.maxScore} درجة</strong>
                  </span>
                  <span className="text-n-500 flex items-center gap-1.5 font-mono">
                    <Clock className="h-3.5 w-3.5 text-n-400" />
                    آخر موعد: {new Date(a.dueDate).toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                {/* Submissions & Bottom Bar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-n-600 dark:text-n-400 font-medium flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-accent" />
                    إجمالي التسليمات المسجلة:{' '}
                    <strong className="text-n-800 dark:text-n-700">{a.submissions.length} طالب</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleEdit(a)}
                    >
                      <Edit className="h-3.5 w-3.5 me-1 text-accent" />
                      تعديل
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs font-semibold"
                      onClick={() => setGradingAssignment(a)}
                    >
                      عرض التسليمات والتصحيح ({a.submissions.length})
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal (AlertDialog) */}
      {assignmentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-n-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="bg-white dark:bg-n-100 border border-n-200 dark:border-n-300 rounded-2xl w-full max-w-md overflow-hidden shadow-modal space-y-0">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-bad-light text-bad flex items-center justify-center border border-bad/20 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-n-800 dark:text-n-700">تأكيد حذف الواجب</h3>
                  <p className="text-xs text-n-500">إجراء لا يمكن التراجع عنه</p>
                </div>
              </div>

              <div className="p-3.5 bg-n-50 dark:bg-n-200 rounded-xl text-xs text-n-600 space-y-1">
                <p>
                  أنت على وشك حذف: <strong className="text-bad">{assignmentToDelete.title}</strong>
                </p>
                <p className="text-n-400">
                  هل أنت متأكد من حذف هذا الواجب؟ سيتم حذف جميع تسليمات وملفات الطلاب المرتبطة به نهائياً.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setAssignmentToDelete(null)}
                  disabled={deleteLoading}
                >
                  إلغاء
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="md"
                  loading={deleteLoading}
                  onClick={handleConfirmDelete}
                  className="bg-bad text-white hover:bg-bad/90 font-semibold"
                >
                  تأكيد الحذف
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      <CreateAssignmentModal
        classrooms={classrooms}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setAssignmentToEdit(null);
        }}
        onSuccess={refresh}
        assignmentToEdit={assignmentToEdit}
      />

      {/* Grade Submissions Modal */}
      {gradingAssignment && (
        <GradeSubmissionsModal
          assignmentTitle={gradingAssignment.title}
          maxScore={gradingAssignment.maxScore}
          submissions={gradingAssignment.submissions}
          isOpen={!!gradingAssignment}
          onClose={() => setGradingAssignment(null)}
          onSuccess={refresh}
        />
      )}
    </>
  );
}
