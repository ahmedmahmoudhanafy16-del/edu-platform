'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { FileText, CheckCircle2, Clock, Upload, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubmitAssignmentModal } from '@/components/student/SubmitAssignmentModal';
import { relativeTimeAr } from '@/lib/utils';
import { getStudentAssignments, AssignmentData } from '@/lib/store';

interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  classroomName: string;
  submission: {
    id: string;
    grade: number | null;
    status: string;
    teacherNote: string | null;
    submittedAt: string;
  } | null;
}

export function StudentAssignmentsClient({ initialAssignments }: { initialAssignments: AssignmentItem[] }) {
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [assignments, setAssignments] = useState(initialAssignments);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);

  useEffect(() => {
    function syncAssignments() {
      const stored = getStudentAssignments();
      let currentTargetId = '';
      try {
        const cur = localStorage.getItem('current_student');
        if (cur) {
          const parsed = JSON.parse(cur);
          currentTargetId = (parsed.studentCode || parsed.id || '').trim().toUpperCase();
        }
      } catch {}

      const mapped: AssignmentItem[] = stored.map((a) => {
        const sub = (a.submissions || []).find((s: any) => {
          const sId = (s.studentId || s.studentCode || '').trim().toUpperCase();
          return currentTargetId ? sId === currentTargetId : true;
        });
        return {
          id: a.id,
          title: a.title,
          description: a.description || '',
          dueDate: a.dueDate,
          maxScore: a.maxScore ?? 10,
          classroomName: a.classroomName || '',
          submission: sub
            ? {
                id: sub.id,
                grade: sub.grade ?? null,
                status: sub.status || 'SUBMITTED',
                teacherNote: sub.teacherNote || null,
                submittedAt: sub.submittedAt || new Date().toISOString(),
              }
            : null,
        };
      });
      setAssignments(mapped);
    }

    syncAssignments();

    window.addEventListener('edu_store_updated', syncAssignments);
    window.addEventListener('edu_classrooms_updated', syncAssignments);
    window.addEventListener('storage', syncAssignments);

    return () => {
      window.removeEventListener('edu_store_updated', syncAssignments);
      window.removeEventListener('edu_classrooms_updated', syncAssignments);
      window.removeEventListener('storage', syncAssignments);
    };
  }, [isAr]);

  function handleSuccess(assignmentId: string) {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? {
              ...a,
              submission: {
                id: 'sub-' + Date.now(),
                grade: null,
                status: 'SUBMITTED',
                teacherNote: null,
                submittedAt: new Date().toISOString(),
              },
            }
          : a
      )
    );
  }

  return (
    <>
      <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
        {assignments.length === 0 ? (
          <div className="p-12 text-center border border-n-200 dark:border-n-300 rounded-2xl bg-white dark:bg-n-100">
            <FileText className="h-10 w-10 text-n-300 dark:text-n-400 mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-n-800 dark:text-n-700">
              {isAr ? 'لا توجد واجبات مطلوبة حالياً' : 'No assignments due currently'}
            </p>
            <p className="text-xs text-n-400 mt-0.5">
              {isAr ? 'ستظهر هنا أي تكليفات جديدة يحددها المعلم' : 'Any new assignments specified by the teacher will appear here'}
            </p>
          </div>
        ) : (
          assignments.map((a) => {
            const isSubmitted = !!a.submission;
            const due = relativeTimeAr(a.dueDate);
            const dueText = isAr
              ? due.label
              : due.late
              ? 'Late'
              : due.label === 'اليوم'
              ? 'Today'
              : due.label;

            return (
              <div
                key={a.id}
                className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                      {a.classroomName}
                    </span>
                    <h2 className="text-base font-bold text-n-800 dark:text-n-700 mt-2">{a.title}</h2>
                    <p className="text-xs text-n-500 mt-1 max-w-2xl">{a.description}</p>
                  </div>
                  <div className="text-end">
                    <span className="text-xs font-semibold text-n-600 dark:text-n-400">
                      {isAr ? 'الدرجة:' : 'Score:'} {a.maxScore}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 justify-end">
                      <Clock className="h-3 w-3 text-n-400" />
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                          due.late
                            ? 'text-bad bg-bad-light'
                            : due.label === 'اليوم'
                            ? 'text-warn bg-warn-light'
                            : 'text-n-500 bg-n-100 dark:bg-n-300'
                        }`}
                      >
                        {dueText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submissions & Teacher feedback box */}
                {isSubmitted && a.submission?.teacherNote && (
                  <div className="p-3 bg-accent-light/50 border border-accent/20 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-accent-text flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" /> {isAr ? 'ملاحظة المعلم:' : 'Teacher Note:'}
                    </p>
                    <p className="text-n-700 dark:text-n-600">{a.submission.teacherNote}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-n-100 dark:border-n-200 flex items-center justify-between">
                  {isSubmitted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-ok bg-ok-light px-2.5 py-1 rounded font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {isAr ? 'تم التسليم' : 'Submitted'} ({new Date(a.submission!.submittedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')})
                      </span>
                      {a.submission!.grade != null ? (
                        <span className="text-xs font-bold text-ok bg-ok-light px-2.5 py-1 rounded">
                          {isAr ? 'الدرجة:' : 'Grade:'} {a.submission!.grade} / {a.maxScore}
                        </span>
                      ) : (
                        <span className="text-xs text-warn bg-warn-light px-2.5 py-1 rounded">
                          {isAr ? 'قيد المراجعة والتصحيح' : 'Under Review & Grading'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-warn bg-warn-light px-2.5 py-1 rounded font-medium">
                      {isAr ? 'مطلوب التسليم قبل انتهاء الموعد' : 'Submission required before deadline'}
                    </span>
                  )}

                  {!isSubmitted ? (
                    <Button size="sm" variant="primary" onClick={() => setSelectedAssignment(a)}>
                      <Upload className="h-3.5 w-3.5 me-1" />
                      {isAr ? 'تسليم الحل الآن' : 'Submit Solution Now'}
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => setSelectedAssignment(a)}>
                      {isAr ? 'تعديل / إعادة الإرسال' : 'Edit / Resubmit'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedAssignment && (
        <SubmitAssignmentModal
          assignmentId={selectedAssignment.id}
          assignmentTitle={selectedAssignment.title}
          maxScore={selectedAssignment.maxScore}
          isOpen={!!selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onSuccess={() => handleSuccess(selectedAssignment.id)}
        />
      )}
    </>
  );
}
