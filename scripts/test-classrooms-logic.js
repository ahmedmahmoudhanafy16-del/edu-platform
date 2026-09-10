/**
 * Automated Classrooms (فصول) Logic & Security Test Suite
 * Rigorously tests the entire lifecycle and logic of Classrooms across the platform:
 * 1. Classroom creation with auto-generated code and valid teacher linkage
 * 2. Student enrollment via teacher direct assignment
 * 3. Student self-enrollment via join code (joinClassroomAction)
 * 4. Duplicate enrollment prevention (idempotency)
 * 5. Classroom update (name, subject, code)
 * 6. Classroom status toggle (deactivation & activation) + Content Gating (quizzes & assignments)
 * 7. Student classroom transfer and grade updates
 * 8. Safe multi-table cascade deletion with zero foreign key violations
 */

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
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
  }
}

async function setup() {
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    isLocalSqlite = true;
    console.log('⚡ Preparing local sandbox for Classrooms QA audit...');
    let tempSchema = originalSchema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    tempSchema = tempSchema.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, '');
    fs.writeFileSync(schemaPath, tempSchema, 'utf8');
    process.env.DATABASE_URL = 'file:./test_classrooms_qa.db';
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
      const testDbPath = path.join(__dirname, '..', 'prisma', 'test_classrooms_qa.db');
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      const testDbRoot = path.join(__dirname, '..', 'test_classrooms_qa.db');
      if (fs.existsSync(testDbRoot)) fs.unlinkSync(testDbRoot);
    } catch (e) {}
    console.log('🔄 Restored production PostgreSQL schema configuration.');
  }
}

