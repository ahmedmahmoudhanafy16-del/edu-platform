'use client';

import { useState, useEffect } from 'react';

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
  createdAt?: string;
}

export interface QuizSubmissionData {
  quizId: string;
  studentId?: string;
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

export const STORAGE_KEYS = {
  QUIZZES: 'edu_quizzes',
  DELETED_QUIZZES: 'edu_deleted_quiz_ids',
  RESULTS: 'edu_quiz_results',
  STUDENTS: 'edu_students',
  ASSIGNMENTS: 'edu_assignments',
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
    questionsCount: 3,
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
      {
        id: 'q-sample-3',
        text: 'اشرح باختصار طريقة حل معادلتين من الدرجة الأولى في متغيرين بيانياً.',
        type: 'ESSAY',
        options: [],
        correctAnswer: null,
        maxScore: 10,
        order: 3,
      },
    ],
  },
];

const EVENT_STORE_UPDATED = 'edu_store_updated';

function notifyStoreUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_STORE_UPDATED));
  }
}

/**
 * 1. Retrieves all active quizzes from localStorage, initialized with seed data
 */
export function getQuizzes(): QuizData[] {
  if (typeof window === 'undefined') return INITIAL_SEED_QUIZZES;

  try {
    const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);

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

    // Filter out any tombstoned / deleted IDs
    return list.filter((q) => !deletedSet.has(q.id) && !deletedSet.has(q.accessCode));
  } catch (err) {
    console.warn('[getQuizzes] LocalStorage error:', err);
    return INITIAL_SEED_QUIZZES;
  }
}

/**
 * 2. Retrieves only visible quizzes for students (isPublished === true && !isHidden)
 */
export function getStudentQuizzes(): QuizData[] {
  return getQuizzes().filter(
    (q) => q.isPublished === true && !q.isHidden
  );
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
 * 6. Deletes a quiz and records tombstone ID
 */
export function deleteQuiz(quizId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const current = getQuizzes();
    const updated = current.filter((q) => q.id !== quizId && q.accessCode !== quizId);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updated));

    // Record in deleted set
    const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
    const deletedSet = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
    deletedSet.add(quizId);
    localStorage.setItem(STORAGE_KEYS.DELETED_QUIZZES, JSON.stringify(Array.from(deletedSet)));

    notifyStoreUpdated();
    return true;
  } catch (err) {
    console.warn('[deleteQuiz] LocalStorage delete error:', err);
    return false;
  }
}

/**
 * 7. Submissions & Results Store Functions
 */
export function getSubmissions(studentId?: string): QuizSubmissionData[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (!raw) return [];
    const parsed: QuizSubmissionData[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (studentId) {
      return parsed.filter((s) => !s.studentId || s.studentId === studentId);
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveSubmission(submission: QuizSubmissionData): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getSubmissions();
    const filtered = current.filter(
      (s) => !(s.quizId === submission.quizId && s.studentId === submission.studentId)
    );
    filtered.unshift({
      ...submission,
      submittedAt: submission.submittedAt || new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(filtered));
    notifyStoreUpdated();
  } catch (err) {
    console.warn('[saveSubmission] LocalStorage write error:', err);
  }
}

/**
 * 8. Reactive Custom Hook for Components
 */
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
