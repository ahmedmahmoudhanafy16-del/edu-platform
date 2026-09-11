'use client';

import React, { useState } from 'react';
import { CompactStudentsTable } from '@/components/teacher/CompactStudentsTable';
import { UserPlus, Users, CheckCircle2, School, TrendingUp } from 'lucide-react';
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
  classroomId?: string;
  classroomName?: string;
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

  // Executive Metric Calculations with Zero-Division Protection
  const totalStudents = initialStudents.length;
  const activeCount = initialStudents.filter((s) => s.isActive !== false).length;
  const activeRate = totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0;

  const assignedCount = initialStudents.filter((s) => Boolean(s.classroomId || s.classroomName)).length;
  const assignedRate = totalStudents > 0 ? Math.round((assignedCount / totalStudents) * 100) : 0;

  const scoredStudents = initialStudents.filter((s) => s.avgScore != null);
  const avgPerformance = scoredStudents.length > 0
    ? Math.round(scoredStudents.reduce((acc, s) => acc + (s.avgScore || 0), 0) / scoredStudents.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isAr ? 'شؤون الطلاب وسجلات القيد' : 'Student Affairs & Enrollment Records'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'كشف شامل ببيانات الطلاب، متابعة كلمات المرور والحسابات، وتصدير التقارير والتواصل الفوري'
              : 'Full student roster, password & account management, report export, and instant parent messaging'}
          </p>
        </div>
        <Button size="md" onClick={() => setAddStudentOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 shadow-sm">
          <UserPlus className="h-4 w-4" />
          {isAr ? 'إضافة طالب جديد' : 'Add New Student'}
        </Button>
      </div>

      {/* 4 Executive Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الطلاب المسجلين' : 'Total Enrolled Students'}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {totalStudents}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Active Accounts Rate */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'نسبة الحسابات النشطة' : 'Active Accounts Rate'}
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
              {activeRate}%
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Classroom Enrollment Rate */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'المعينين بالفصول الدراسية' : 'Classroom Assigned'}
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
              {assignedRate}%
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <School className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Average Exam Performance */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'متوسط نتائج الاختبارات' : 'Exam Performance Avg'}
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 tabular-nums">
              {avgPerformance}%
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Students Table */}
      <CompactStudentsTable
        students={initialStudents as any}
        classroomName={isAr ? 'الصف_الثالث_الإعدادي' : '3rd_Preparatory_Grade'}
        classrooms={classrooms}
        onRefresh={refresh}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        classrooms={classrooms}
        isOpen={addStudentOpen}
        onClose={() => setAddStudentOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
