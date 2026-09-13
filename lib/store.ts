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
  quizTitle?: string;
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

export type RetakeCode = QuizRetakeCode;

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

export const STORAGE_KEYS = {
  QUIZZES: 'edu_quizzes',
  DELETED_QUIZZES: 'edu_deleted_quiz_ids',
  RESULTS: 'edu_quiz_results',
  RETAKE_CODES: 'edu_quiz_retake_codes',
  STUDENTS: 'edu_students',
  ASSIGNMENTS: 'edu_assignments',
  CLASSROOMS: 'edu_classrooms',
  DELETED_CLASSROOMS: 'edu_deleted_classrooms',
  DELETED_STUDENTS: 'edu_deleted_students',
} as const;

export const INITIAL_SEED_QUIZZES: QuizData[] = [];
export const DEFAULT_INITIAL_STUDENTS: any[] = [];
export const DELETED_ASSIGNMENTS_KEY = 'edu_deleted_assignment_ids';
export const DELETED_STUDENTS_KEY = 'edu_deleted_students';
const memDeletedStudents = new Set<string>();

const EVENT_STORE_UPDATED = 'edu_store_updated';

function notifyStoreUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(EVENT_STORE_UPDATED));
  }
}

const memQuizzes: QuizData[] = [];
const memSubmissions: QuizSubmissionData[] = [];
const memRetakeCodes: QuizRetakeCode[] = [];
const memAssignments: AssignmentData[] = [];
const memStudents: any[] = [];
const memClassrooms: any[] = [];

export function getQuizzes(): QuizData[] {
  return [...memQuizzes];
}

export function getStudentQuizzes(studentId?: string): QuizData[] {
  return memQuizzes.filter((q) => q.isPublished !== false && !q.isHidden);
}

export function getQuizById(idOrCode: string): QuizData | null {
  if (!idOrCode) return null;
  const clean = idOrCode.trim().toUpperCase();
  return (
    memQuizzes.find(
      (q) => q.id === idOrCode || (q.accessCode && q.accessCode.toUpperCase() === clean)
    ) || null
  );
}

export function saveQuiz(quiz: Partial<QuizData> & { id: string; title: string }): QuizData {
  const formatted: QuizData = {
    id: quiz.id,
    title: quiz.title,
    type: quiz.type || 'WEEKLY',
    duration: Number(quiz.duration) || 20,
    passingScore: Number(quiz.passingScore) || 60,
    accessCode: quiz.accessCode || '',
    isCodeRequired: Boolean(quiz.isCodeRequired),
    isPublished: quiz.isPublished !== false,
    isHidden: Boolean(quiz.isHidden),
    classroomName: quiz.classroomName || '',
    classroomId: quiz.classroomId || '',
    questionsCount: quiz.questions?.length ?? quiz.questionsCount ?? 0,
    resultsCount: quiz.resultsCount ?? 0,
    questions: quiz.questions || [],
    shuffleQuestions: quiz.shuffleQuestions !== false,
    maxViolations: quiz.maxViolations ?? 3,
    totalScore: quiz.totalScore ?? 100,
    createdAt: quiz.createdAt || new Date().toISOString(),
  };

  const idx = memQuizzes.findIndex((q) => q.id === formatted.id);
  if (idx !== -1) {
    memQuizzes[idx] = { ...memQuizzes[idx], ...formatted };
  } else {
    memQuizzes.unshift(formatted);
  }
  notifyStoreUpdated();
  return formatted;
}

export function toggleQuizVisibility(quizId: string, isPublished?: boolean): boolean {
  const quiz = memQuizzes.find((q) => q.id === quizId || q.accessCode === quizId);
  if (quiz) {
    const nextState = isPublished !== undefined ? isPublished : !quiz.isPublished;
    quiz.isPublished = nextState;
    quiz.isHidden = !nextState;
    notifyStoreUpdated();
    return nextState;
  }
  return false;
}

export function deleteQuiz(quizId: string): boolean {
  const idx = memQuizzes.findIndex((q) => q.id === quizId || q.accessCode === quizId);
  if (idx !== -1) {
    memQuizzes.splice(idx, 1);
  }
  for (let i = memSubmissions.length - 1; i >= 0; i--) {
    if (memSubmissions[i].quizId === quizId) {
      memSubmissions.splice(i, 1);
    }
  }
  notifyStoreUpdated();
  return true;
}

export function getSubmissions(studentId?: string): QuizSubmissionData[] {
  if (!studentId) return [...memSubmissions];
  const clean = studentId.trim().toUpperCase();
  return memSubmissions.filter(
    (s) =>
      (s.studentId && s.studentId.toUpperCase() === clean) ||
      (s.studentCode && s.studentCode.toUpperCase() === clean)
  );
}

