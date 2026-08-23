'use client';

import React, { useState } from 'react';
import { Plus, BookOpen, Users, Copy, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/CopyButton';
import { CreateClassroomModal } from '@/components/teacher/CreateClassroomModal';
import { AddStudentModal } from '@/components/teacher/AddStudentModal';
import { useRouter } from 'next/navigation';

interface ClassroomItem {
  id: string;
  name: string;
  subject: string;
  code: string;
  studentsCount: number;
  quizzesCount: number;
  assignmentsCount: number;
}

export function TeacherClassroomsClient({
  initialClassrooms,
  teacherId,
}: {
  initialClassrooms: ClassroomItem[];
  teacherId: string;
}) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  function refresh() {
    router.refresh();
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
        {initialClassrooms.map((c) => (
          <div key={c.id} className="p-6 rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-semibold text-accent bg-accent-light px-2.5 py-0.5 rounded border border-accent/20">
                  {c.subject}
                </span>
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

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1"
                onClick={() => setAddStudentOpen(true)}
              >
                + إضافة طالب للفصل
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(c.code);
                  alert(`تم نسخ كود الفصل (${c.code}) لمشاركته مع الطلاب!`);
                }}
              >
                نسخ كود الفصل
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CreateClassroomModal
        teacherId={teacherId}
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={refresh}
      />

      <AddStudentModal
        classrooms={initialClassrooms.map((c) => ({ id: c.id, name: c.name }))}
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onSuccess={refresh}
      />
    </>
  );
}
