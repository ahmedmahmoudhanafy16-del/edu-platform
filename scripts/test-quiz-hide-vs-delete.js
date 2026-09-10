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
    console.log('Preparing local sandbox for Quiz Hide vs Delete audit...');
    let tempSchema = originalSchema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    tempSchema = tempSchema.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, '');
    fs.writeFileSync(schemaPath, tempSchema, 'utf8');
    process.env.DATABASE_URL = 'file:./test_quiz_hide_delete.db';
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
      const testDbPath = path.join(__dirname, '..', 'prisma', 'test_quiz_hide_delete.db');
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('Starting Quiz Hide vs Delete Behavioral Logic Test Suite');
  console.log('======================================================\n');

  try {
    console.log('1. Setting up Test Users (Teacher, Student A, Student B)...');
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher_hd_' + Date.now() + '@test.com',
        name: 'Teacher Ahmed',
        role: 'TEACHER',
      },
    });

    const studentA = await prisma.user.create({
      data: {
        email: 'student_a_' + Date.now() + '@test.com',
        name: 'Student A (completed)',
        role: 'STUDENT',
        studentCode: 'STU-A-' + Date.now().toString().slice(-4),
      },
    });

    const studentB = await prisma.user.create({
      data: {
        email: 'student_b_' + Date.now() + '@test.com',
        name: 'Student B (not completed)',
        role: 'STUDENT',
        studentCode: 'STU-B-' + Date.now().toString().slice(-4),
      },
    });

    assert(teacher.id && studentA.id && studentB.id, 'Users created successfully');

    console.log('\n2. Creating Published Exam...');
    const quiz = await prisma.quiz.create({
      data: {
        title: 'Cumulative Algebra Exam',
        type: 'WEEKLY',
        duration: 30,
        passingScore: 60,
        accessCode: 'ALG-' + Date.now().toString().slice(-4),
        isPublished: true,
        questions: {
          create: [
            {
              text: '5 + 7 = ?',
              type: 'MCQ',
              options: JSON.stringify(['10', '12', '14']),
              correctAnswer: '12',
              maxScore: 10,
              order: 1,
            },
          ],
        },
      },
    });

    assert(quiz.isPublished === true, 'Quiz initially published');

    console.log('\n3. Student A takes the exam and submits answers...');
    const resultA = await prisma.quizResult.create({
      data: {
        quizId: quiz.id,
        studentId: studentA.id,
        autoScore: 10,
        totalScore: 10,
        maxScore: 10,
        isPassed: true,
        status: 'AUTO_GRADED',
      },
    });

    assert(resultA.id && resultA.totalScore === 10, 'Student A score saved (10/10)');

    console.log('\n4. Teacher HIDES the exam (toggleQuizPublish -> isPublished: false)...');
    await prisma.quiz.update({
      where: { id: quiz.id },
      data: { isPublished: false },
    });

    const hiddenQuiz = await prisma.quiz.findUnique({ where: { id: quiz.id } });
    assert(hiddenQuiz.isPublished === false, 'Quiz status successfully toggled to hidden (isPublished = false)');

    console.log('\n5. Validating Student Visibility on Hidden Exam:');
    const studentAQuizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { isPublished: true },
          { results: { some: { studentId: studentA.id } } },
        ],
      },
    });
    assert(
      studentAQuizzes.some((q) => q.id === quiz.id),
      'Student A STILL sees the hidden quiz because they already completed it'
    );

    const studentAGrades = await prisma.quizResult.findMany({
      where: { studentId: studentA.id },
      include: { quiz: true },
    });
    assert(
      studentAGrades.some((g) => g.quizId === quiz.id && g.totalScore === 10),
      'Student A STILL sees their grade (10/10) for the hidden quiz normally'
    );

    const studentBQuizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { isPublished: true },
          { results: { some: { studentId: studentB.id } } },
        ],
      },
    });
    assert(
      !studentBQuizzes.some((q) => q.id === quiz.id),
      'Student B CANNOT see the hidden quiz (hidden from students who have not taken it)'
    );

    console.log('\n6. Teacher DELETES the exam completely (deleteQuiz)...');
    await prisma.quizViolation.deleteMany({ where: { quizResult: { quizId: quiz.id } } });
    await prisma.quizResult.deleteMany({ where: { quizId: quiz.id } });
    await prisma.question.deleteMany({ where: { quizId: quiz.id } });
    await prisma.quiz.delete({ where: { id: quiz.id } });

    console.log('\n7. Verifying zero trace of deleted exam for Student A:');
    const studentAQuizzesAfterDelete = await prisma.quiz.findMany({
      where: {
        OR: [
          { isPublished: true },
          { results: { some: { studentId: studentA.id } } },
        ],
      },
    });
    assert(
      !studentAQuizzesAfterDelete.some((q) => q.id === quiz.id),
      'Student A sees ZERO trace of quiz in quiz list after deletion'
    );

    const studentAGradesAfterDelete = await prisma.quizResult.findMany({
      where: { studentId: studentA.id },
    });
    assert(
      studentAGradesAfterDelete.length === 0,
      'Student A sees ZERO grades/results across all records (as if they never took it)'
    );

    const dbQuizCheck = await prisma.quiz.findUnique({ where: { id: quiz.id } });
    assert(dbQuizCheck === null, 'Quiz record completely removed from database');

    console.log('\n======================================================');
    console.log('TEST SUMMARY: ' + testsPassed + ' passed, ' + testsFailed + ' failed');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test suite crashed:', err);
    testsFailed++;
  }
}

(async () => {
  try {
    await setup();
    await runTests();
  } finally {
    await teardown();
    process.exit(testsFailed > 0 ? 1 : 0);
  }
})();
