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
  createdAt?: string;
}

export interface QuizSubmissionData {
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
    if (!studentId) return parsed;

    const cleanTarget = studentId.trim();
    return parsed.filter((s) => {
      if (!s) return false;
      const sId = (s.studentId || (s as any).studentCode || '').trim();
      const sCode = ((s as any).studentCode || s.studentId || '').trim();

      if (sId === cleanTarget || sCode === cleanTarget) return true;

      if (
        (cleanTarget === 'STU-001' || cleanTarget === 'demo-student-1' || cleanTarget === 'student-1') &&
        (sId === 'STU-001' || sId === 'demo-student-1' || sId === 'student-1' || sCode === 'STU-001')
      ) {
        return true;
      }
      if (
        (cleanTarget === 'STU-777' || cleanTarget === 'demo-student-2' || cleanTarget === 'student-2') &&
        (sId === 'STU-777' || sId === 'demo-student-2' || sId === 'student-2' || sCode === 'STU-777')
      ) {
        return true;
      }
      return false;
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
    const targetStudentId = submission.studentId || 'STU-001';

    const filtered = current.filter(
      (s: any) =>
        !(
          (s.quizId === targetQuizId || s.id === targetQuizId || (s as any).accessCode === targetQuizId) &&
          (s.studentId === targetStudentId ||
            (targetStudentId === 'STU-001' &&
              (s.studentId === 'demo-student-1' || s.studentId === 'student-1' || s.studentId === 'STU-001')) ||
            (targetStudentId === 'demo-student-1' &&
              (s.studentId === 'STU-001' || s.studentId === 'student-1' || s.studentId === 'demo-student-1')))
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
      studentCode:
        targetStudentId === 'demo-student-1' || targetStudentId === 'student-1'
          ? 'STU-001'
          : targetStudentId,
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

    const storedRaw = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (!storedRaw) return [];

    const parsed: AssignmentData[] = JSON.parse(storedRaw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((a) => !deletedSet.has(a.id));
  } catch (err) {
    console.warn('[getAssignments] LocalStorage read error:', err);
    return [];
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
    defaultPassword: '1234',
    password: '1234',
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
    defaultPassword: '1234',
    password: '1234',
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
    defaultPassword: '1234',
    password: '1234',
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
    defaultPassword: '1234',
    password: '1234',
    createdAt: new Date().toISOString(),
  },
];

export function getStudentsFromStore(): any[] {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_STUDENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_INITIAL_STUDENTS));
      return DEFAULT_INITIAL_STUDENTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_INITIAL_STUDENTS));
      return DEFAULT_INITIAL_STUDENTS;
    }
    return parsed;
  } catch {
    return DEFAULT_INITIAL_STUDENTS;
  }
}

export function saveStudentToStore(student: any): any {
  if (typeof window === 'undefined') return student;
  try {
    const current = getStudentsFromStore();
    const cleanPassword = String(student.defaultPassword || student.password || '1234').trim() || '1234';
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
      isActive: true,
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
    return formatted;
  } catch (err) {
    console.warn('[saveStudentToStore] LocalStorage write error:', err);
    return student;
  }
}

