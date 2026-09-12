'use client';

import { useState, useEffect } from 'react';
import { generateRandomPin } from '@/lib/utils';

export interface QuestionData {
  id: string;
  text: string;
  type: 'MCQ' | 'ESSAY';
  options: string[] | string;
  correctAnswer?: string | null;
  maxScore?: number;
  order?: number;
}

export interface QuizData {
  id: string;
  title: string;
  type: string;
  duration: number;
  passingScore: number;
  accessCode: string;
  isCodeRequired: boolean;
  isPublished: boolean;
  isHidden?: boolean;
  classroomName?: string;
  classroomId?: string;
  questionsCount?: number;
  resultsCount?: number;
  questions?: QuestionData[];
  shuffleQuestions?: boolean;
  maxViolations?: number;
  totalScore?: number;
  createdAt?: string;
}

export interface QuizSubmissionData {
  id?: string;
  quizId: string;
  studentId?: string;
  studentCode?: string;
  score?: number;
  autoScore?: number;
  totalScore?: number;
  maxScore?: number;
  percentage?: number;
  isPassed?: boolean;
  answers?: Record<string, any>;
  submittedAt?: string | number;
  status?: string;
}

export interface QuizRetakeCode {
  id: string;
  code: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  isUsed: boolean;
  reason?: string;
  createdAt: string;
  usedAt?: string | null;
}

export const STORAGE_KEYS = {
  QUIZZES: 'edu_quizzes',
  DELETED_QUIZZES: 'edu_deleted_quiz_ids',
  RESULTS: 'edu_quiz_results',
  RETAKE_CODES: 'edu_quiz_retake_codes',
  STUDENTS: 'edu_students',
  ASSIGNMENTS: 'edu_assignments',
  CLASSROOMS: 'edu_classrooms',
  DELETED_CLASSROOMS: 'edu_deleted_classrooms',
} as const;

// Default Seed Quizzes
export const INITIAL_SEED_QUIZZES: QuizData[] = [
  {
    id: 'sample-q1',
    title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
    type: 'WEEKLY',
    duration: 20,
    passingScore: 60,
    accessCode: 'QUIZ-MATH-2026',
    isCodeRequired: true,
    isPublished: true,
    isHidden: false,
    classroomName: 'فصل الرياضيات (3ع - أ)',
    classroomId: 'cls-math-1',
    questionsCount: 2,
    resultsCount: 0,
    questions: [
      {
        id: 'q-sample-1',
        text: 'إذا كان س + 3 = 7، فإن قيمة 2س تساوي:',
        type: 'MCQ',
        options: ['6', '8', '10', '12'],
        correctAnswer: '8',
        maxScore: 5,
        order: 1,
      },
      {
        id: 'q-sample-2',
        text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:',
        type: 'MCQ',
        options: ['{3}', '{-3}', '{3, -3}', '∅'],
        correctAnswer: '{3, -3}',
        maxScore: 5,
        order: 2,
      },
    ],
    totalScore: 10,
    createdAt: new Date().toISOString(),
  },
];

const EVENT_STORE_UPDATED = 'edu_store_updated';

function notifyStoreUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_STORE_UPDATED));
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * 1. Retrieves all active quizzes from localStorage
 */
export function getQuizzes(): QuizData[] {
  if (typeof window === 'undefined') return INITIAL_SEED_QUIZZES;

  try {
    const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

    const deletedClassroomsRaw = localStorage.getItem(STORAGE_KEYS.DELETED_CLASSROOMS);
    const deletedClassrooms = new Set<string>(deletedClassroomsRaw ? JSON.parse(deletedClassroomsRaw) : []);

    const storedRaw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
    let list: QuizData[] = [];

    if (storedRaw) {
      const parsed = JSON.parse(storedRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }

    if (list.length === 0) {
      list = INITIAL_SEED_QUIZZES.filter((q) => !deletedSet.has(q.id));
      localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(list));
    }

    // Filter out any tombstoned / deleted IDs and quizzes belonging to deleted classrooms
    return list.filter((q) => {
      if (deletedSet.has(q.id) || (q.accessCode && deletedSet.has(q.accessCode))) return false;
      if (q.classroomId && deletedClassrooms.has(q.classroomId)) return false;
      if (q.classroomName && deletedClassrooms.has(q.classroomName)) return false;
      return true;
    });
  } catch (err) {
    console.warn('[getQuizzes] LocalStorage error:', err);
    return INITIAL_SEED_QUIZZES;
  }
}

/**
 * 2. Retrieves quizzes for students:
 * - If published and classroom active: available for all students to take.
 * - If hidden (isPublished === false or isHidden): ONLY visible to students who ALREADY completed it (so their grade and record are preserved).
 * - If deleted: NEVER returned under any circumstances.
 */
