'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, FileText, CalendarCheck, BarChart3 } from 'lucide-react';
import { getStudentAcademicSummary } from '@/lib/analytics';
import { getSubmissions, getAssignments } from '@/lib/store';
import { calcStudentAvg } from '@/lib/utils';

export function StudentDashboardOverviewStats({
  initialExamsCount = 0,
  initialPendingCount = 0,
  initialAttendancePct = 100,
  initialAvgScore = null,
  studentId,
}: {
  initialExamsCount?: number;
  initialPendingCount?: number;
  initialAttendancePct?: number;
  initialAvgScore?: number | null;
  studentId: string;
}) {
  const [stats, setStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const submissions = getSubmissions(studentId);
      const summary = getStudentAcademicSummary(studentId, submissions);
      const assignments = getAssignments();
      const pendingCount = assignments.filter(
        (a) => !(a.submissions || []).some((s) => !s.studentId || s.studentId === studentId)
      ).length;
      const avgScore = calcStudentAvg(submissions);

      return {
        completedExams: summary.totalExams,
        pendingAssignments: pendingCount,
        attendancePct: initialAttendancePct,
        avgScore: avgScore !== null ? avgScore : initialAvgScore,
      };
    }

    return {
      completedExams: initialExamsCount,
      pendingAssignments: initialPendingCount,
      attendancePct: initialAttendancePct,
      avgScore: initialAvgScore,
    };
  });

  useEffect(() => {
    function recalculateStats() {
      const submissions = getSubmissions(studentId);
      const summary = getStudentAcademicSummary(studentId, submissions);
      const assignments = getAssignments();
      const pendingCount = assignments.filter(
        (a) => !(a.submissions || []).some((s) => !s.studentId || s.studentId === studentId)
      ).length;
      const avgScore = calcStudentAvg(submissions);

      setStats({
        completedExams: summary.totalExams,
        pendingAssignments: pendingCount,
        attendancePct: initialAttendancePct,
        avgScore,
      });
    }

    recalculateStats();

    window.addEventListener('edu_store_updated', recalculateStats);
    window.addEventListener('storage', recalculateStats);

    return () => {
      window.removeEventListener('edu_store_updated', recalculateStats);
      window.removeEventListener('storage', recalculateStats);
    };
  }, [studentId, initialAttendancePct]);

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100';

  const statItems = [
    {
      label: 'الامتحانات المنجزة',
      value: stats.completedExams,
      icon: ClipboardList,
      warn: false,
    },
    {
      label: 'واجبات مطلوبة',
      value: stats.pendingAssignments,
      icon: FileText,
      warn: stats.pendingAssignments > 0,
    },
    {
      label: 'نسبة الحضور',
      value: `${stats.attendancePct}%`,
      icon: CalendarCheck,
      warn: false,
    },
    {
      label: 'متوسط الدرجات',
      value: stats.avgScore !== null && stats.avgScore !== undefined ? `${stats.avgScore}%` : '—',
      icon: BarChart3,
      warn: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {statItems.map(({ label, value, icon: Icon, warn }) => (
        <div key={label} className={`${card} p-4 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-xs text-n-500">{label}</p>
            <p className={`text-lg font-bold leading-tight ${warn ? 'text-warn' : 'text-n-800 dark:text-n-700'}`}>
              {value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
