import { calcStudentAvg } from './utils';

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

  const cleanTarget = (studentId || '').trim().toUpperCase();
  const studentSubs = submissions.filter((s) => {
    if (!s) return false;
    if (!cleanTarget) return true;
    if (!s.studentId && !s.studentCode) return true;
    const sId = String(s.studentId || '').trim().toUpperCase();
    const sCode = String(s.studentCode || '').trim().toUpperCase();
    return sId === cleanTarget || sCode === cleanTarget;
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

  const averagePercentage = calcStudentAvg(detailedList) ?? 0;
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

export interface LatestSubmissionResult {
  id?: string;
  quizId?: string;
  quizTitle?: string;
  score: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  submittedAt: string | Date;
}

/**
 * Returns the student's most recent completed quiz submission.
 */
export function getLatestStudentSubmission(
  studentId: string,
  submissions: any[] = []
): LatestSubmissionResult | null {
  if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
    return null;
  }

  const studentSubs = submissions.filter((s) => {
    if (!s) return false;
    if (!studentId) return true;
    const sId = s.studentId || s.studentCode || '';
    return (
      sId === studentId ||
      s.studentCode === studentId ||
      s.id === studentId
    );
  });

  if (studentSubs.length === 0) return null;

  const sorted = [...studentSubs].sort((a, b) => {
    const timeA = new Date(a.submittedAt || 0).getTime();
    const timeB = new Date(b.submittedAt || 0).getTime();
    return timeB - timeA;
  });

  const latest = sorted[0];
  const score = latest.totalScore ?? latest.autoScore ?? latest.score ?? 0;
  const maxScore = Number(latest.maxScore) && Number(latest.maxScore) > 0 ? Number(latest.maxScore) : 100;
  const percentage =
    latest.percentage !== undefined
      ? Number(latest.percentage)
      : Math.round((score / maxScore) * 100);

  return {
    id: latest.id,
    quizId: latest.quizId,
    quizTitle: latest.quizTitle || latest.quiz?.title || 'الاختبار الأكاديمي',
    score,
    maxScore,
    percentage,
    isPassed: latest.isPassed !== undefined ? Boolean(latest.isPassed) : percentage >= 50,
    submittedAt: latest.submittedAt || new Date().toISOString(),
  };
}