export function getStudentQuizzes(studentId?: string): QuizData[] {
  if (typeof window === 'undefined') return [];

  try {
    // Get inactive / disabled classrooms
    const classroomsRaw = localStorage.getItem(STORAGE_KEYS.CLASSROOMS);
    const classroomsList: any[] = classroomsRaw ? JSON.parse(classroomsRaw) : [];
    const inactiveClassroomIds = new Set<string>(
      classroomsList.filter((c: any) => c.isActive === false).map((c: any) => c.id)
    );
    const inactiveClassroomNames = new Set<string>(
      classroomsList.filter((c: any) => c.isActive === false).map((c: any) => c.name)
    );

    // Resolve student's completed submissions
    let targetStudentId = studentId;
    if (!targetStudentId) {
      try {
        const cur = localStorage.getItem('current_student');
        if (cur) {
          const parsed = JSON.parse(cur);
          targetStudentId = parsed.studentCode || parsed.id || '';
        }
      } catch {}
    }

    const submissions = getSubmissions(targetStudentId);
    const completedQuizIds = new Set(
      submissions
        .filter(
          (s: any) =>
            s &&
            s.quizId &&
            (s.status === 'AUTO_GRADED' ||
              s.status === 'GRADED' ||
              s.status === 'PENDING' ||
              s.isPassed !== undefined ||
              s.score !== undefined ||
              s.totalScore !== undefined)
        )
        .map((s: any) => s.quizId)
    );

    return getQuizzes().filter((q) => {
      const hasCompleted =
        completedQuizIds.has(q.id) || (q.accessCode && completedQuizIds.has(q.accessCode));

      // If the student already completed it, keep it visible so they see their score and completion status
      if (!hasCompleted) {
        if (!q.isPublished || q.isHidden) return false;
        if (q.classroomId && inactiveClassroomIds.has(q.classroomId)) return false;
        if (q.classroomName && inactiveClassroomNames.has(q.classroomName)) return false;
      }

      return true;
    });
  } catch {
    return getQuizzes().filter((q) => q.isPublished === true && !q.isHidden);
  }
}

/**
 * 3. Finds a single quiz by ID or accessCode
 */
export function getQuizById(idOrCode: string): QuizData | null {
  if (!idOrCode) return null;
  const clean = idOrCode.trim().toUpperCase();
  const all = getQuizzes();
  return (
    all.find(
      (q) =>
        q.id === idOrCode ||
        (q.accessCode && q.accessCode.trim().toUpperCase() === clean)
    ) || null
  );
}

/**
 * 4. Appends or updates a quiz in localStorage
 */
export function saveQuiz(quiz: Partial<QuizData> & { id: string; title: string }): QuizData {
  if (typeof window === 'undefined') return quiz as QuizData;

  const current = getQuizzes();
  const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
  const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
  deletedSet.delete(quiz.id);
  if (quiz.accessCode) deletedSet.delete(quiz.accessCode);
  localStorage.setItem(STORAGE_KEYS.DELETED_QUIZZES, JSON.stringify(Array.from(deletedSet)));

  const existingIndex = current.findIndex((q) => q.id === quiz.id);

  const fullQuiz: QuizData = {
    id: quiz.id,
    title: quiz.title,
    type: quiz.type || 'WEEKLY',
    duration: Number(quiz.duration) || 20,
    passingScore: Number(quiz.passingScore) || 60,
    accessCode: quiz.accessCode || 'QUIZ-MATH-2026',
    isCodeRequired: quiz.isCodeRequired !== false,
    isPublished: quiz.isPublished !== false,
    isHidden: Boolean(quiz.isHidden),
    classroomName: quiz.classroomName || 'فصل الرياضيات',
    classroomId: quiz.classroomId || 'cls-1',
    questionsCount: quiz.questions?.length ?? quiz.questionsCount ?? 0,
    resultsCount: quiz.resultsCount ?? 0,
    questions: quiz.questions || [],
    shuffleQuestions: quiz.shuffleQuestions ?? false,
    maxViolations: quiz.maxViolations ?? 3,
    totalScore: (quiz as any).totalScore || quiz.questions?.reduce((acc: number, cur: any) => acc + (Number(cur.maxScore) || 5), 0) || 10,
    createdAt: quiz.createdAt || new Date().toISOString(),
  };

  let updatedList: QuizData[];
  if (existingIndex !== -1) {
    updatedList = [...current];
    updatedList[existingIndex] = { ...updatedList[existingIndex], ...fullQuiz };
  } else {
    updatedList = [fullQuiz, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updatedList));
    notifyStoreUpdated();
  } catch (err) {
    console.warn('[saveQuiz] LocalStorage write error:', err);
  }

  return fullQuiz;
}

/**
 * 5. Toggles quiz visibility between Published and Hidden
 */
export function toggleQuizVisibility(quizId: string, isPublished?: boolean): boolean {
  if (typeof window === 'undefined') return false;

  const current = getQuizzes();
  const quiz = current.find((q) => q.id === quizId || q.accessCode === quizId);
  if (!quiz) return false;

  const nextState = isPublished !== undefined ? isPublished : !quiz.isPublished;
  quiz.isPublished = nextState;
  quiz.isHidden = !nextState;

  try {
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(current));
    notifyStoreUpdated();
  } catch (err) {
    console.warn('[toggleQuizVisibility] LocalStorage write error:', err);
  }

  return nextState;
}

/**
 * 6. Deletes a quiz and wipes out all its questions, results, submissions, and retake records.
 * Leaves zero trace of the quiz for any student across the platform.
 */
