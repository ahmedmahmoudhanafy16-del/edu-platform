'use client';

import React, { useState } from 'react';
import { CompactStudentsTable } from '@/components/teacher/CompactStudentsTable';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddStudentModal } from '@/components/teacher/AddStudentModal';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

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
  const locale = useLocale();
  const isAr = locale === 'ar';
  const [addStudentOpen, setAddStudentOpen] = useState(false);

  function refresh() {
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">
            {isAr ? 'شؤون الطلاب وتقارير أولياء الأمور' : 'Student Affairs & Parent Reports'}
          </h1>
          <p className="text-xs text-n-500 dark:text-n-400 mt-1">
            {isAr
              ? 'كشف كامل بالطلاب، نسب الحضور والدرجات، وتصدير ملفات Excel وتقارير واتساب فورية'
              : 'Full student roster, attendance rates, grades, Excel export, and instant WhatsApp reports'}
          </p>
        </div>
        <Button size="md" onClick={() => setAddStudentOpen(true)}>
          <UserPlus className="h-4 w-4 me-1.5" />
          {isAr ? 'إضافة طالب جديد' : 'Add New Student'}
        </Button>
      </div>

      <CompactStudentsTable
        students={initialStudents as any}
        classroomName={isAr ? 'الصف_الثالث_الإعدادي' : '3rd_Preparatory_Grade'}
        classrooms={classrooms}
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