export function saveSubmission(submission: QuizSubmissionData): void {
  const idx = memSubmissions.findIndex(
    (s) => s.quizId === submission.quizId && s.studentId === submission.studentId
  );
  if (idx !== -1) {
    memSubmissions[idx] = { ...memSubmissions[idx], ...submission };
  } else {
    memSubmissions.push(submission);
  }
  notifyStoreUpdated();
}

export function deleteSubmission(quizId: string, studentId: string): void {
  const cleanId = studentId.trim().toUpperCase();
  for (let i = memSubmissions.length - 1; i >= 0; i--) {
    const s = memSubmissions[i];
    if (
      s.quizId === quizId &&
      ((s.studentId && s.studentId.toUpperCase() === cleanId) ||
        (s.studentCode && s.studentCode.toUpperCase() === cleanId))
    ) {
      memSubmissions.splice(i, 1);
    }
  }
  notifyStoreUpdated();
}

export function getRetakeCodes(quizId?: string, studentId?: string): QuizRetakeCode[] {
  return memRetakeCodes.filter((rc) => {
    if (quizId && rc.quizId !== quizId) return false;
    if (studentId && rc.studentId !== studentId && rc.studentCode !== studentId) return false;
    return true;
  });
}

export function saveRetakeCode(retakeCode: QuizRetakeCode): QuizRetakeCode {
  memRetakeCodes.unshift(retakeCode);
  notifyStoreUpdated();
  return retakeCode;
}

export function generateRetakeCode(
  quizId: string,
  quizTitle: string,
  studentId: string,
  studentName: string,
  studentCode: string,
  reason: string = 'إعادة الامتحان بتصريح المعلم'
): QuizRetakeCode {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const code = 'RETAKE-' + randomPart;
  const record: QuizRetakeCode = {
    id: 'code-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
    code,
    quizId,
    quizTitle,
    studentId,
    studentName,
    studentCode,
    isUsed: false,
    reason,
    createdAt: new Date().toISOString(),
    usedAt: null,
  };
  return saveRetakeCode(record);
}

export function deleteRetakeCode(codeOrId: string): boolean {
  const idx = memRetakeCodes.findIndex((rc) => rc.id === codeOrId || rc.code === codeOrId);
  if (idx !== -1) {
    memRetakeCodes.splice(idx, 1);
    notifyStoreUpdated();
    return true;
  }
  return false;
}

export function consumeRetakeCode(
  code: string,
  quizId: string,
  studentIdOrCode: string
): { success: boolean; message?: string; retake?: RetakeCode } {
  const cleanCode = (code || '').trim().toUpperCase();
  const cleanStudent = (studentIdOrCode || '').trim().toUpperCase();
  const target = memRetakeCodes.find((rc) => rc.code.toUpperCase() === cleanCode);
  if (!target || target.isUsed) return { success: false, message: 'الكود غير صالح أو مستخدم بالفعل' };
  if (target.quizId !== quizId) return { success: false, message: 'هذا الكود غير مخصص لهذا الامتحان' };
  if (
    cleanStudent &&
    target.studentId.toUpperCase() !== cleanStudent &&
    target.studentCode.toUpperCase() !== cleanStudent
  ) {
    return { success: false, message: 'هذا الكود مخصص لطالب آخر' };
  }
  target.isUsed = true;
  target.usedAt = new Date().toISOString();
  deleteSubmission(quizId, target.studentId);
  notifyStoreUpdated();
  return { success: true, message: 'تم تفعيل كود إعادة الامتحان بنجاح', retake: target };
}

export function resetStudentQuizAttempt(
  targetQuizId: string,
  targetStudentId: string,
  targetStudentCode: string = ''
): { success: boolean; message?: string } {
  deleteSubmission(targetQuizId, targetStudentId);
  if (targetStudentCode) {
    deleteSubmission(targetQuizId, targetStudentCode);
  }
  notifyStoreUpdated();
  return { success: true, message: 'تم إعادة تعيين محاولة الطالب بنجاح' };
}

export function usePlatformQuizzes(filterForStudent: boolean = false) {
  const [quizzes, setQuizzes] = useState<QuizData[]>(() =>
    filterForStudent ? getStudentQuizzes() : getQuizzes()
  );

  useEffect(() => {
    function update() {
      setQuizzes(filterForStudent ? getStudentQuizzes() : getQuizzes());
    }
    window.addEventListener(EVENT_STORE_UPDATED, update);
    return () => window.removeEventListener(EVENT_STORE_UPDATED, update);
  }, [filterForStudent]);

  return {
    quizzes,
    refresh: () => setQuizzes(filterForStudent ? getStudentQuizzes() : getQuizzes()),
    saveQuiz,
    deleteQuiz,
    toggleQuizVisibility,
  };
}

export function getAssignments(): AssignmentData[] {
  return [...memAssignments];
}

export function getStudentAssignments(): AssignmentData[] {
  return memAssignments.filter((a) => !a.isClosed);
}