export function deleteQuiz(quizId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const current = getQuizzes();
    const targetQuiz = current.find((q) => q.id === quizId || q.accessCode === quizId);
    const targetAccessCode = targetQuiz?.accessCode;

    const updated = current.filter((q) => q.id !== quizId && q.accessCode !== quizId);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updated));

    // Record in deleted set
    const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
    deletedSet.add(quizId);
    if (targetAccessCode) deletedSet.add(targetAccessCode);
    localStorage.setItem(STORAGE_KEYS.DELETED_QUIZZES, JSON.stringify(Array.from(deletedSet)));

    // Purge student results and submissions for this quiz completely
    const resultsRaw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (resultsRaw) {
      const resultsParsed = JSON.parse(resultsRaw);
      if (Array.isArray(resultsParsed)) {
        const cleanedResults = resultsParsed.filter(
          (r: any) =>
            r.quizId !== quizId &&
            r.quizId !== targetAccessCode &&
            r.id !== quizId &&
            r.id !== targetAccessCode
        );
        localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(cleanedResults));
      }
    }

    // Purge retake codes for this quiz
    const retakeRaw = localStorage.getItem(STORAGE_KEYS.RETAKE_CODES);
    if (retakeRaw) {
      const retakeParsed = JSON.parse(retakeRaw);
      if (Array.isArray(retakeParsed)) {
        const cleanedRetake = retakeParsed.filter(
          (rc: any) => rc.quizId !== quizId && rc.quizId !== targetAccessCode
        );
        localStorage.setItem(STORAGE_KEYS.RETAKE_CODES, JSON.stringify(cleanedRetake));
      }
    }

    // Also purge edu_submissions if present
    const subsRaw = localStorage.getItem('edu_submissions');
    if (subsRaw) {
      const subsParsed = JSON.parse(subsRaw);
      if (Array.isArray(subsParsed)) {
        const cleanedSubs = subsParsed.filter(
          (s: any) => s.quizId !== quizId && s.quizId !== targetAccessCode
        );
        localStorage.setItem('edu_submissions', JSON.stringify(cleanedSubs));
      }
    }

    notifyStoreUpdated();
    return true;
  } catch (err) {
    console.warn('[deleteQuiz] LocalStorage delete error:', err);
    return false;
  }
}

/**
 * 7. Submissions & Results Store Functions
 * Excludes any results that belong to deleted quizzes.
 */
export function getSubmissions(studentId?: string): QuizSubmissionData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (!raw) return [];
    const parsed: QuizSubmissionData[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out results belonging to deleted quizzes
    const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

    const activeList = parsed.filter(
      (s) => s && s.quizId && !deletedSet.has(s.quizId) && (!s.id || !deletedSet.has(s.id))
    );

    if (!studentId) return activeList;

    const cleanTarget = studentId.trim().toUpperCase();
    return activeList.filter((s) => {
      if (!s) return false;
      const sId = (s.studentId || (s as any).studentCode || '').trim().toUpperCase();
      const sCode = ((s as any).studentCode || s.studentId || '').trim().toUpperCase();

      return sId === cleanTarget || sCode === cleanTarget;
    });
  } catch {
    return [];
  }
}

export function saveSubmission(submission: QuizSubmissionData): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    const current: any[] = raw ? JSON.parse(raw) : [];
    const targetQuizId = submission.quizId;
    const targetStudentId = submission.studentId;

    const filtered = current.filter(
      (s: any) =>
        !(
          (s.quizId === targetQuizId || s.id === targetQuizId || (s as any).accessCode === targetQuizId) &&
          (s.studentId === targetStudentId || (s as any).studentCode === targetStudentId)
        )
    );

    const score = submission.score ?? submission.totalScore ?? submission.autoScore ?? 0;
    const maxScore = submission.maxScore && submission.maxScore > 0 ? submission.maxScore : 100;
    const percentage =
      submission.percentage !== undefined
        ? Number(submission.percentage)
        : Math.round((score / maxScore) * 100);

    const fullSubmission = {
      ...submission,
      score,
      totalScore: score,
      autoScore: score,
      maxScore,
      percentage,
      studentId: targetStudentId,
      studentCode: (submission as any).studentCode || targetStudentId,
      submittedAt: submission.submittedAt || new Date().toISOString(),
    };

    filtered.unshift(fullSubmission);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(filtered));
    notifyStoreUpdated();
  } catch (err) {
    console.warn('[saveSubmission] LocalStorage write error:', err);
  }
}

/**
 * 7.1 Delete submission when a retake is granted/started
 */
export function deleteSubmission(quizId: string, studentId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (!raw) return;
    const current: any[] = JSON.parse(raw);
    const targetQuizId = (quizId || '').trim();
    const targetStudentId = (studentId || '').trim().toUpperCase();

    const filtered = current.filter((s: any) => {
      const qMatch = s.quizId === targetQuizId || s.id === targetQuizId || s.accessCode === targetQuizId;
      const sMatch =
        (s.studentId && s.studentId.trim().toUpperCase() === targetStudentId) ||
        (s.studentCode && s.studentCode.trim().toUpperCase() === targetStudentId);
      return !(qMatch && sMatch);
    });

    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(filtered));
    notifyStoreUpdated();
  } catch (err) {
    console.warn('[deleteSubmission] error:', err);
  }
}

/**
 * 7.2 Retake Codes Management Functions
 */
export function getRetakeCodes(quizId?: string, studentId?: string): QuizRetakeCode[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RETAKE_CODES);
    if (!raw) return [];
    const list: QuizRetakeCode[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    return list.filter((r) => {
      if (!r || !r.code) return false;
      if (quizId && r.quizId !== quizId) return false;
      if (studentId) {
        const sTarget = studentId.trim().toUpperCase();
        const sId = (r.studentId || '').trim().toUpperCase();
        const sCode = (r.studentCode || '').trim().toUpperCase();
        if (sId !== sTarget && sCode !== sTarget) return false;
      }
      return true;
    });
  } catch {
    return [];
  }
}

export function saveRetakeCode(retakeCode: QuizRetakeCode): QuizRetakeCode {
  if (typeof window === 'undefined') return retakeCode;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RETAKE_CODES);
    const current: QuizRetakeCode[] = raw ? JSON.parse(raw) : [];

    const existingIndex = current.findIndex((r) => r.id === retakeCode.id || r.code === retakeCode.code);
    let updated: QuizRetakeCode[];
    if (existingIndex !== -1) {
      updated = [...current];
      updated[existingIndex] = { ...updated[existingIndex], ...retakeCode };
    } else {
      updated = [retakeCode, ...current];
    }

    localStorage.setItem(STORAGE_KEYS.RETAKE_CODES, JSON.stringify(updated));
    notifyStoreUpdated();
    return retakeCode;
  } catch (err) {
    console.warn('[saveRetakeCode] error:', err);
    return retakeCode;
  }
}

