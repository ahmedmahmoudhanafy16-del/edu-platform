import React from 'react';
import { prisma, memoryQuizResults } from '@/lib/prisma';
import { BarChart3 } from 'lucide-react';
import { TeacherReportsClient } from './TeacherReportsClient';
import { getLatestStudentSubmission } from '@/lib/analytics';
import { supabase, getClassroomsFromSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function TeacherReportsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  const isAr = locale === 'ar';

  let students: any[] = [];
  let dbSuccess = false;
  try {
    const res = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: {
        quizResults: true,
        submissions: true,
        attendance: true,
        enrollments: {
          include: { classroom: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (res) {
      students = res;
      dbSuccess = true;
    }
  } catch (err) {
    console.warn('[Teacher Reports] DB query skipped:', err);
  }

  // Fallback to dynamic registered students only if DB query failed
  if (!dbSuccess) {
    try {
      const { getDynamicStudents } = await import('@/lib/dynamic-students');
      const dynamicList = getDynamicStudents();
      if (dynamicList && dynamicList.length > 0) {
        students = dynamicList;
      }
    } catch (e) {}
  }

  let classrooms: any[] = [];
  try {
    const dbClassrooms = await prisma.classroom.findMany({
      select: { id: true, name: true },
    });
    if (dbClassrooms) classrooms = dbClassrooms;
  } catch (e) {}

  try {
    const sbClassrooms = await getClassroomsFromSupabase();
    if (sbClassrooms && sbClassrooms.length > 0) {
      const existingIds = new Set(classrooms.map((c) => c.id));
      for (const sb of sbClassrooms) {
        if (!existingIds.has(sb.id)) {
          classrooms.push({ id: sb.id, name: sb.name });
          existingIds.add(sb.id);
        }
      }
    }
  } catch (e) {}

  // Authoritative Supabase Cloud Sync: Students & Exam Attempts
  const attemptsByStudent = new Map<string, any[]>();
  try {
    const [studentsRes, attemptsRes] = await Promise.all([
      supabase.from('students').select('*').not('student_code', 'like', '__%'),
      supabase.from('exam_attempts').select('id, student_id, exam_id, final_score, status, completed_at, created_at, exams(id, title, total_marks, passing_score)'),
    ]);

    if (studentsRes.data && studentsRes.data.length > 0) {
      const existingCodes = new Set(students.map((s) => String(s.studentCode || '').toUpperCase()));
      for (const sb of studentsRes.data) {
        const code = String(sb.student_code || '').toUpperCase();
        if (code.startsWith('__')) continue;
        if (!existingCodes.has(code)) {
          students.push({
            id: sb.id,
            name: sb.full_name,
            studentCode: sb.student_code,
            phone: sb.phone || '',
            parentPhone: sb.parent_phone || '',
            defaultPassword: '',
            password: '',
            isActive: sb.is_active !== false,
            createdAt: sb.created_at || new Date(),
            grade: sb.grade_level || '',
            gradeLevel: sb.grade_level || '',
            enrollments: [],
            submissions: [],
            attendance: [],
            quizResults: [],
          });
          existingCodes.add(code);
        }
      }
    }

    if (attemptsRes.data && attemptsRes.data.length > 0) {
      for (const att of attemptsRes.data) {
        const sid = String(att.student_id || '');
        if (!attemptsByStudent.has(sid)) attemptsByStudent.set(sid, []);
        const examObj: any = Array.isArray(att.exams) ? att.exams[0] : att.exams;
        attemptsByStudent.get(sid)!.push({
          id: att.id,
          quizId: att.exam_id,
          totalScore: Number(att.final_score) || 0,
          autoScore: Number(att.final_score) || 0,
          maxScore: Number(examObj?.total_marks) || 100,
          isPassed: att.status === 'completed' && (Number(att.final_score) || 0) >= (Number(examObj?.passing_score) || 50),
          submittedAt: att.completed_at || att.created_at || new Date(),
          quiz: {
            id: att.exam_id,
            title: examObj?.title || (isAr ? 'امتحان سحابي' : 'Cloud Exam'),
            type: 'EXAM',
          },
        });
      }
    }
  } catch (sbErr) {
    console.warn('[Teacher Reports] Supabase sync notice:', sbErr);
  }

  const studentReports = (students || []).map((s) => {
    // Merge database results with in-memory store and Supabase cloud attempts
    const dbQuizIds = new Set((s.quizResults || []).map((r: any) => r.quizId || r.id));
    const memResults = (memoryQuizResults || []).filter(
      (m: any) =>
        (m.studentId === s.id || m.studentId === s.studentCode) &&
        !dbQuizIds.has(m.quizId)
    );

    const sbStudentAttempts = attemptsByStudent.get(String(s.id)) || attemptsByStudent.get(String(s.studentCode)) || [];
    const combinedResults = [...(s.quizResults || []), ...memResults, ...sbStudentAttempts];
    const latest = getLatestStudentSubmission(s.studentCode || s.id, combinedResults);
    const scorePct = latest ? latest.percentage : 0;

    return {
      id: s.id,
      name: s.name,
      studentCode: s.studentCode,
      phone: s.phone || '—',
      parentPhone: s.parentPhone || s.phone || '—',
      grade: s.grade || '—',
      classroomId: s.enrollments?.[0]?.classroom?.id || '',
      classroomName: s.enrollments?.[0]?.classroom?.name || '',
      avgScore: scorePct,
      latestScore: latest ? latest.score : null,
      latestMaxScore: latest ? latest.maxScore : null,
      latestPercentage: latest ? latest.percentage : null,
      hasSubmissions: Boolean(latest),
      examsCompleted: combinedResults.length,
      homeworkCompleted: s.submissions?.length ?? 0,
      attendanceCount: s.attendance?.length ?? 0,
      status: scorePct >= 65 ? (isAr ? 'ممتاز' : 'Excellent') : (isAr ? 'يحتاج متابعة' : 'Needs Follow-up'),
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-accent" />
          {isAr ? 'التقارير الأكاديمية وتحليلات الأداء' : 'Academic Reports & Performance Analytics'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isAr
            ? 'تصدير كشوف الدرجات، إحصائيات الحضور، وإرسال تنبيهات واتساب جماعية لأولياء الأمور'
            : 'Export grade rosters, attendance stats, and broadcast WhatsApp alerts to parents'}
        </p>
      </div>

      <TeacherReportsClient initialReports={studentReports} classrooms={classrooms} />
    </div>
  );
}