export function saveAssignment(
  assignment: Partial<AssignmentData> & { id: string; title: string }
): AssignmentData {
  const formatted: AssignmentData = {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description || '',
    dueDate: assignment.dueDate || new Date().toISOString(),
    maxScore: assignment.maxScore ?? 10,
    isClosed: Boolean(assignment.isClosed),
    classroomName: assignment.classroomName || '',
    classroomId: assignment.classroomId || '',
    fileUrl: assignment.fileUrl || null,
    submissions: assignment.submissions || [],
  };

  const idx = memAssignments.findIndex((a) => a.id === formatted.id);
  if (idx !== -1) {
    memAssignments[idx] = { ...memAssignments[idx], ...formatted };
  } else {
    memAssignments.unshift(formatted);
  }
  notifyStoreUpdated();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('edu_assignments_updated'));
  }
  return formatted;
}

export function deleteAssignment(assignmentId: string): boolean {
  const idx = memAssignments.findIndex((a) => a.id === assignmentId);
  if (idx !== -1) {
    memAssignments.splice(idx, 1);
    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_assignments_updated'));
    }
    return true;
  }
  return false;
}

export function toggleAssignmentLock(assignmentId: string, isClosed: boolean): boolean {
  const target = memAssignments.find((a) => a.id === assignmentId);
  if (target) {
    target.isClosed = isClosed;
    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_assignments_updated'));
    }
  }
  return isClosed;
}

export function getStudentsFromStore(): any[] {
  // getStudentsFromStore must filter by edu_deleted_students
  return [...memStudents].filter(
    (s) => !memDeletedStudents.has(s.id) && !memDeletedStudents.has(s.studentCode)
  );
}

export function saveStudentToStore(student: any): any {
  const formatted = {
    id: student.id || student.studentCode || 'STU-' + Math.floor(100 + Math.random() * 900),
    name: student.name,
    studentCode: student.studentCode || student.id,
    phone: student.phone || null,
    parentPhone: student.parentPhone || student.parentWhatsapp || null,
    parentWhatsapp: student.parentWhatsapp || student.parentPhone || null,
    grade: student.grade || student.gradeLevel || '',
    gradeLevel: student.gradeLevel || student.grade || '',
    classroomId: student.classroom || student.classroomId || '',
    avgScore: null,
    submissionsCount: 0,
    attendanceCount: 0,
    lastActive: new Date().toISOString(),
    isActive: student.isActive !== false,
    defaultPassword: student.defaultPassword || student.password || '',
    password: student.defaultPassword || student.password || '',
    createdAt: student.createdAt || new Date().toISOString(),
  };

  const idx = memStudents.findIndex(
    (s) => s.id === formatted.id || s.studentCode === formatted.studentCode
  );
  if (idx !== -1) {
    memStudents[idx] = { ...memStudents[idx], ...formatted };
  } else {
    memStudents.unshift(formatted);
  }
  notifyStoreUpdated();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('edu_students_updated', { detail: { student: formatted } }));
  }
  return formatted;
}

export function getClassroomsFromStore(): any[] {
  return [...memClassrooms];
}

export function getActiveClassroomsFromStore(): any[] {
  return memClassrooms.filter((c) => c.isActive !== false);
}

export function saveClassroomToStore(classroom: any): any {
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

  const idx = memClassrooms.findIndex((c) => c.id === formatted.id);
  if (idx !== -1) {
    memClassrooms[idx] = { ...memClassrooms[idx], ...formatted };
  } else {
    memClassrooms.unshift(formatted);
  }
  notifyStoreUpdated();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('edu_classrooms_updated'));
  }
  return formatted;
}

export function updateClassroomInStore(
  classroomId: string,
  updates: { name?: string; subject?: string; code?: string; isActive?: boolean }
): any {
  const target = memClassrooms.find((c) => c.id === classroomId);
  if (!target) return null;

  const oldName = target.name;
  const newName = updates.name ? updates.name.trim() : oldName;

  const updatedClassroom = {
    ...target,
    ...(updates.name ? { name: newName } : {}),
    ...(updates.subject ? { subject: updates.subject.trim() } : {}),
    ...(updates.code ? { code: updates.code.trim().toUpperCase() } : {}),
    ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
  };

  const idx = memClassrooms.findIndex((c) => c.id === classroomId);
  if (idx !== -1) {
    memClassrooms[idx] = updatedClassroom;
  }
  notifyStoreUpdated();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('edu_classrooms_updated'));
  }
  return updatedClassroom;
}

export function toggleClassroomStatusInStore(classroomId: string, isActive: boolean): boolean {
  const target = memClassrooms.find((c) => c.id === classroomId);
  if (target) {
    target.isActive = isActive;
    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_classrooms_updated'));
    }
  }
  return isActive;
}

export function deleteClassroomFromStore(classroomId: string): boolean {
  const idx = memClassrooms.findIndex((c) => c.id === classroomId);
  if (idx !== -1) {
    memClassrooms.splice(idx, 1);
    notifyStoreUpdated();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('edu_classrooms_updated'));
    }
    return true;
  }
  return false;
}
