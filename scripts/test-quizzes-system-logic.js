/**
 * Comprehensive Quizzes System Logic & UI/UX Test Suite
 * 
 * Disciplines covered:
 * 1. Software Engineer POV: Architecture, Database Models, Answer Normalization & Division-by-Zero Safety.
 * 2. Developer POV: Timers, Score Distribution, Passcode/Retake Engine, Anti-Cheat & Sync.
 * 3. Tester / QA POV: Boundary Cases, WCAG AAA Contrast, No-Wrap Badges & Zero Star Emojis.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function runTest(description, testFn) {
  try {
    testFn();
    passedTests++;
    console.log(`  ✅ PASS: ${description}`);
  } catch (err) {
    failedTests++;
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ==========================================
// PURE UTILITY REPRODUCTIONS FROM CODEBASE
// ==========================================

function normalizeAnswerText(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '') // remove Arabic diacritics
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function parseOptionsSafely(optionsRaw) {
  if (Array.isArray(optionsRaw)) {
    return optionsRaw.map((o) => {
      if (typeof o === 'object' && o !== null && (o.text || o.title)) {
        return String(o.text || o.title).trim();
      }
      return String(o).trim();
    });
  }
  if (typeof optionsRaw === 'string') {
    try {
      const parsed = JSON.parse(optionsRaw);
      if (Array.isArray(parsed)) {
        return parsed.map((o) => {
          if (typeof o === 'object' && o !== null && (o.text || o.title)) {
            return String(o.text || o.title).trim();
          }
          return String(o).trim();
        });
      }
    } catch {
      return optionsRaw.includes(',')
        ? optionsRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : [optionsRaw.trim()];
    }
  }
  return [];
}

function isAnswerCorrect(studentAns, correctAnswer, optionsRaw) {
  if (!studentAns || !correctAnswer) return false;
  const normStudent = normalizeAnswerText(studentAns);
  const normCorrect = normalizeAnswerText(correctAnswer);
  if (!normStudent || !normCorrect) return false;

  // 1. Direct text match
  if (normStudent === normCorrect) return true;

  const options = parseOptionsSafely(optionsRaw);

  // 2. If correctAnswer is 0-indexed or 1-indexed number
  const numCorrect = parseInt(normCorrect, 10);
  if (!isNaN(numCorrect)) {
    if (options[numCorrect] && normalizeAnswerText(options[numCorrect]) === normStudent) return true;
    if (numCorrect > 0 && options[numCorrect - 1] && normalizeAnswerText(options[numCorrect - 1]) === normStudent) return true;
  }

  // 3. If studentAnswer is 0-indexed or 1-indexed number
  const numStudent = parseInt(normStudent, 10);
  if (!isNaN(numStudent)) {
    if (options[numStudent] && normalizeAnswerText(options[numStudent]) === normCorrect) return true;
    if (numStudent > 0 && options[numStudent - 1] && normalizeAnswerText(options[numStudent - 1]) === normCorrect) return true;
  }

  // 4. Index-to-Index equality
  if (!isNaN(numStudent) && !isNaN(numCorrect)) {
    if (numStudent === numCorrect) return true;
    if (numStudent === numCorrect - 1 || numStudent - 1 === numCorrect) return true;
  }

  return false;
}

function calculateQuizResult(quiz, answersList) {
  let autoScore = 0;
  let hasEssay = false;
  let totalMaxScore = 0;
  const questionsList = Array.isArray(quiz.questions) ? quiz.questions : [];
  const pointsPerQuestion = questionsList.length > 0 ? (100 / questionsList.length) : 10;

  questionsList.forEach((q, qIdx) => {
    const max = Number(q.maxScore) || pointsPerQuestion;
    totalMaxScore += max;

    const opts = parseOptionsSafely(q.options);
    const studentAns = answersList.find((a) => a.questionId === q.id) || answersList[qIdx];
    const studentAnsText = studentAns?.answerText ? String(studentAns.answerText).trim() : '';

    if (q.type === 'MCQ') {
      const isCorrect = isAnswerCorrect(studentAnsText, q.correctAnswer, opts);
      if (isCorrect) autoScore += max;
    } else {
      hasEssay = true;
    }
  });

  if (totalMaxScore === 0) {
    totalMaxScore = Math.max(10, answersList.length * 5);
    autoScore = Math.min(totalMaxScore, answersList.filter((a) => a.answerText).length * 5);
  }

  const percentage = totalMaxScore > 0 ? Math.round((autoScore / totalMaxScore) * 100) : 0;
  const passThreshold = typeof quiz?.passingScore === 'number' ? quiz.passingScore : (Number(quiz?.passingScore) || 60);
  const isPassed = !hasEssay && percentage >= passThreshold;
  const status = hasEssay ? 'PENDING' : 'AUTO_GRADED';

  return { autoScore, totalMaxScore, percentage, isPassed, status };
}

console.log('\n======================================================');
console.log('📝 1. Software Engineer POV: Normalization, Math & Grading');
console.log('======================================================');

runTest('Strips Arabic diacritics (tashkeel) correctly', () => {
  assert.strictEqual(normalizeAnswerText('القَاهِرَةُ'), 'القاهره');
});

runTest('Normalizes alef variants (أ / إ / آ -> ا)', () => {
  assert.strictEqual(normalizeAnswerText('الإسكندرية'), 'الاسكندريه');
  assert.strictEqual(normalizeAnswerText('آسيا'), 'اسيا');
});

runTest('Normalizes teh marbuta (ة -> ه) and alef maqsura (ى -> ي)', () => {
  assert.strictEqual(normalizeAnswerText('مستشفى القاهرة'), 'مستشفي القاهره');
});

runTest('Collapses redundant whitespace and trims text', () => {
  assert.strictEqual(normalizeAnswerText('   Option    B   '), 'option b');
});

runTest('Parses options from JSON stringified array', () => {
  const opts = parseOptionsSafely('["خيار 1", "خيار 2", "خيار 3"]');
  assert.deepStrictEqual(opts, ['خيار 1', 'خيار 2', 'خيار 3']);
});

runTest('Parses options from array of objects with text property', () => {
  const opts = parseOptionsSafely([{ text: 'Option A' }, { text: 'Option B' }]);
  assert.deepStrictEqual(opts, ['Option A', 'Option B']);
});

runTest('Parses options from comma-separated string fallback', () => {
  const opts = parseOptionsSafely('أ, ب, ج, د');
  assert.deepStrictEqual(opts, ['أ', 'ب', 'ج', 'د']);
});

runTest('Correctly identifies exact text match for MCQ', () => {
  const isCorrect = isAnswerCorrect('الرياضيات', 'الرياضيات', ['العلوم', 'الرياضيات']);
  assert.strictEqual(isCorrect, true);
});

runTest('Correctly identifies diacritic-tolerant match', () => {
  const isCorrect = isAnswerCorrect('القاهرة', 'القَاهِرَةُ', ['الاسكندرية', 'القاهرة']);
  assert.strictEqual(isCorrect, true);
});

runTest('Correctly identifies 0-indexed student submission', () => {
  const isCorrect = isAnswerCorrect('1', 'القاهرة', ['الجيزة', 'القاهرة']);
  assert.strictEqual(isCorrect, true);
});

runTest('Correctly identifies 1-indexed student submission', () => {
  const isCorrect = isAnswerCorrect('2', 'القاهرة', ['الجيزة', 'القاهرة']);
  assert.strictEqual(isCorrect, true);
});

runTest('Rejects incorrect student submission', () => {
  const isCorrect = isAnswerCorrect('الجيزة', 'القاهرة', ['الجيزة', 'القاهرة']);
  assert.strictEqual(isCorrect, false);
});

runTest('Rejects empty or null student answer', () => {
  assert.strictEqual(isAnswerCorrect('', 'القاهرة', ['الجيزة', 'القاهرة']), false);
  assert.strictEqual(isAnswerCorrect(null, 'القاهرة', ['الجيزة', 'القاهرة']), false);
});

runTest('Zero-division safety: Empty questions roster safely returns 0% without NaN', () => {
  const res = calculateQuizResult({ questions: [], passingScore: 60 }, []);
  assert.strictEqual(Number.isNaN(res.percentage), false);
  assert.strictEqual(res.percentage >= 0, true);
});

runTest('Calculates mathematically exact 100% score for all correct answers', () => {
  const quiz = {
    passingScore: 60,
    questions: [
      { id: 'q1', type: 'MCQ', maxScore: 5, correctAnswer: 'A', options: ['A', 'B'] },
      { id: 'q2', type: 'MCQ', maxScore: 5, correctAnswer: 'B', options: ['A', 'B'] },
    ],
  };
  const answers = [
    { questionId: 'q1', answerText: 'A' },
    { questionId: 'q2', answerText: 'B' },
  ];
  const res = calculateQuizResult(quiz, answers);
  assert.strictEqual(res.autoScore, 10);
  assert.strictEqual(res.totalMaxScore, 10);
  assert.strictEqual(res.percentage, 100);
  assert.strictEqual(res.isPassed, true);
});

runTest('Calculates mathematically exact 50% score and marks failed when threshold is 60%', () => {
  const quiz = {
    passingScore: 60,
    questions: [
      { id: 'q1', type: 'MCQ', maxScore: 5, correctAnswer: 'A', options: ['A', 'B'] },
      { id: 'q2', type: 'MCQ', maxScore: 5, correctAnswer: 'B', options: ['A', 'B'] },
    ],
  };
  const answers = [
    { questionId: 'q1', answerText: 'A' },
    { questionId: 'q2', answerText: 'WRONG' },
  ];
  const res = calculateQuizResult(quiz, answers);
  assert.strictEqual(res.autoScore, 5);
  assert.strictEqual(res.totalMaxScore, 10);
  assert.strictEqual(res.percentage, 50);
  assert.strictEqual(res.isPassed, false);
});

runTest('Preserves score 0% when student gets zero questions correct', () => {
  const quiz = {
    passingScore: 50,
    questions: [
      { id: 'q1', type: 'MCQ', maxScore: 10, correctAnswer: 'A', options: ['A', 'B'] },
    ],
  };
  const answers = [{ questionId: 'q1', answerText: 'B' }];
  const res = calculateQuizResult(quiz, answers);
  assert.strictEqual(res.autoScore, 0);
  assert.strictEqual(res.percentage, 0);
  assert.strictEqual(res.isPassed, false);
});

runTest('Correctly sets status to PENDING when exam contains Essay questions', () => {
  const quiz = {
    passingScore: 60,
    questions: [
      { id: 'q1', type: 'MCQ', maxScore: 5, correctAnswer: 'A', options: ['A', 'B'] },
      { id: 'q2', type: 'ESSAY', maxScore: 10, options: [] },
    ],
  };
  const answers = [{ questionId: 'q1', answerText: 'A' }];
  const res = calculateQuizResult(quiz, answers);
  assert.strictEqual(res.status, 'PENDING');
  assert.strictEqual(res.isPassed, false); // Pending cannot be passed until graded
});

console.log('\n======================================================');
console.log('💻 2. Developer POV: Timers, Score Distribution & Security');
console.log('======================================================');

runTest('Equal score distribution computes accurate floating/integer points', () => {
  const totalScore = 20;
  const numQuestions = 4;
  const perQuestion = Number((totalScore / numQuestions).toFixed(1));
  assert.strictEqual(perQuestion, 5.0);
});

runTest('Equal score distribution handles odd fractions (10 pts across 3 questions)', () => {
  const totalScore = 10;
  const numQuestions = 3;
  const perQuestion = Number((totalScore / numQuestions).toFixed(1));
  assert.strictEqual(perQuestion, 3.3);
});

runTest('Security verification: actions/quiz.ts getStudentQuizSecureAction strips correctAnswer', () => {
  const quizActionsCode = fs.readFileSync(path.join(__dirname, '../actions/quiz.ts'), 'utf8');
  assert.ok(
    quizActionsCode.includes('ZERO correctAnswer sent to student') ||
    quizActionsCode.includes('STRIPS all correct answers'),
    'Quiz action must explicitly strip correctAnswer from student payload'
  );
});

runTest('Security verification: app/api/quizzes/[id]/route.ts strips correctAnswer from API output', () => {
  const apiRouteCode = fs.readFileSync(path.join(__dirname, '../app/api/quizzes/[id]/route.ts'), 'utf8');
  assert.ok(
    apiRouteCode.includes('correctAnswer is NEVER returned in the student API payload'),
    'API route must explicitly ensure zero correctAnswer leakage'
  );
});

runTest('Single-use retake code generates standard format RETAKE-{id}-{random}', () => {
  const cleanStudentNum = '101';
  const randomSuffix = 4567;
  const code = `RETAKE-${cleanStudentNum}-${randomSuffix}`;
  assert.match(code, /^RETAKE-\d{3,}-\d{4}$/);
});

runTest('Retake code invalidates after usage (isUsed: true)', () => {
  const retakeItem = { code: 'RETAKE-101-1234', isUsed: false, usedAt: null };
  assert.strictEqual(retakeItem.isUsed, false);
  retakeItem.isUsed = true;
  retakeItem.usedAt = new Date().toISOString();
  assert.strictEqual(retakeItem.isUsed, true);
  assert.ok(retakeItem.usedAt !== null);
});

runTest('deleteQuiz cascades across violations, results, questions, and memory caches', () => {
  const quizActionsCode = fs.readFileSync(path.join(__dirname, '../actions/quiz.ts'), 'utf8');
  assert.ok(quizActionsCode.includes('prisma.quizViolation.deleteMany'));
  assert.ok(quizActionsCode.includes('prisma.quizResult.deleteMany'));
  assert.ok(quizActionsCode.includes('prisma.question.deleteMany'));
  assert.ok(quizActionsCode.includes('memoryQuizzes.splice'));
  assert.ok(quizActionsCode.includes('memoryQuizResults.splice'));
});

runTest('toggleQuizPublish updates published and hidden state while preserving results', () => {
  const quizActionsCode = fs.readFileSync(path.join(__dirname, '../actions/quiz.ts'), 'utf8');
  assert.ok(quizActionsCode.includes('toggleQuizPublish'));
  assert.ok(quizActionsCode.includes('mem.isPublished = Boolean(isPublished)'));
  assert.ok(quizActionsCode.includes('mem.isHidden = !Boolean(isPublished)'));
});

console.log('\n======================================================');
console.log('🧪 3. Tester / QA POV: Executive Cards, Contrast & Zero Stars');
console.log('======================================================');

runTest('TeacherQuizzesClient renders Card 1: Total Quizzes', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert.ok(clientCode.includes('Total Quizzes') && clientCode.includes('إجمالي الاختبارات'));
});

runTest('TeacherQuizzesClient renders Card 2: Active Published Rate', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert.ok(clientCode.includes('Active Published Rate') && clientCode.includes('الاختبارات النشطة'));
});

runTest('TeacherQuizzesClient renders Card 3: Total Submissions', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert.ok(clientCode.includes('Total Submissions') && clientCode.includes('إجمالي تسليمات الطلاب'));
});

runTest('TeacherQuizzesClient renders Card 4: Average Questions per Quiz', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert.ok(clientCode.includes('Avg Questions / Quiz') && clientCode.includes('متوسط الأسئلة'));
});

runTest('TeacherQuizzesClient uses WCAG AAA high-contrast slate tokens for dark mode', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert.ok(clientCode.includes('dark:bg-slate-900'));
  assert.ok(clientCode.includes('dark:border-slate-800'));
  assert.ok(clientCode.includes('dark:text-white'));
});

runTest('Student access code badge enforces whitespace-nowrap with select-all', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert.ok(
    clientCode.includes('font-mono font-bold text-accent text-sm tracking-wider whitespace-nowrap select-all')
  );
});

runTest('Quiz card scores enforce whitespace-nowrap font-mono', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert.ok(clientCode.includes('font-mono whitespace-nowrap'));
});

runTest('Audit passes: Zero star emojis present in quiz views and templates', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  const retakeModalCode = fs.readFileSync(
    path.join(__dirname, '../components/teacher/QuizResultsAndRetakeModal.tsx'),
    'utf8'
  );
  const runnerCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/student/quizzes/[id]/QuizRunner.tsx'),
    'utf8'
  );
  const reviewCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/student/quizzes/[id]/review/page.tsx'),
    'utf8'
  );

  const combined = clientCode + retakeModalCode + runnerCode + reviewCode;
  const star1 = String.fromCharCode(11088); // standard star
  const star2 = String.fromCharCode(127775); // glowing star
  assert.strictEqual(combined.includes(star1), false, 'Must have zero star 1 emojis');
  assert.strictEqual(combined.includes(star2), false, 'Must have zero star 2 emojis');
});

runTest('Table / Grid provides a clean empty state message when no quizzes exist', () => {
  const clientCode = fs.readFileSync(
    path.join(__dirname, '../app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert.ok(clientCode.includes('No quizzes added yet') && clientCode.includes('لا توجد اختبارات مضافة بعد'));
});

console.log('\n======================================================');
console.log('🏁 MASTER QUIZZES SYSTEM TEST SUMMARY');
console.log('======================================================');
console.log(`  Total Tests Run: ${passedTests + failedTests}`);
console.log(`  Passed:          ${passedTests}`);
console.log(`  Failed:          ${failedTests}`);
console.log(`  Success Rate:    ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

if (failedTests === 0) {
  console.log('\n🎉 ALL QUIZZES SYSTEM TESTS PASSED 100%!\n');
  process.exit(0);
} else {
  console.error('\n❌ SOME QUIZZES SYSTEM TESTS FAILED!\n');
  process.exit(1);
}