export function generateRetakeCode(
  quizId: string,
  studentId: string,
  studentName?: string,
  studentCode?: string,
  quizTitle?: string,
  reason: string = 'إعادة استثنائية مصرح بها من المعلم'
): QuizRetakeCode {
  const currentCodes = getRetakeCodes();
  const existingCodeStrings = new Set(currentCodes.map((c) => c.code.toUpperCase()));

  // Generate clean, memorable, unique retake code
  let generatedCode = '';
  let attempts = 0;
  const cleanStudentNum = (studentCode || studentId || '').replace(/\D/g, '') || Math.floor(100 + Math.random() * 900);
  
  do {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    generatedCode = `RETAKE-${cleanStudentNum}-${randomSuffix}`;
    attempts++;
  } while (existingCodeStrings.has(generatedCode) && attempts < 100);

  const newRetake: QuizRetakeCode = {
    id: `retake-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    code: generatedCode,
    quizId: quizId,
    quizTitle: quizTitle || 'الاختبار الأكاديمي',
    studentId: studentId,
    studentName: studentName || 'طالب',
    studentCode: studentCode || studentId,
    isUsed: false,
    reason,
    createdAt: new Date().toISOString(),
    usedAt: null,
  };

  saveRetakeCode(newRetake);
  return newRetake;
}

export function deleteRetakeCode(codeOrId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const cleanTarget = (codeOrId || '').trim().toUpperCase();
    const current = getRetakeCodes();
    const filtered = current.filter((r) => r.id !== codeOrId && r.code.toUpperCase() !== cleanTarget);
    localStorage.setItem(STORAGE_KEYS.RETAKE_CODES, JSON.stringify(filtered));
    notifyStoreUpdated();
    return true;
  } catch {
    return false;
  }
}

/**
 * 7.3 Consumes a retake code: marks it used, resets student submission & violations
 */
export function consumeRetakeCode(
  code: string,
  quizId?: string,
  studentId?: string
): { success: boolean; retake?: QuizRetakeCode; message?: string } {
  if (typeof window === 'undefined') return { success: false, message: 'بيئة المتصفح غير جاهزة' };
  try {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return { success: false, message: 'يرجى إدخال كود إعادة الامتحان' };

    const all = getRetakeCodes();
    const matched = all.find((r) => {
      if (r.code.toUpperCase() !== clean) return false;
      if (quizId && r.quizId !== quizId) return false;
      if (studentId) {
        const sTarget = studentId.trim().toUpperCase();
        const sId = (r.studentId || '').trim().toUpperCase();
        const sCode = (r.studentCode || '').trim().toUpperCase();
        if (sId !== sTarget && sCode !== sTarget) return false;
      }
      return true;
    });

    if (!matched) {
      // If code starts with RETAKE- or RETRY- and exists generally
      const anyMatch = all.find((r) => r.code.toUpperCase() === clean);
      if (anyMatch) {
        if (anyMatch.isUsed) {
          return { success: false, message: 'تم استخدام كود الإعادة هذا مسبقاً! يرجى طلب كود جديد من المعلم.' };
        }
        return { success: false, message: 'هذا الكود مخصص لامتحان أو طالب آخر.' };
      }
      return { success: false, message: 'كود الإعادة غير صحيح أو غير مسجل بالنظام' };
    }

    if (matched.isUsed) {
      return { success: false, message: 'تم استخدام كود الإعادة هذا مسبقاً! يرجى طلب كود جديد من المعلم.' };
    }

    // 1. Mark as used
    matched.isUsed = true;
    matched.usedAt = new Date().toISOString();
    saveRetakeCode(matched);

    const targetQuizId = matched.quizId || quizId || '';
    const targetStudentId = matched.studentId || studentId || '';
    const targetStudentCode = matched.studentCode || targetStudentId;

    // 2. Delete old submission so student starts completely fresh
    deleteSubmission(targetQuizId, targetStudentId);
    if (targetStudentCode && targetStudentCode !== targetStudentId) {
      deleteSubmission(targetQuizId, targetStudentCode);
    }

    // 3. Clear anti-cheat violations tracking
    try {
      localStorage.removeItem(`edu_quiz_violations_${targetQuizId}_${targetStudentCode}`);
      localStorage.removeItem(`edu_quiz_violations_${targetQuizId}_${targetStudentId}`);
      localStorage.removeItem(`quiz_answers_${targetQuizId}_${targetStudentId}`);
      localStorage.removeItem(`quiz_answers_${targetQuizId}_${targetStudentCode}`);
      sessionStorage.setItem(`unlocked_quiz_${targetQuizId}`, 'true');
      document.cookie = `unlocked_quiz_${targetQuizId}=true; path=/; max-age=86400; SameSite=Lax`;
    } catch (e) {}

    notifyStoreUpdated();
    return {
      success: true,
      retake: matched,
      message: 'تم تفعيل كود إعادة الامتحان بنجاح! تم تجهيز محاولة جديدة بترتيب عشوائي بالكامل.',
    };
  } catch (err: any) {
    console.error('[consumeRetakeCode] error:', err);
    return { success: false, message: err?.message || 'حدث خطأ أثناء معالجة كود الإعادة' };
  }
}

/**
 * 7.4 Reset student attempt directly by Teacher (Instant Retake Re-open)
 */
export function resetStudentQuizAttempt(
  quizId: string,
  studentId: string,
  studentCode?: string
): { success: boolean; message?: string } {
  if (typeof window === 'undefined') return { success: false, message: 'بيئة المتصفح غير جاهزة' };
  try {
    const targetQuizId = (quizId || '').trim();
    const targetStudentId = (studentId || '').trim();
    const targetStudentCode = (studentCode || targetStudentId).trim();

    // 1. Delete submission from local store
    deleteSubmission(targetQuizId, targetStudentId);
    if (targetStudentCode && targetStudentCode !== targetStudentId) {
      deleteSubmission(targetQuizId, targetStudentCode);
    }

    // 2. Clear anti-cheat violations and autosaved answers
    try {
      localStorage.removeItem(`edu_quiz_violations_${targetQuizId}_${targetStudentCode}`);
      localStorage.removeItem(`edu_quiz_violations_${targetQuizId}_${targetStudentId}`);
      localStorage.removeItem(`quiz_answers_${targetQuizId}_${targetStudentId}`);
      localStorage.removeItem(`quiz_answers_${targetQuizId}_${targetStudentCode}`);
      sessionStorage.setItem(`unlocked_quiz_${targetQuizId}`, 'true');
      document.cookie = `unlocked_quiz_${targetQuizId}=true; path=/; max-age=86400; SameSite=Lax`;
    } catch (e) {}

    // 3. Mark any pending retake code as used or delete it
    try {
      const allCodes = getRetakeCodes();
      const filtered = allCodes.filter((r) => {
        const qMatch = r.quizId === targetQuizId;
        const sMatch =
          r.studentId.toUpperCase() === targetStudentId.toUpperCase() ||
          (r.studentCode && r.studentCode.toUpperCase() === targetStudentCode.toUpperCase());
        return !(qMatch && sMatch);
      });
      localStorage.setItem(STORAGE_KEYS.RETAKE_CODES, JSON.stringify(filtered));
    } catch (e) {}

    // 4. Update teacher quiz resultsCount if possible
    try {
      const currentQuizzes: any[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZZES) || '[]');
      if (Array.isArray(currentQuizzes)) {
        const updated = currentQuizzes.map((q) => {
          if (q.id === targetQuizId) {
            return { ...q, resultsCount: Math.max(0, (q.resultsCount || 1) - 1) };
          }
          return q;
        });
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updated));
      }
    } catch (e) {}

    notifyStoreUpdated();
    try {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('edu_store_updated'));
    } catch (e) {}

    return {
      success: true,
      message: 'تم إعادة فتح الامتحان للطالب بنجاح! يمكنه الآن خوض الامتحان مجدداً.',
    };
  } catch (err: any) {
    console.error('[resetStudentQuizAttempt] error:', err);
    return { success: false, message: err?.message || 'حدث خطأ أثناء إعادة فتح الاختبار' };
  }
}

export function usePlatformQuizzes(filterForStudent: boolean = false) {
  const [quizzes, setQuizzes] = useState<QuizData[]>(() =>
    filterForStudent ? getStudentQuizzes() : getQuizzes()
  );

  useEffect(() => {
    function handleUpdate() {
      setQuizzes(filterForStudent ? getStudentQuizzes() : getQuizzes());
    }

    // Initial sync
    handleUpdate();

    window.addEventListener(EVENT_STORE_UPDATED, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_STORE_UPDATED, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [filterForStudent]);

  return {
    quizzes,
    refresh: () => setQuizzes(filterForStudent ? getStudentQuizzes() : getQuizzes()),
    saveQuiz,
    deleteQuiz,
    toggleQuizVisibility,
  };
}

/**
 * 9. Assignment Store Types & Functions
 */
export interface AssignmentSubmissionItem {
  id: string;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
  answerText?: string | null;
  fileUrl?: string | null;
  grade?: number | null;
  teacherNote?: string | null;
  status?: string;
  submittedAt?: string;
}

export interface AssignmentData {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  maxScore?: number;
  isClosed?: boolean;
  classroomName?: string;
  classroomId?: string;
  fileUrl?: string | null;
  submissions?: AssignmentSubmissionItem[];
}

export const DELETED_ASSIGNMENTS_KEY = 'edu_deleted_assignment_ids';

export function getAssignments(): AssignmentData[] {
  if (typeof window === 'undefined') return [];

  try {
    const deletedRaw = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

    const deletedClassroomsRaw = localStorage.getItem(STORAGE_KEYS.DELETED_CLASSROOMS);
    const deletedClassrooms = new Set<string>(deletedClassroomsRaw ? JSON.parse(deletedClassroomsRaw) : []);

    const storedRaw = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (!storedRaw) return [];

    const parsed: AssignmentData[] = JSON.parse(storedRaw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((a) => {
      if (deletedSet.has(a.id)) return false;
      if (a.classroomId && deletedClassrooms.has(a.classroomId)) return false;
      if (a.classroomName && deletedClassrooms.has(a.classroomName)) return false;
      return true;
    });
  } catch (err) {
    console.warn('[getAssignments] LocalStorage read error:', err);
    return [];
  }
}

export function getStudentAssignments(): AssignmentData[] {
  if (typeof window === 'undefined') return [];

  try {
    const classroomsRaw = localStorage.getItem(STORAGE_KEYS.CLASSROOMS);
    const classroomsList: any[] = classroomsRaw ? JSON.parse(classroomsRaw) : [];
    const inactiveClassroomIds = new Set<string>(
      classroomsList.filter((c: any) => c.isActive === false).map((c: any) => c.id)
    );
    const inactiveClassroomNames = new Set<string>(
      classroomsList.filter((c: any) => c.isActive === false).map((c: any) => c.name)
    );

    return getAssignments().filter((a) => {
      if (a.isClosed) return false;
      if (a.classroomId && inactiveClassroomIds.has(a.classroomId)) return false;
      if (a.classroomName && inactiveClassroomNames.has(a.classroomName)) return false;
      return true;
    });
  } catch {
    return getAssignments();
  }
}

export function saveAssignment(assignment: Partial<AssignmentData> & { id: string; title: string }): AssignmentData {
  if (typeof window === 'undefined') return assignment as AssignmentData;

  const current = getAssignments();
  const deletedRaw = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
  const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
  deletedSet.delete(assignment.id);
  localStorage.setItem(DELETED_ASSIGNMENTS_KEY, JSON.stringify(Array.from(deletedSet)));

  const existingIndex = current.findIndex((a) => a.id === assignment.id);

  const fullAssignment: AssignmentData = {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description || '',
    dueDate: assignment.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
    maxScore: Number(assignment.maxScore) || 10,
    isClosed: Boolean(assignment.isClosed),
    classroomName: assignment.classroomName || 'فصل الرياضيات',
    classroomId: assignment.classroomId || 'class-1',
    fileUrl: assignment.fileUrl || null,
    submissions: assignment.submissions || [],
  };

  let updatedList: AssignmentData[];
  if (existingIndex !== -1) {
    updatedList = [...current];
    updatedList[existingIndex] = { ...updatedList[existingIndex], ...fullAssignment };
  } else {
    updatedList = [fullAssignment, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updatedList));
    notifyStoreUpdated();
  } catch (err) {
    console.warn('[saveAssignment] LocalStorage write error:', err);
  }

  return fullAssignment;
}

export function deleteAssignment(assignmentId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const current = getAssignments();
    const updated = current.filter((a) => a.id !== assignmentId);
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updated));

    const deletedRaw = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
    deletedSet.add(assignmentId);
    localStorage.setItem(DELETED_ASSIGNMENTS_KEY, JSON.stringify(Array.from(deletedSet)));

    notifyStoreUpdated();
    return true;
  } catch (err) {
    console.warn('[deleteAssignment] LocalStorage delete error:', err);
    return false;
  }
}

export function toggleAssignmentLock(assignmentId: string, isClosed: boolean): boolean {
  if (typeof window === 'undefined') return false;

  const current = getAssignments();
  const found = current.find((a) => a.id === assignmentId);
  if (!found) return false;

  found.isClosed = isClosed;

  try {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(current));
    notifyStoreUpdated();
  } catch (err) {
    console.warn('[toggleAssignmentLock] LocalStorage write error:', err);
  }

  return isClosed;
}

export const DEFAULT_INITIAL_STUDENTS = [
  {
    id: 'STU-633',
    name: 'أحمد محمود أحمد',
    studentCode: 'STU-633',
    code: 'STU-633',
    phone: '01012345678',
    parentPhone: '01012345678',
    parentWhatsapp: '01012345678',
    grade: 'الصف الثالث الإعدادي',
    gradeLevel: 'الصف الثالث الإعدادي',
    classroomId: 'class-math-3',
    avgScore: null,
    submissionsCount: 0,
    attendanceCount: 0,
    lastActive: new Date().toISOString(),
    isActive: true,
    defaultPassword: '9715',
    password: '9715',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'STU-001',
    name: 'أحمد محمد علي',
    studentCode: 'STU-001',
    code: 'STU-001',
    phone: '01099998888',
    parentPhone: '01012345678',
    parentWhatsapp: '01012345678',
    grade: 'الصف الثالث الإعدادي',
    gradeLevel: 'الصف الثالث الإعدادي',
    classroomId: 'class-math-3',
    avgScore: null,
    submissionsCount: 0,
    attendanceCount: 0,
    lastActive: new Date().toISOString(),
    isActive: true,
    defaultPassword: '4829',
    password: '4829',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'STU-645',
    name: 'علي حسين',
    studentCode: 'STU-645',
    code: 'STU-645',
    phone: '01066667777',
    parentPhone: '01066667777',
    parentWhatsapp: '01066667777',
    grade: 'الصف الثالث الإعدادي',
    gradeLevel: 'الصف الثالث الإعدادي',
    classroomId: 'class-math-3',
    avgScore: null,
    submissionsCount: 0,
    attendanceCount: 0,
    lastActive: new Date().toISOString(),
    isActive: true,
    defaultPassword: '5192',
    password: '5192',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'STU-777',
    name: 'زياد طارق إبراهيم',
    studentCode: 'STU-777',
    code: 'STU-777',
    phone: '01055554444',
    parentPhone: '01099998888',
    parentWhatsapp: '01099998888',
    grade: 'الصف الثالث الإعدادي',
    gradeLevel: 'الصف الثالث الإعدادي',
    classroomId: 'class-math-3',
    avgScore: null,
    submissionsCount: 0,
    attendanceCount: 0,
    lastActive: new Date().toISOString(),
    isActive: true,
    defaultPassword: '6341',
    password: '6341',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'STU-003',
    name: 'أحمد محمود',
    studentCode: 'STU-003',
    code: 'STU-003',
    phone: '01550128663',
    parentPhone: '0118848617',
    parentWhatsapp: '0118848617',
    grade: 'الصف الرابع الابتدائي',
    gradeLevel: 'الصف الرابع الابتدائي',
    classroomId: 'class-science-4',
    classroomName: 'الصف الرابع الابتدائي',
    avgScore: null,
    submissionsCount: 0,
    attendanceCount: 0,
    lastActive: new Date().toISOString(),
    isActive: true,
    defaultPassword: '7490',
    password: '7490',
    createdAt: new Date().toISOString(),
  },
];

export function getStudentsFromStore(): any[] {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_STUDENTS;
  try {
    const deletedRaw = localStorage.getItem('edu_deleted_students');
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw === null) {
      const initial = DEFAULT_INITIAL_STUDENTS.filter((s: any) => {
        const sCode = String(s?.studentCode || '').trim().toUpperCase();
        const sId = String(s?.id || '').trim().toUpperCase();
        return !deletedSet.has(sId) && (!sCode || !deletedSet.has(sCode));
      });
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s: any) => {
      const sCode = String(s?.studentCode || '').trim().toUpperCase();
      const sId = String(s?.id || '').trim().toUpperCase();
      return !deletedSet.has(sId) && (!sCode || !deletedSet.has(sCode));
    });
  } catch {
    return [];
  }
}

export function saveStudentToStore(student: any): any {
  if (typeof window === 'undefined') return student;
  try {
    const current = getStudentsFromStore();

    // Ensure student is un-deleted if re-created or updated
    try {
      const deletedRaw = localStorage.getItem('edu_deleted_students');
      if (deletedRaw) {
        const deletedSet = new Set<string>(JSON.parse(deletedRaw));
        const sId = String(student.id || '').trim().toUpperCase();
        const sCode = String(student.studentCode || '').trim().toUpperCase();
        if (sId) deletedSet.delete(sId);
        if (sCode) deletedSet.delete(sCode);
        localStorage.setItem('edu_deleted_students', JSON.stringify(Array.from(deletedSet)));
      }
    } catch {}

    const existingPins = current.map((s: any) => s.defaultPassword || s.password);
    const cleanPassword = String(student.defaultPassword || student.password || '').trim() || generateRandomPin(existingPins);
    const formatted = {
      id: student.id || student.studentCode || `STU-${Math.floor(100 + Math.random() * 900)}`,
      name: student.name,
      studentCode: student.studentCode || student.id,
      phone: student.phone || null,
      parentPhone: student.parentPhone || student.parentWhatsapp || null,
      parentWhatsapp: student.parentWhatsapp || student.parentPhone || null,
      grade: student.grade || student.gradeLevel || 'الصف الثالث الإعدادي',
      gradeLevel: student.gradeLevel || student.grade || 'الصف الثالث الإعدادي',
      classroomId: student.classroom || student.classroomId || '',
      avgScore: null,
      submissionsCount: 0,
      attendanceCount: 0,
      lastActive: new Date().toISOString(),
      isActive: student.isActive !== false,
      defaultPassword: cleanPassword,
      password: cleanPassword,
      createdAt: student.createdAt || new Date().toISOString(),
    };

    const existingIndex = current.findIndex(
      (s: any) => s.id === formatted.id || s.studentCode === formatted.studentCode
    );

    let updatedList;
    if (existingIndex !== -1) {
      updatedList = [...current];
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...formatted };
    } else {
      updatedList = [formatted, ...current];
    }

    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedList));
    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_students_updated', { detail: { student: formatted } }));
    }
    return formatted;
  } catch (err) {
    console.warn('[saveStudentToStore] LocalStorage write error:', err);
    return student;
  }
}

// -------------------------------------------------------------
// Centralized Classroom Master Controller (Client-Side)
// -------------------------------------------------------------

export function getClassroomsFromStore(): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_CLASSROOMS);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

    const raw = localStorage.getItem(STORAGE_KEYS.CLASSROOMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((c: any) => c?.id && !deletedSet.has(c.id));
  } catch {
    return [];
  }
}

export function getActiveClassroomsFromStore(): any[] {
  return getClassroomsFromStore().filter((c) => c.isActive !== false);
}

export function saveClassroomToStore(classroom: any): any {
  if (typeof window === 'undefined') return classroom;
  try {
    const current = getClassroomsFromStore();
    const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_CLASSROOMS);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
    deletedSet.delete(classroom.id);
    localStorage.setItem(STORAGE_KEYS.DELETED_CLASSROOMS, JSON.stringify(Array.from(deletedSet)));

    const formatted = {
      id: classroom.id,
      name: (classroom.name || '').trim(),
      subject: (classroom.subject || 'عام').trim(),
      code: (classroom.code || '').trim().toUpperCase(),
      isActive: classroom.isActive !== false,
      studentsCount: Number(classroom.studentsCount) || 0,
      quizzesCount: Number(classroom.quizzesCount) || 0,
      assignmentsCount: Number(classroom.assignmentsCount) || 0,
      createdAt: classroom.createdAt || new Date().toISOString(),
    };

    const existingIndex = current.findIndex((c) => c.id === formatted.id);
    let updatedList;
    if (existingIndex !== -1) {
      updatedList = [...current];
      updatedList[existingIndex] = { ...updatedList[existingIndex], ...formatted };
    } else {
      updatedList = [formatted, ...current];
    }

    localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(updatedList));
    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_classrooms_updated'));
    }
    return formatted;
  } catch (err) {
    console.warn('[saveClassroomToStore] write error:', err);
    return classroom;
  }
}

export function updateClassroomInStore(
  classroomId: string,
  updates: { name?: string; subject?: string; code?: string; isActive?: boolean }
): any {
  if (typeof window === 'undefined') return null;
  try {
    const current = getClassroomsFromStore();
    const target = current.find((c) => c.id === classroomId);
    if (!target) return null;

    const oldName = target.name;
    const newName = updates.name ? updates.name.trim() : oldName;
    const isNameChanged = updates.name && updates.name.trim() !== oldName;

    // 1. Update the classroom itself
    const updatedClassroom = {
      ...target,
      ...(updates.name ? { name: newName } : {}),
      ...(updates.subject ? { subject: updates.subject.trim() } : {}),
      ...(updates.code ? { code: updates.code.trim().toUpperCase() } : {}),
      ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
    };

    const nextClassrooms = current.map((c) => (c.id === classroomId ? updatedClassroom : c));
    localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(nextClassrooms));

    // 2. Cascade Name Updates across the ENTIRE PROJECT if name was changed
    if (isNameChanged) {
      // Cascade to Quizzes
      try {
        const rawQuizzes = localStorage.getItem(STORAGE_KEYS.QUIZZES);
        if (rawQuizzes) {
          const quizzesList: QuizData[] = JSON.parse(rawQuizzes);
          const updatedQuizzes = quizzesList.map((q) => {
            if (q.classroomId === classroomId || q.classroomName === oldName) {
              return { ...q, classroomName: newName };
            }
            return q;
          });
          localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updatedQuizzes));
        }
      } catch {}

      // Cascade to Assignments
      try {
        const rawAssignments = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
        if (rawAssignments) {
          const assignmentsList: AssignmentData[] = JSON.parse(rawAssignments);
          const updatedAssignments = assignmentsList.map((a) => {
            if (a.classroomId === classroomId || a.classroomName === oldName) {
              return { ...a, classroomName: newName };
            }
            return a;
          });
          localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(updatedAssignments));
        }
      } catch {}

      // Cascade to Students
      try {
        const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
        if (rawStudents) {
          const studentsList: any[] = JSON.parse(rawStudents);
          const updatedStudents = studentsList.map((s) => {
            if (s.classroomId === classroomId || s.classroom === oldName || s.classroomName === oldName) {
              return { ...s, classroom: newName, classroomName: newName };
            }
            return s;
          });
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
        }
      } catch {}
    }

    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_classrooms_updated'));
    }

    return updatedClassroom;
  } catch (err) {
    console.warn('[updateClassroomInStore] error:', err);
    return null;
  }
}

export function toggleClassroomStatusInStore(classroomId: string, isActive: boolean): boolean {
  if (typeof window === 'undefined') return isActive;
  try {
    const current = getClassroomsFromStore();
    const updated = current.map((c) => (c.id === classroomId ? { ...c, isActive } : c));
    localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(updated));
    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_classrooms_updated'));
    }
    return isActive;
  } catch {
    return isActive;
  }
}

export function deleteClassroomFromStore(classroomId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    // 1. Tombstone in DELETED_CLASSROOMS
    const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_CLASSROOMS);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
    deletedSet.add(classroomId);
    localStorage.setItem(STORAGE_KEYS.DELETED_CLASSROOMS, JSON.stringify(Array.from(deletedSet)));

    // 2. Remove from CLASSROOMS
    const current = getClassroomsFromStore();
    const target = current.find((c) => c.id === classroomId);
    const oldName = target?.name;
    const remaining = current.filter((c) => c.id !== classroomId);
    localStorage.setItem(STORAGE_KEYS.CLASSROOMS, JSON.stringify(remaining));

    // 3. CASCADE DELETE: Remove all quizzes belonging to this classroom
    try {
      const deletedQuizzesRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
      const deletedQuizzesSet = new Set<string>(deletedQuizzesRaw ? JSON.parse(deletedQuizzesRaw) : []);

      const rawQuizzes = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      if (rawQuizzes) {
        const quizzesList: QuizData[] = JSON.parse(rawQuizzes);
        quizzesList.forEach((q) => {
          if (q.classroomId === classroomId || (oldName && q.classroomName === oldName)) {
            deletedQuizzesSet.add(q.id);
            if (q.accessCode) deletedQuizzesSet.add(q.accessCode);
          }
        });
        const remainingQuizzes = quizzesList.filter(
          (q) => q.classroomId !== classroomId && (!oldName || q.classroomName !== oldName)
        );
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(remainingQuizzes));
        localStorage.setItem(STORAGE_KEYS.DELETED_QUIZZES, JSON.stringify(Array.from(deletedQuizzesSet)));
      }
    } catch {}

    // 4. CASCADE DELETE: Remove all assignments belonging to this classroom
    try {
      const deletedAssignmentsRaw = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
      const deletedAssignmentsSet = new Set<string>(deletedAssignmentsRaw ? JSON.parse(deletedAssignmentsRaw) : []);

      const rawAssignments = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
      if (rawAssignments) {
        const assignmentsList: AssignmentData[] = JSON.parse(rawAssignments);
        assignmentsList.forEach((a) => {
          if (a.classroomId === classroomId || (oldName && a.classroomName === oldName)) {
            deletedAssignmentsSet.add(a.id);
          }
        });
        const remainingAssignments = assignmentsList.filter(
          (a) => a.classroomId !== classroomId && (!oldName || a.classroomName !== oldName)
        );
        localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(remainingAssignments));
        localStorage.setItem(DELETED_ASSIGNMENTS_KEY, JSON.stringify(Array.from(deletedAssignmentsSet)));
      }
    } catch {}

    // 5. CASCADE UPDATE: Disassociate students from this deleted classroom
    try {
      const rawStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (rawStudents) {
        const studentsList: any[] = JSON.parse(rawStudents);
        const updatedStudents = studentsList.map((s) => {
          if (s.classroomId === classroomId || (oldName && (s.classroom === oldName || s.classroomName === oldName))) {
            return { ...s, classroomId: '', classroom: '', classroomName: '' };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updatedStudents));
      }
    } catch {}

    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_classrooms_updated'));
    }

    return true;
  } catch (err) {
    console.warn('[deleteClassroomFromStore] error:', err);
    return false;
  }
}

