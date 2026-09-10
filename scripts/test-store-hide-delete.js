// Mock window & localStorage
const store = {};
global.window = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log('  [PASS]: ' + message);
    testsPassed++;
  } else {
    console.error('  [FAIL]: ' + message);
    testsFailed++;
  }
}

// Minimal simulation of store functions
const STORAGE_KEYS = {
  QUIZZES: 'edu_quizzes',
  DELETED_QUIZZES: 'edu_deleted_quiz_ids',
  RESULTS: 'edu_quiz_results',
  RETAKE_CODES: 'edu_quiz_retake_codes',
  CLASSROOMS: 'edu_classrooms',
};

function getQuizzes() {
  const raw = localStorage.getItem(STORAGE_KEYS.QUIZZES);
  const list = raw ? JSON.parse(raw) : [];
  const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
  const deletedSet = new Set(deletedRaw ? JSON.parse(deletedRaw) : []);
  return list.filter(q => !deletedSet.has(q.id) && !(q.accessCode && deletedSet.has(q.accessCode)));
}

function getSubmissions(studentId) {
  const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
  const deletedSet = new Set(deletedRaw ? JSON.parse(deletedRaw) : []);
  const active = parsed.filter(s => s && s.quizId && !deletedSet.has(s.quizId) && (!s.id || !deletedSet.has(s.id)));
  if (!studentId) return active;
  const clean = studentId.trim().toUpperCase();
  return active.filter(s => (s.studentId || s.studentCode || '').trim().toUpperCase() === clean);
}

function getStudentQuizzes(studentId) {
  const submissions = getSubmissions(studentId);
  const completedIds = new Set(submissions.map(s => s.quizId));
  return getQuizzes().filter(q => {
    const hasCompleted = completedIds.has(q.id) || (q.accessCode && completedIds.has(q.accessCode));
    if (!hasCompleted) {
      if (!q.isPublished || q.isHidden) return false;
    }
    return true;
  });
}

function toggleQuizVisibility(quizId, isPublished) {
  const current = getQuizzes();
  const quiz = current.find(q => q.id === quizId || q.accessCode === quizId);
  if (!quiz) return false;
  quiz.isPublished = isPublished;
  quiz.isHidden = !isPublished;
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(current));
  return isPublished;
}

function deleteQuiz(quizId) {
  const current = getQuizzes();
  const target = current.find(q => q.id === quizId || q.accessCode === quizId);
  const code = target ? target.accessCode : null;
  const updated = current.filter(q => q.id !== quizId && q.accessCode !== quizId);
  localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(updated));

  const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_QUIZZES);
  const deletedSet = new Set(deletedRaw ? JSON.parse(deletedRaw) : []);
  deletedSet.add(quizId);
  if (code) deletedSet.add(code);
  localStorage.setItem(STORAGE_KEYS.DELETED_QUIZZES, JSON.stringify(Array.from(deletedSet)));

  const resultsRaw = localStorage.getItem(STORAGE_KEYS.RESULTS);
  if (resultsRaw) {
    const parsed = JSON.parse(resultsRaw);
    const cleaned = parsed.filter(r => r.quizId !== quizId && r.quizId !== code && r.id !== quizId);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(cleaned));
  }
  return true;
}

console.log('Testing Store Hide vs Delete Logic:');

// Setup initial quizzes
const quiz1 = { id: 'q-101', title: 'Algebra Quiz', isPublished: true, isHidden: false, accessCode: 'ALG-101' };
localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([quiz1]));

// Student A completes the quiz with score 95
const subA = { quizId: 'q-101', studentId: 'STU-A', totalScore: 95, isPassed: true, status: 'AUTO_GRADED' };
localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify([subA]));

// 1. Both students check visibility when published
assert(getStudentQuizzes('STU-A').length === 1, 'Student A sees published quiz');
assert(getStudentQuizzes('STU-B').length === 1, 'Student B sees published quiz');

// 2. Teacher HIDES the quiz
toggleQuizVisibility('q-101', false);

// 3. Check visibility when hidden
assert(getStudentQuizzes('STU-A').length === 1, 'Student A STILL sees hidden quiz because they completed it');
assert(getSubmissions('STU-A').length === 1 && getSubmissions('STU-A')[0].totalScore === 95, 'Student A STILL has grade 95 for hidden quiz');
assert(getStudentQuizzes('STU-B').length === 0, 'Student B CANNOT see hidden quiz because they have not completed it');

// 4. Teacher DELETES the quiz
deleteQuiz('q-101');

// 5. Check visibility and grades after delete
assert(getStudentQuizzes('STU-A').length === 0, 'Student A sees ZERO quizzes after deletion');
assert(getSubmissions('STU-A').length === 0, 'Student A sees ZERO grades/results after deletion');
assert(getQuizzes().length === 0, 'Quiz is completely purged from store');

console.log('\nStore Tests: ' + testsPassed + ' passed, ' + testsFailed + ' failed');
process.exit(testsFailed > 0 ? 1 : 0);
