/**
 * Unified Academic Analytics & Scoring Engine
 * Single source of truth for student quiz grades, percentages, and summaries.
 */

export interface AcademicSummaryItem {
  id?: string;
  quizId: string;
  quizTitle?: string;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  submittedAt?: string | Date;
  type?: string;
}

export interface AcademicSummary {
  totalExams: number;
  averagePercentage: number;
  passedExams: number;
  passRate: number;
  submissionsList: AcademicSummaryItem[];
}

/**
 * Calculates accurate academic performance metrics for a given student ID.
 */
export function getStudentAcademicSummary(
  studentId: string,
  submissions: any[] = [],
  quizzes: any[] = []
): AcademicSummary {
  if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
    return {
      totalExams: 0,
      averagePercentage: 0,
      passedExams: 0,
      passRate: 0,
      submissionsList: [],
    };
  }

  const studentSubs = submissions.filter((s) => {
    if (!s) return false;
    if (!studentId) return true;
    const sId = s.studentId || s.studentCode || '';
    return (
      sId === studentId ||
      (studentId === 'STU-001' &&
        (sId === 'demo-student-1' || sId === 'STU-001' || sId === 'student-1')) ||
      (studentId === 'STU-777' &&
        (sId === 'demo-student-2' || sId === 'STU-777' || sId === 'student-2')) ||
      (studentId === 'demo-student-1' &&
        (sId === 'STU-001' || sId === 'student-1' || sId === 'demo-student-1'))
    );
  });

  if (studentSubs.length === 0) {
    return {
      totalExams: 0,
      averagePercentage: 0,
      passedExams: 0,
      passRate: 0,
      submissionsList: [],
    };
  }

  const detailedList: AcademicSummaryItem[] = studentSubs.map((sub, idx) => {
    const rawScore = sub.totalScore ?? sub.autoScore ?? sub.score ?? 0;
    const maxScore =
      Number(sub.maxScore) && Number(sub.maxScore) > 0 ? Number(sub.maxScore) : 100;
    const percentage =
      sub.percentage !== undefined
        ? Number(sub.percentage)
        : Math.round((rawScore / maxScore) * 100);

    const quizMatch = quizzes.find(
      (q) => q.id === sub.quizId || q.accessCode === sub.quizId
    );
    const quizTitle =
      sub.quizTitle || sub.quiz?.title || quizMatch?.title || `اختبار ${idx + 1}`;
    const quizType = sub.quiz?.type || quizMatch?.type || 'WEEKLY';
    const passingScore = sub.passingScore || quizMatch?.passingScore || 60;
    const isPassed =
      sub.isPassed !== undefined
        ? Boolean(sub.isPassed)
        : percentage >= passingScore;

    return {
      id: sub.id || `sub-${sub.quizId || idx}`,
      quizId: sub.quizId || `quiz-${idx}`,
      quizTitle,
      score: rawScore,
      maxScore,
      percentage,
      isPassed,
      submittedAt: sub.submittedAt || new Date().toISOString(),
      type: quizType,
    };
  });

  const totalPercentage = detailedList.reduce((acc, curr) => acc + curr.percentage, 0);
  const averagePercentage = Math.round(totalPercentage / detailedList.length);
  const passedCount = detailedList.filter((s) => s.isPassed).length;
  const passRate = Math.round((passedCount / detailedList.length) * 100);

  return {
    totalExams: detailedList.length,
    averagePercentage,
    passedExams: passedCount,
    passRate,
    submissionsList: detailedList,
  };
}
