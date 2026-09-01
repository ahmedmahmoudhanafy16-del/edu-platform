'use client';

import React, { useState } from 'react';
import { CompactStudentsTable } from '@/components/teacher/CompactStudentsTable';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddStudentModal } from '@/components/teacher/AddStudentModal';
import { useRouter } from 'next/navigation';

interface StudentItem {
  id: string;
  name: string;
  studentCode: string;
  password?: string;
  phone: string | null;
  avgScore: number | null;
  submissionsCount: number;
  attendanceCount: number;
  lastActive: string | Date | null;
  isActive?: boolean;
}

export function TeacherStudentsClient({
  initialStudents,
  classrooms,
}: {
  initialStudents: StudentItem[];
  classrooms: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">شؤون الطلاب وتقارير أولياء الأمور</h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            كشف كامل بالطلاب، نسب الحضور والدرجات، وتصدير ملفات Excel وتقارير واتساب فورية
          </p>
        </div>
        <Button size="md" onClick={() => setAddStudentOpen(true)}>
          <UserPlus className="h-4 w-4 me-1.5" />
          إضافة طالب جديد
        </Button>
      </div>

      <CompactStudentsTable
        students={initialStudents}
        classroomName="الصف_الثالث_الإعدادي"
        onRefresh={refresh}
      />

      <AddStudentModal
        classrooms={classrooms}
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onSuccess={refresh}
      />
    </>
  );
}
