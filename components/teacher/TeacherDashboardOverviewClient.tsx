'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Users, FileText, ClipboardList, Video, Ticket, BarChart3 } from 'lucide-react';
import { getAssignments, getQuizzes, AssignmentData, QuizData } from '@/lib/store';

export function TeacherDashboardOverviewClient({
  initialClassroomsCount = 1,
  initialStudentsCount = 4,
  initialAssignments = [],
  locale,
}: {
  initialClassroomsCount?: number;
  initialStudentsCount?: number;
  initialAssignments?: AssignmentData[];
  locale: string;
}) {
  const [assignments, setAssignments] = useState<AssignmentData[]>(() => {
    if (typeof window !== 'undefined') {
      return getAssignments();
    }
    return initialAssignments || [];
  });

  const [quizzes, setQuizzes] = useState<QuizData[]>(() => {
    if (typeof window !== 'undefined') {
      return getQuizzes();
    }
    return [];
  });

  useEffect(() => {
    function syncStore() {
      setAssignments(getAssignments());
      setQuizzes(getQuizzes());
    }

    syncStore();

    window.addEventListener('edu_store_updated', syncStore);
    window.addEventListener('storage', syncStore);

    return () => {
      window.removeEventListener('edu_store_updated', syncStore);
      window.removeEventListener('storage', syncStore);
    };
  }, []);

  const card = 'rounded-xl border border-n-200 dark:border-n-300 bg-white dark:bg-n-100';

  const stats = [
    { label: 'الفصول الدراسية', value: initialClassroomsCount, icon: BookOpen },
    { label: 'إجمالي الطلاب', value: initialStudentsCount, icon: Users },
    { label: 'الواجبات', value: assignments.length, icon: FileText },
    { label: 'الامتحانات', value: quizzes.length, icon: ClipboardList },
  ];

  return (
    <div className="space-y-8">
      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${card} p-5 flex items-center justify-between`}>
            <div>
              <p className="text-xs text-n-500 dark:text-n-400">{label}</p>
              <p className="text-2xl font-bold text-n-800 dark:text-n-700 mt-1 tabular-nums">{value}</p>
            </div>
            <Icon className="h-5 w-5 text-n-300 dark:text-n-400" strokeWidth={1.75} />
          </div>
        ))}
      </div>

      {/* Recent assignments + quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent assignments */}
        <div className={card}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-n-100 dark:border-n-200">
            <h2 className="text-sm font-bold text-n-800 dark:text-n-700">آخر الواجبات المضافة</h2>
            <Link href={`/${locale}/teacher/assignments`} className="text-xs text-accent hover:underline">
              عرض الكل
            </Link>
          </div>
          <div className="px-5 py-4">
            {assignments.length === 0 ? (
              <div className="text-center py-6 text-xs text-n-400 border border-dashed border-n-200 dark:border-n-300 rounded-xl bg-n-50/50 dark:bg-n-200/20">
                <FileText className="h-6 w-6 text-n-300 dark:text-n-400 mx-auto mb-1.5" strokeWidth={1.5} />
                <p className="font-semibold text-n-700 dark:text-n-600">لا توجد واجبات مضافة حالياً</p>
                <p className="text-[11px] text-n-400 mt-0.5">يمكنك إضافة واجب دراسي جديد من صفحة الواجبات</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {assignments.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-n-100 dark:border-n-200 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-n-800 dark:text-n-700 truncate">{a.title}</p>
                      <p className="text-xs text-n-400 mt-0.5">الدرجة القصوى: {a.maxScore ?? 10}</p>
                    </div>
                    <span className="text-xs text-n-500 font-mono flex-shrink-0 ms-3">
                      {new Date(a.dueDate || Date.now()).toLocaleDateString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className={card}>
          <div className="px-5 pt-5 pb-3 border-b border-n-100 dark:border-n-200">
            <h2 className="text-sm font-bold text-n-800 dark:text-n-700">روابط سريعة</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              {
                href: `/${locale}/teacher/access-codes`,
                icon: Ticket,
                title: 'أكواد الحصص',
                sub: 'توليد ومتابعة المبيعات',
              },
              {
                href: `/${locale}/teacher/live`,
                icon: Video,
                title: 'البث المباشر',
                sub: 'بدء وإدارة الحصص',
              },
              {
                href: `/${locale}/teacher/classrooms`,
                icon: BookOpen,
                title: 'إدارة الفصول',
                sub: 'إضافة وتعديل الفصول',
              },
              {
                href: `/${locale}/teacher/quizzes`,
                icon: ClipboardList,
                title: 'بنك الامتحانات',
                sub: 'إنشاء وتوليد الاختبارات',
              },
              {
                href: `/${locale}/teacher/students`,
                icon: Users,
                title: 'قائمة الطلاب',
                sub: 'تصدير CSV · واتساب',
              },
              {
                href: `/${locale}/teacher/reports`,
                icon: BarChart3,
                title: 'التقارير الأكاديمية',
                sub: 'كشوف الدرجات والحضور',
              },
            ].map(({ href, icon: Icon, title, sub }) => (
              <Link
                key={href}
                href={href}
                className="p-4 rounded-lg border border-n-200 dark:border-n-300 hover:bg-n-50 dark:hover:bg-n-200 transition-colors duration-[140ms]"
              >
                <Icon className="h-5 w-5 text-accent mb-2.5" strokeWidth={1.75} />
                <p className="text-xs font-semibold text-n-800 dark:text-n-700">{title}</p>
                <p className="text-[11px] text-n-400 mt-0.5">{sub}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
