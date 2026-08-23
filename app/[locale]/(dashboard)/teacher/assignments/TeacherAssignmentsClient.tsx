'use client';

import React, { useState } from 'react';
import { Plus, Users, Award, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateAssignmentModal } from '@/components/teacher/CreateAssignmentModal';
import { GradeSubmissionsModal } from '@/components/teacher/GradeSubmissionsModal';
import { useRouter } from 'next/navigation';

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
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
  const [createOpen, setCreateOpen] = useState(false);
  const [gradingAssignment, setGradingAssignment] = useState<AssignmentItem | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الواجبات والتصحيح السريع</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">متابعة تسليمات الطلاب وتصحيح الواجبات وتدوين الملاحظات</p>
        </div>
        <Button size="md" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 me-1.5" />
          إضافة واجب جديد
        </Button>
      </div>

      <div className="space-y-4">
        {initialAssignments.length === 0 ? (
          <div className="p-12 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100">
            <FileText className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-n-800 dark:text-n-700">لا توجد واجبات مضافة بعد</p>
            <p className="text-xs text-n-400 mt-1">اضغط على زر "إضافة واجب جديد" أعلاه لنشر أول تكليف</p>
          </div>
        ) : (
          initialAssignments.map((a) => (
            <div key={a.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                    {a.classroomName}
                  </span>
                  <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-2">{a.title}</h2>
                  <p className="text-xs text-n-500 mt-1">{a.description}</p>
                </div>
                <div className="text-end">
                  <span className="text-xs font-semibold text-n-600 dark:text-n-400">الدرجة القصوى: {a.maxScore}</span>
                  <p className="text-xs text-n-400 mt-1 font-mono">
                    آخر موعد: {new Date(a.dueDate).toLocaleDateString('ar-EG')}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-n-100 dark:border-n-200 flex items-center justify-between">
                <span className="text-xs text-n-600 dark:text-n-400 font-medium flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  إجمالي التسليمات: {a.submissions.length} طالب
                </span>
                <Button variant="secondary" size="sm" onClick={() => setGradingAssignment(a)}>
                  عرض تسليمات الطلاب والتصحيح ({a.submissions.length})
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <CreateAssignmentModal
        classrooms={classrooms}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />

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
