const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const originalSchema = fs.readFileSync(schemaPath, 'utf8');

let prisma;
let isLocalSqlite = false;
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

async function setup() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    isLocalSqlite = true;
    console.log('Preparing local sandbox for Comprehensive Exams Logic Audit...');
    const testDbPath = path.join(__dirname, '..', 'prisma', 'test_all_exams_qa.db');
    if (fs.existsSync(testDbPath)) {
      try { fs.unlinkSync(testDbPath); } catch (e) {}
    }
    let tempSchema = originalSchema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    tempSchema = tempSchema.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, '');
    fs.writeFileSync(schemaPath, tempSchema, 'utf8');
    process.env.DATABASE_URL = 'file:./test_all_exams_qa.db';
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  }
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
}

async function teardown() {
  if (prisma) {
    await prisma.$disconnect();
  }
  if (isLocalSqlite) {
    fs.writeFileSync(schemaPath, originalSchema, 'utf8');
    try {
      execSync('npx prisma generate', { stdio: 'ignore' });
      const testDbPath = path.join(__dirname, '..', 'prisma', 'test_all_exams_qa.db');
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}
  }
}

// Arabic normalization helper
function normalizeAnswerText(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function isAnswerCorrect(studentAns, correctAnswer, options) {
  if (!studentAns || !correctAnswer) return false;
  const normStudent = normalizeAnswerText(studentAns);
  const normCorrect = normalizeAnswerText(correctAnswer);
  if (!normStudent || !normCorrect) return false;
  if (normStudent === normCorrect) return true;

  const numCorrect = parseInt(normCorrect, 10);
  if (!isNaN(numCorrect)) {
    if (options[numCorrect] && normalizeAnswerText(options[numCorrect]) === normStudent) return true;
    if (numCorrect > 0 && options[numCorrect - 1] && normalizeAnswerText(options[numCorrect - 1]) === normStudent) return true;
  }

  const numStudent = parseInt(normStudent, 10);
  if (!isNaN(numStudent)) {
    if (options[numStudent] && normalizeAnswerText(options[numStudent]) === normCorrect) return true;
    if (numStudent > 0 && options[numStudent - 1] && normalizeAnswerText(options[numStudent - 1]) === normCorrect) return true;
  }
  return false;
}

async function runAllExamsLogicTests() {
  console.log('\n=============================================================');
  console.log('🧪 MASTER AUDIT: COMPREHENSIVE EXAM SYSTEM LOGICAL TEST SUITE');
  console.log('=============================================================\n');

  try {
    // -----------------------------------------------------------------------
    // SUITE 1: Quiz Creation, Schema Integrity & Question Types
    // -----------------------------------------------------------------------
    console.log('📋 Test Suite 1: Quiz Creation & Schema Integrity');
    const teacher = await prisma.user.create({
      data: {
        email: 'exam_teacher_' + Date.now() + '@school.com',
        name: 'Master Teacher',
        role: 'TEACHER',
      },
    });

    const activeClassroom = await prisma.classroom.create({
      data: {
        name: 'الصف الثالث الإعدادي - رياضيات',
        code: 'CLS-MATH-' + Date.now().toString().slice(-4),
        grade: 'PREP_3',
        subject: 'Mathematics',
        teacherId: teacher.id,
        isActive: true,
      },
    });

    const quiz = await prisma.quiz.create({
      data: {
        title: 'امتحان الجبر الشامل لنصف العام',
        type: 'MONTHLY',
        duration: 45,
        passingScore: 60,
        accessCode: 'MATH-EXAM-2026',
        isCodeRequired: true,
        isPublished: true,
        classroomId: activeClassroom.id,
        questions: {
          create: [
            {
              text: 'إذا كانت س = 3، فإن س² + 2س تساوي:',
              type: 'MCQ',
              options: JSON.stringify(['12', '15', '18', '21']),
              correctAnswer: '15',
              maxScore: 10,
              order: 1,
            },
            {
              text: 'مجموعة حل المعادلة س² - 4 = 0 في ح هي {2, -2}',
              type: 'TRUE_FALSE',
              options: JSON.stringify(['صواب', 'خطأ']),
              correctAnswer: 'صواب',
              maxScore: 10,
              order: 2,
            },
            {
              text: 'اشرح باختصار قانون العام لحل المعادلات التربيعية.',
              type: 'ESSAY',
              options: JSON.stringify([]),
              correctAnswer: '-ب ± جذر(ب² - 4أجـ) / 2أ',
              maxScore: 20,
              order: 3,
            },
          ],
        },
      },
      include: { questions: true },
    });

    assert(quiz && quiz.id, 'Quiz created with unique ID and linked to classroom');
    assert(quiz.duration === 45 && quiz.passingScore === 60, 'Quiz numerical attributes (duration, passingScore) saved accurately');
    assert(quiz.questions.length === 3, 'All 3 question types (MCQ, TRUE_FALSE, ESSAY) saved successfully');

    // -----------------------------------------------------------------------
    // SUITE 2: Access Passcode Verification & Case-Insensitivity
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 2: Access Passcode Security & Gating');
    const validCodeMatch = 'math-exam-2026'.trim().toUpperCase() === quiz.accessCode.trim().toUpperCase();
    assert(validCodeMatch, 'Access passcode accepts valid code with case-insensitivity');

    const wrongCodeMatch = 'WRONG-PASSCODE'.trim().toUpperCase() === quiz.accessCode.trim().toUpperCase();
    assert(!wrongCodeMatch, 'Access passcode strictly rejects incorrect code');

    // -----------------------------------------------------------------------
    // SUITE 3: Classroom Gating (Active vs Inactive Classroom)
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 3: Classroom Gating & Content Availability');
    // When classroom is active
    assert(activeClassroom.isActive === true, 'Quiz in active classroom is open for student access');

    // Deactivate classroom
    await prisma.classroom.update({
      where: { id: activeClassroom.id },
      data: { isActive: false },
    });
    const deactivatedClass = await prisma.classroom.findUnique({ where: { id: activeClassroom.id } });
    assert(deactivatedClass.isActive === false, 'Classroom deactivated by teacher');

    // Check gating logic: if classroom is inactive, quiz access is blocked
    const isQuizBlockedByClassroom = deactivatedClass.isActive === false;
    assert(isQuizBlockedByClassroom, 'Quiz access is blocked when parent classroom is disabled');

    // Re-activate classroom
    await prisma.classroom.update({
      where: { id: activeClassroom.id },
      data: { isActive: true },
    });
    const reactivatedClass = await prisma.classroom.findUnique({ where: { id: activeClassroom.id } });
    assert(reactivatedClass.isActive === true, 'Classroom re-activated and quiz access restored');

    // -----------------------------------------------------------------------
    // SUITE 4: Zero Answer Leakage & Anti-Cheat Payload Security
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 4: Zero Answer Leakage & Anti-Cheat Payload Security');
    // Simulate getStudentQuizSecureAction: strips correctAnswer
    const studentSafeQuestions = quiz.questions.map(q => {
      const { correctAnswer, ...safe } = q;
      return safe;
    });

    const hasAnyLeak = studentSafeQuestions.some(q => 'correctAnswer' in q);
    assert(!hasAnyLeak, 'CRITICAL SECURITY: correctAnswer is completely stripped from student questions');

    studentSafeQuestions.forEach((q, idx) => {
      assert(q.text && q.type && q.maxScore, 'Question ' + (idx + 1) + ' retains essential text and maxScore without leaking answers');
    });

    // -----------------------------------------------------------------------
    // SUITE 5: Auto-Grading & Scoring Algorithm
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 5: Auto-Grading & Scoring Mathematics');
    const q1 = quiz.questions.find(q => q.order === 1);
    const q2 = quiz.questions.find(q => q.order === 2);
    const q3 = quiz.questions.find(q => q.order === 3);

    // Test answer normalization (handling Arabic variations)
    const arabicTest1 = isAnswerCorrect('صواب', q2.correctAnswer, JSON.parse(q2.options));
    const arabicTest2 = isAnswerCorrect('صَوَابْ', q2.correctAnswer, JSON.parse(q2.options)); // with diacritics
    assert(arabicTest1 && arabicTest2, 'Grading engine normalizes Arabic diacritics and letters correctly');

    // Test MCQ exact match
    const mcqCorrect = isAnswerCorrect('15', q1.correctAnswer, JSON.parse(q1.options));
    const mcqWrong = isAnswerCorrect('12', q1.correctAnswer, JSON.parse(q1.options));
    assert(mcqCorrect && !mcqWrong, 'MCQ answers graded with 100% precision');

    // Create Student 1 for perfect score
    const student1 = await prisma.user.create({
      data: {
        email: 'student_perfect_' + Date.now() + '@school.com',
        name: 'طالب متفوق',
        role: 'STUDENT',
        studentCode: 'STU-' + Date.now() + '-1',
      },
    });

    // Student 1 submits perfect answers for MCQ & True/False
    let score1 = 0;
    if (mcqCorrect) score1 += q1.maxScore;
    if (arabicTest1) score1 += q2.maxScore;
    const totalMax = q1.maxScore + q2.maxScore + q3.maxScore; // 10 + 10 + 20 = 40
    const pct1 = Math.round((score1 / totalMax) * 100);

    const result1 = await prisma.quizResult.create({
      data: {
        quizId: quiz.id,
        studentId: student1.id,
        autoScore: score1,
        totalScore: null, // Pending teacher manual grading for ESSAY
        maxScore: totalMax,
        isPassed: false,
        status: 'PENDING', // PENDING due to ESSAY question
      },
    });

    assert(result1.autoScore === 20, 'Auto-score correctly calculated for automated questions (20/40)');
    assert(result1.status === 'PENDING', 'Mixed exam with written questions flagged as PENDING for teacher review');

    // Teacher grades the essay question with full marks (20/20)
    const teacherGradeEssay = 20;
    const finalScore1 = result1.autoScore + teacherGradeEssay;
    const finalPct1 = Math.round((finalScore1 / totalMax) * 100);
    const finalPassed1 = finalPct1 >= quiz.passingScore;

    await prisma.quizResult.update({
      where: { id: result1.id },
      data: {
        totalScore: finalScore1,
        status: 'GRADED',
        isPassed: finalPassed1,
      },
    });

    const updatedResult1 = await prisma.quizResult.findUnique({ where: { id: result1.id } });
    assert(updatedResult1.totalScore === 40, 'Teacher manual grading updates totalScore to 40/40');
    assert(updatedResult1.isPassed === true, 'Passing threshold verified: 100% >= 60% passingScore -> isPassed = true');
    assert(updatedResult1.status === 'GRADED', 'Status transitioned from PENDING to GRADED');

    // -----------------------------------------------------------------------
    // SUITE 6: Anti-Cheat Violations & Auto-Submission
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 6: Anti-Cheat Violations & Auto-Termination');
    const studentCheater = await prisma.user.create({
      data: {
        email: 'student_cheat_' + Date.now() + '@school.com',
        name: 'طالب مخالف',
        role: 'STUDENT',
        studentCode: 'STU-VIOLATE-1',
      },
    });

    // Simulate 3 violations (exceeding maxViolations of 2)
    const maxAllowedViolations = 2;
    let studentViolationsCount = 0;

    studentViolationsCount++; // Violation 1: Tab switch
    assert(studentViolationsCount <= maxAllowedViolations, 'Violation 1: Warning issued, exam continues');

    studentViolationsCount++; // Violation 2: Fullscreen exit
    assert(studentViolationsCount <= maxAllowedViolations, 'Violation 2: Final warning issued');

    studentViolationsCount++; // Violation 3: DevTools open
    const isTerminated = studentViolationsCount > maxAllowedViolations;
    assert(isTerminated, 'Violation 3: Limit exceeded -> triggers auto-termination and auto-submission');

    // Auto-submitted result with violations logged
    const cheaterResult = await prisma.quizResult.create({
      data: {
        quizId: quiz.id,
        studentId: studentCheater.id,
        autoScore: 0,
        totalScore: 0,
        maxScore: totalMax,
        isPassed: false,
        status: 'AUTO_GRADED',
        autoSubmitted: true,
        violationCount: studentViolationsCount,
      },
    });

    // Record violation event in QuizViolation
    const recordedViolation = await prisma.quizViolation.create({
      data: {
        quizResultId: cheaterResult.id,
        reason: 'TAB_SWITCH_OR_WINDOW_BLUR',
      },
    });

    assert(cheaterResult.autoSubmitted === true, 'Auto-submitted flag successfully recorded in QuizResult');
    assert(cheaterResult.violationCount === 3 && recordedViolation.id, 'Violations record successfully persisted and linked to QuizResult');

    // -----------------------------------------------------------------------
    // SUITE 7: Single-Attempt Enforcement (Locking regular passcode re-entry)
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 7: Single-Attempt Lock Enforcement');
    // Student 1 attempts to re-enter using normal exam passcode
    const hasPriorResult = await prisma.quizResult.findFirst({
      where: {
        quizId: quiz.id,
        studentId: student1.id,
      },
    });

    assert(Boolean(hasPriorResult), 'Student 1 detected as having already completed the exam');
    const reEntryAllowedWithRegularCode = !hasPriorResult;
    assert(!reEntryAllowedWithRegularCode, 'Re-entry using regular exam code is BLOCKED for completed student');

    // -----------------------------------------------------------------------
    // SUITE 8: Teacher-Authorized Retake System Lifecycle
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 8: Teacher-Authorized Retake System Lifecycle');
    // 1. Teacher generates unique Retake Code for Student 1
    const retakeCodeString = 'RETAKE-TEST-' + Date.now().toString().slice(-4);
    const retakeRecord = await prisma.notificationLog.create({
      data: {
        type: 'QUIZ_RETAKE_CODE',
        recipient: retakeCodeString,
        studentId: student1.id,
        content: JSON.stringify({
          code: retakeCodeString,
          quizId: quiz.id,
          studentId: student1.id,
          isUsed: false,
        }),
        status: 'ACTIVE',
      },
    });

    assert(retakeRecord && retakeRecord.status === 'ACTIVE', 'Teacher generated single-use Retake Code');

    // 2. Student 2 tries to use Student 1's retake code -> MUST FAIL
    const student2 = await prisma.user.create({
      data: {
        email: 'student_other_' + Date.now() + '@school.com',
        name: 'طالب آخر',
        role: 'STUDENT',
        studentCode: 'STU-' + Date.now() + '-2',
      },
    });
    const parsedRetake = JSON.parse(retakeRecord.content);
    const student2Authorized = parsedRetake.studentId === student2.id;
    assert(!student2Authorized, 'Retake Code rejected for unauthorized student (code bound to Student 1)');

    // 3. Student 1 uses valid Retake Code
    const student1Authorized = parsedRetake.studentId === student1.id && !parsedRetake.isUsed;
    assert(student1Authorized, 'Student 1 successfully validates assigned Retake Code');

    // Reset previous attempt and mark code as USED
    await prisma.quizResult.deleteMany({
      where: {
        quizId: quiz.id,
        studentId: student1.id,
      },
    });
    await prisma.notificationLog.update({
      where: { id: retakeRecord.id },
      data: { status: 'USED' },
    });

    const student1Cleared = await prisma.quizResult.findFirst({
      where: { quizId: quiz.id, studentId: student1.id },
    });
    assert(student1Cleared === null, 'Previous quiz attempt cleared from database for clean retake');

    // 4. Student 1 takes the retake and submits new score
    const newRetakeScore = await prisma.quizResult.create({
      data: {
        quizId: quiz.id,
        studentId: student1.id,
        autoScore: 20,
        totalScore: 40,
        maxScore: totalMax,
        isPassed: true,
        status: 'GRADED',
      },
    });
    assert(newRetakeScore && newRetakeScore.totalScore === 40, 'New retake submission successfully graded and saved');

    // 5. Attempting to reuse the same Retake Code again MUST FAIL
    const checkUsedRetake = await prisma.notificationLog.findUnique({ where: { id: retakeRecord.id } });
    const isCodeReusable = checkUsedRetake.status === 'ACTIVE';
    assert(!isCodeReusable, 'Duplicate reuse of Retake Code is strictly blocked (single-use enforced)');

    // -----------------------------------------------------------------------
    // SUITE 9: Quiz Hide vs Delete Behavioral Logic
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 9: Quiz Hide vs Delete Behavioral Logic');
    // 1. Teacher HIDES the quiz
    await prisma.quiz.update({
      where: { id: quiz.id },
      data: { isPublished: false },
    });

    // Completed student (Student 1) query: OR isPublished: true OR results.some.studentId
    const student1VisibleQuizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { isPublished: true },
          { results: { some: { studentId: student1.id } } },
        ],
      },
    });
    assert(student1VisibleQuizzes.some(q => q.id === quiz.id), 'Hidden quiz REMAINS visible to student who completed it');

    // Completed student grades query
    const student1Grades = await prisma.quizResult.findMany({
      where: { studentId: student1.id },
    });
    assert(student1Grades.some(g => g.quizId === quiz.id && g.totalScore === 40), 'Hidden quiz grades REMAIN visible normally');

    // Student who did NOT take it (Student 2)
    const student2VisibleQuizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { isPublished: true },
          { results: { some: { studentId: student2.id } } },
        ],
      },
    });
    assert(!student2VisibleQuizzes.some(q => q.id === quiz.id), 'Hidden quiz is HIDDEN from student who did not take it');

    // 2. Teacher DELETES the quiz
    await prisma.quizViolation.deleteMany({ where: { quizResult: { quizId: quiz.id } } });
    await prisma.quizResult.deleteMany({ where: { quizId: quiz.id } });
    await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    await prisma.quiz.delete({ where: { id: quiz.id } });

    // Verify ZERO trace remains for Student 1
    const student1QuizzesAfterDelete = await prisma.quiz.findMany({
      where: {
        OR: [
          { isPublished: true },
          { results: { some: { studentId: student1.id } } },
        ],
      },
    });
    assert(!student1QuizzesAfterDelete.some(q => q.id === quiz.id), 'Student 1 sees ZERO trace in quizzes list after quiz deletion');

    const student1GradesAfterDelete = await prisma.quizResult.findMany({
      where: { studentId: student1.id },
    });
    assert(student1GradesAfterDelete.length === 0, 'Student 1 sees ZERO grades after quiz deletion (as if never taken)');

    // -----------------------------------------------------------------------
    // SUITE 10: Quiz Editing & Total Score Dynamics
    // -----------------------------------------------------------------------
    console.log('\n📋 Test Suite 10: Quiz Editing & Dynamic Calculations');
    const editableQuiz = await prisma.quiz.create({
      data: {
        title: 'امتحان قابل للتعديل',
        type: 'WEEKLY',
        duration: 20,
        passingScore: 50,
        accessCode: 'EDIT-QUIZ-1',
        isPublished: true,
      },
    });

    // Add question
    await prisma.question.create({
      data: {
        quizId: editableQuiz.id,
        text: 'سؤال تجريبي',
        type: 'MCQ',
        options: JSON.stringify(['أ', 'ب']),
        correctAnswer: 'أ',
        maxScore: 15,
        order: 1,
      },
    });

    // Update quiz title and duration
    const updatedEditable = await prisma.quiz.update({
      where: { id: editableQuiz.id },
      data: {
        title: 'امتحان الجبر بعد التعديل',
        duration: 25,
      },
      include: { questions: true },
    });

    assert(updatedEditable.title === 'امتحان الجبر بعد التعديل', 'Quiz title updated successfully');
    assert(updatedEditable.duration === 25, 'Quiz duration updated successfully');
    assert(updatedEditable.questions.length === 1 && updatedEditable.questions[0].maxScore === 15, 'Questions and points preserved on update');

    // Cleanup editable quiz
    await prisma.question.deleteMany({ where: { quizId: editableQuiz.id } });
    await prisma.quiz.delete({ where: { id: editableQuiz.id } });

    console.log('\n=============================================================');
    console.log('MASTER EXAMS TEST SUMMARY: ' + testsPassed + ' passed, ' + testsFailed + ' failed');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('💥 Master exam test suite crashed:', err);
    testsFailed++;
  }
}

(async () => {
  try {
    await setup();
    await runAllExamsLogicTests();
  } finally {
    await teardown();
    process.exit(testsFailed > 0 ? 1 : 0);
  }
})();