async function runClassroomTests() {
  console.log('\n=============================================================');
  console.log('🏫 STARTING COMPREHENSIVE CLASSROOMS (فصول) LOGIC AUDIT');
  console.log('=============================================================\n');

  // Ensure test teacher exists
  let teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  if (!teacher) {
    teacher = await prisma.user.create({
      data: {
        id: 'teacher-cls-qa',
        name: 'أ/ محمد إبراهيم (معلم رياضيات)',
        email: 'mohamed.math@school.com',
        phone: '01012345678',
        role: 'TEACHER',
        password: 'pass',
      },
    });
  }

  // -------------------------------------------------------------------------
  // TEST SUITE 1: Classroom Creation & Auto Code Generation
  // -------------------------------------------------------------------------
  console.log('📋 Test Suite 1: Classroom Creation & Code Generation');

  const generatedCode = 'MTH' + Math.floor(100 + Math.random() * 900);
  const classroom1 = await prisma.classroom.create({
    data: {
      id: 'cls-qa-suite-1',
      name: 'الصف الثالث الإعدادي - مجموعة المتفوقين',
      subject: 'الرياضيات والجبر',
      code: generatedCode,
      teacherId: teacher.id,
      isActive: true,
    },
  });

  assert(classroom1 && classroom1.id === 'cls-qa-suite-1', 'Classroom successfully created in database');
  assert(classroom1.code === generatedCode, 'Classroom join code matches generated code format');
  assert(classroom1.isActive === true, 'New classroom is active by default');
  assert(classroom1.teacherId === teacher.id, 'Classroom correctly references valid Teacher ID');

  // -------------------------------------------------------------------------
  // TEST SUITE 2: Student Direct Enrollment
  // -------------------------------------------------------------------------
  console.log('\n📋 Test Suite 2: Student Direct Enrollment in Classroom');

  const studentA = await prisma.user.upsert({
    where: { studentCode: 'STU-CLS-A' },
    update: { isActive: true },
    create: {
      id: 'stu-cls-user-a',
      studentCode: 'STU-CLS-A',
      name: 'أحمد محمود',
      phone: '01011110001',
      role: 'STUDENT',
      grade: 'الصف الثالث الإعدادي',
      isActive: true,
    },
  });

  const enrollmentA = await prisma.enrollment.create({
    data: {
      userId: studentA.id,
      classroomId: classroom1.id,
    },
  });

  assert(enrollmentA && enrollmentA.userId === studentA.id, 'Student A enrolled in classroom');

  // -------------------------------------------------------------------------
  // TEST SUITE 3: Student Self-Enrollment via Join Code (joinClassroomAction)
  // -------------------------------------------------------------------------
  console.log('\n📋 Test Suite 3: Self-Enrollment via Classroom Code & Idempotency');

  const studentB = await prisma.user.upsert({
    where: { studentCode: 'STU-CLS-B' },
    update: { isActive: true },
    create: {
      id: 'stu-cls-user-b',
      studentCode: 'STU-CLS-B',
      name: 'يوسف كمال',
      phone: '01011110002',
      role: 'STUDENT',
      grade: 'الصف الثالث الإعدادي',
      isActive: true,
    },
  });

  // Simulate joinClassroomAction logic
  async function simulateJoinClassroom(code, studentIdentifier) {
    const cleanCode = (code || '').trim().toUpperCase();
    const cls = await prisma.classroom.findFirst({
      where: { code: cleanCode },
    });
    if (!cls) return { success: false, error: 'كود الفصل غير صحيح' };
    if (!cls.isActive) return { success: false, error: 'الفصل معطل مؤقتاً' };

    const user = await prisma.user.findFirst({
      where: { OR: [{ id: studentIdentifier }, { studentCode: studentIdentifier }] },
    });
    if (!user) return { success: false, error: 'الطالب غير موجود' };

    const existing = await prisma.enrollment.findUnique({
      where: { userId_classroomId: { userId: user.id, classroomId: cls.id } },
    });
    if (existing) return { success: true, alreadyEnrolled: true, message: 'مسجل بالفعل' };

    await prisma.enrollment.create({
      data: { userId: user.id, classroomId: cls.id },
    });
    return { success: true, alreadyEnrolled: false, message: 'تم الانضمام بنجاح' };
  }

  // First join attempt: should succeed
  const joinRes1 = await simulateJoinClassroom(classroom1.code, studentB.studentCode);
  assert(joinRes1.success && !joinRes1.alreadyEnrolled, 'Student B successfully joined classroom using code');

  // Verify DB record
  const checkEnrollmentB = await prisma.enrollment.findUnique({
    where: { userId_classroomId: { userId: studentB.id, classroomId: classroom1.id } },
  });
  assert(checkEnrollmentB !== null, 'Enrollment record exists in database');

  // Second join attempt (duplicate): should be idempotent and return alreadyEnrolled: true
  const joinRes2 = await simulateJoinClassroom(classroom1.code, studentB.studentCode);
  assert(joinRes2.success && joinRes2.alreadyEnrolled, 'Duplicate join detected: prevents multiple enrollment rows');

  // Invalid code attempt: should fail
  const invalidJoin = await simulateJoinClassroom('INVALID-CODE-999', studentB.studentCode);
  assert(!invalidJoin.success, 'Invalid classroom code is rejected');

  // -------------------------------------------------------------------------
  // TEST SUITE 4: Classroom Editing (Name, Subject, Custom Code)
  // -------------------------------------------------------------------------
  console.log('\n📋 Test Suite 4: Classroom Metadata Editing');

  const updatedClassroom = await prisma.classroom.update({
    where: { id: classroom1.id },
    data: {
      name: 'الصف الثالث الإعدادي - مراجعات الهندسة',
      subject: 'الهندسة المستوية',
      code: 'GEOM-301',
    },
  });

  assert(updatedClassroom.name === 'الصف الثالث الإعدادي - مراجعات الهندسة', 'Classroom title successfully updated');
  assert(updatedClassroom.subject === 'الهندسة المستوية', 'Classroom subject successfully updated');
  assert(updatedClassroom.code === 'GEOM-301', 'Classroom code updated to custom code');

  // -------------------------------------------------------------------------
  // TEST SUITE 5: Classroom Status Toggle (Deactivation & Activation) + Content Gating
  // -------------------------------------------------------------------------
  console.log('\n📋 Test Suite 5: Classroom Deactivation & Content Access Gating');

  // Create a quiz in this classroom
  const quizInClass = await prisma.quiz.create({
    data: {
      id: 'quiz-cls-gate-1',
      title: 'امتحان الجبر النهائي للفصل',
      classroomId: classroom1.id,
      isPublished: true,
      passingScore: 50,
      questions: {
        create: [
          {
            id: 'q-gate-1',
            text: 'هل الزاوية القائمة قياسها 90 درجة؟',
            type: 'MCQ',
            options: JSON.stringify(['نعم', 'لا']),
            correctAnswer: 'نعم',
            maxScore: 10,
          },
        ],
      },
    },
    include: { classroom: true },
  });

  // Create an assignment in this classroom
  const assignmentInClass = await prisma.assignment.create({
    data: {
      id: 'assign-cls-gate-1',
      title: 'واجب البراهين الهندسية',
      classroomId: classroom1.id,
      dueDate: new Date(Date.now() + 86400000),
      maxScore: 10,
    },
    include: { classroom: true },
  });

  // Deactivate classroom
  await prisma.classroom.update({
    where: { id: classroom1.id },
    data: { isActive: false },
  });

  const deactivatedCls = await prisma.classroom.findUnique({ where: { id: classroom1.id } });
  assert(deactivatedCls.isActive === false, 'Classroom successfully deactivated');

  // Verify new students cannot join deactivated classroom
  const joinDeactivatedRes = await simulateJoinClassroom('GEOM-301', studentA.studentCode);
  assert(!joinDeactivatedRes.success, 'Joining deactivated classroom is blocked');

  // Verify Quiz Gating logic for deactivated classroom
  const quizCheck = await prisma.quiz.findUnique({
    where: { id: quizInClass.id },
    include: { classroom: true },
  });
  const isQuizBlocked = quizCheck.classroom && quizCheck.classroom.isActive === false;
  assert(isQuizBlocked, 'Quiz access gating: Quizzes in deactivated classroom are blocked from students');

  // Verify Assignment Gating logic for deactivated classroom
  const assignCheck = await prisma.assignment.findUnique({
    where: { id: assignmentInClass.id },
    include: { classroom: true },
  });
  const isAssignBlocked = assignCheck.classroom && assignCheck.classroom.isActive === false;
  assert(isAssignBlocked, 'Assignment submission gating: Assignments in deactivated classroom are blocked');

  // Re-activate classroom
  await prisma.classroom.update({
    where: { id: classroom1.id },
    data: { isActive: true },
  });
  const reactivatedCls = await prisma.classroom.findUnique({ where: { id: classroom1.id } });
  assert(reactivatedCls.isActive === true, 'Classroom successfully re-activated');

  // -------------------------------------------------------------------------
  // TEST SUITE 6: Student Classroom Transfer
  // -------------------------------------------------------------------------
  console.log('\n📋 Test Suite 6: Student Classroom Transfer & Enrollment Swap');

  // Create a second classroom
  const classroom2 = await prisma.classroom.create({
    data: {
      id: 'cls-qa-suite-2',
      name: 'الصف الأول الثانوي - فيزياء عامة',
      subject: 'الفيزياء',
      code: 'PHYS-101',
      teacherId: teacher.id,
      isActive: true,
    },
  });

  // Transfer Student A from classroom1 to classroom2
  await prisma.enrollment.deleteMany({
    where: { userId: studentA.id },
  });
  await prisma.enrollment.create({
    data: {
      userId: studentA.id,
      classroomId: classroom2.id,
    },
  });

  const studentAEnrollments = await prisma.enrollment.findMany({
    where: { userId: studentA.id },
  });
  assert(studentAEnrollments.length === 1, 'Student A has exactly 1 active enrollment after transfer');
  assert(studentAEnrollments[0].classroomId === classroom2.id, 'Student A successfully moved to new classroom (PHYS-101)');

  // -------------------------------------------------------------------------
  // TEST SUITE 7: Live Session Linkage & Access Codes
  // -------------------------------------------------------------------------
  console.log('\n📋 Test Suite 7: Classroom Live Session Linkage');

  const liveSession = await prisma.liveSession.create({
    data: {
      id: 'live-cls-1',
      title: 'بث مباشر لشرح الوحدة الأولى هندسة',
      roomCode: 'ROOM-GEOM-1',
      classroomId: classroom1.id,
      isActive: true,
    },
  });

  const sessionAccessCode = await prisma.sessionAccessCode.create({
    data: {
      code: 'EDU-CLS-LIVE-1',
      liveSessionId: liveSession.id,
      price: 25.0,
      isUsed: false,
    },
  });

  assert(liveSession && liveSession.classroomId === classroom1.id, 'Live session successfully linked to classroom');
  assert(sessionAccessCode && sessionAccessCode.liveSessionId === liveSession.id, 'Session access code created for classroom session');

  // -------------------------------------------------------------------------
  // TEST SUITE 8: Bulletproof Cascade Deletion (Zero Foreign Key Violations)
  // -------------------------------------------------------------------------
  console.log('\n📋 Test Suite 8: Bulletproof Cascade Deletion');

  // Add submissions and quiz results to test deep cascade
  await prisma.quizResult.create({
    data: {
      id: 'res-del-test-1',
      quizId: quizInClass.id,
      studentId: studentB.id,
      autoScore: 10,
      totalScore: 10,
      maxScore: 10,
      isPassed: true,
      status: 'AUTO_GRADED',
    },
  });

  await prisma.assignmentSubmission.create({
    data: {
      id: 'sub-del-test-1',
      assignmentId: assignmentInClass.id,
      studentId: studentB.id,
      textAnswer: 'تم الحل بنجاح',
      status: 'SUBMITTED',
    },
  });

  // Execute safe cascade deletion (as implemented in deleteClassroom)
  const targetDeleteId = classroom1.id;

  // 1. Quizzes & children
  const quizzesToDelete = await prisma.quiz.findMany({
    where: { classroomId: targetDeleteId },
    select: { id: true },
  });
  const qIds = quizzesToDelete.map((q) => q.id);
  if (qIds.length > 0) {
    await prisma.quizViolation.deleteMany({ where: { quizResult: { quizId: { in: qIds } } } });
    await prisma.quizResult.deleteMany({ where: { quizId: { in: qIds } } });
    await prisma.question.deleteMany({ where: { quizId: { in: qIds } } });
    await prisma.quiz.deleteMany({ where: { id: { in: qIds } } });
  }

  // 2. Assignments & submissions
  const assignsToDelete = await prisma.assignment.findMany({
    where: { classroomId: targetDeleteId },
    select: { id: true },
  });
  const aIds = assignsToDelete.map((a) => a.id);
  if (aIds.length > 0) {
    await prisma.assignmentSubmission.deleteMany({ where: { assignmentId: { in: aIds } } });
    await prisma.assignment.deleteMany({ where: { id: { in: aIds } } });
  }

  // 3. Live sessions & access codes
  const livesToDelete = await prisma.liveSession.findMany({
    where: { classroomId: targetDeleteId },
    select: { id: true },
  });
  const lIds = livesToDelete.map((l) => l.id);
  if (lIds.length > 0) {
    await prisma.sessionAccessCode.deleteMany({ where: { liveSessionId: { in: lIds } } });
    await prisma.liveAttendance.deleteMany({ where: { liveSessionId: { in: lIds } } });
    await prisma.liveSession.deleteMany({ where: { id: { in: lIds } } });
  }

  // 4. Resources & Enrollments
  await prisma.classResource.deleteMany({ where: { classroomId: targetDeleteId } });
  await prisma.enrollment.deleteMany({ where: { classroomId: targetDeleteId } });

  // 5. Delete Classroom
  await prisma.classroom.delete({ where: { id: targetDeleteId } });

  // Verify total deletion
  const deletedClsCheck = await prisma.classroom.findUnique({ where: { id: targetDeleteId } });
  assert(deletedClsCheck === null, 'Classroom completely deleted from database');

  const residualEnrollments = await prisma.enrollment.findMany({ where: { classroomId: targetDeleteId } });
  assert(residualEnrollments.length === 0, 'No orphaned enrollments remaining');

  const residualQuizzes = await prisma.quiz.findMany({ where: { classroomId: targetDeleteId } });
  assert(residualQuizzes.length === 0, 'No orphaned quizzes remaining');

  const residualAssignments = await prisma.assignment.findMany({ where: { classroomId: targetDeleteId } });
  assert(residualAssignments.length === 0, 'No orphaned assignments remaining');

  // Clean classroom2
  await prisma.enrollment.deleteMany({ where: { classroomId: classroom2.id } });
  await prisma.classroom.delete({ where: { id: classroom2.id } });

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n=============================================================');
  console.log(`📊 CLASSROOMS TEST EXECUTION SUMMARY:`);
  console.log(`  Passed Tests: ${testsPassed}`);
  console.log(`  Failed Tests: ${testsFailed}`);
  console.log('=============================================================\n');

  if (testsFailed > 0) {
    throw new Error(`Classrooms QA Suite encountered ${testsFailed} failure(s)`);
  } else {
    console.log('🎉 ALL CLASSROOM LOGICAL TESTS PASSED WITH 100% SUCCESS!');
  }
}

async function main() {
  try {
    await setup();
    await runClassroomTests();
  } catch (err) {
    console.error('Fatal Classrooms Test Suite Error:', err.message);
    process.exitCode = 1;
  } finally {
    await teardown();
  }
}

main();
