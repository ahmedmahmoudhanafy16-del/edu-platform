import { prisma } from '@/lib/prisma';
import { StudentAssignmentsClient } from './StudentAssignmentsClient';
import { getAuthenticatedStudent } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentAssignmentsPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  let student: any = null;
  try {
    student = await getAuthenticatedStudent();
  } catch (e) {}

  const studentId = student?.id || 'demo-student-1';
  const studentName = student?.name || 'أحمد محمد علي';

  let assignments: any[] = [];
  try {
    assignments = await prisma.assignment.findMany({
      include: {
        classroom: true,
        submissions: {
          where: { studentId },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  } catch (err) {
    console.warn('[Student Assignments] DB query skipped:', err);
  }

  if (!assignments || assignments.length === 0) {
    assignments = [
      {
        id: 'sample-a1',
        title: 'حل تمارين معادلات الدرجة الأولى',
        description: 'حل المسائل من صفحة 15 إلى 18 في كتاب التمارين ورفع الحل.',
        dueDate: new Date(Date.now() + 86400000 * 3),
        maxScore: 10,
        classroom: { name: 'الصف الثالث الإعدادي - رياضيات' },
        submissions: [],
      },
    ];
  }

  const serialized = (assignments || []).map((a) => ({
    id: a.id || 'assign-1',
    title: a.title || 'الواجب المنزلي',
    description: a.description || '',
    dueDate: a.dueDate ? new Date(a.dueDate).toISOString() : new Date().toISOString(),
    maxScore: a.maxScore ?? 10,
    classroomName: a.classroom?.name || 'فصل الرياضيات',
    submission: a.submissions && a.submissions[0]
      ? {
          id: a.submissions[0].id,
          grade: a.submissions[0].grade ?? null,
          status: a.submissions[0].status || 'SUBMITTED',
          teacherNote: a.submissions[0].teacherNote || '',
          submittedAt: a.submissions[0].submittedAt ? new Date(a.submissions[0].submittedAt).toISOString() : new Date().toISOString(),
        }
      : null,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-n-800 dark:text-n-700">الواجبات والتسليمات</h1>
        <p className="text-xs text-n-500 dark:text-n-400 mt-1">
          مرحباً {studentName} — قائمة بالواجبات المطلوبة ومتابعة درجات وملاحظات المعلم
        </p>
      </div>

      <StudentAssignmentsClient initialAssignments={serialized} />
    </div>
  );
}
