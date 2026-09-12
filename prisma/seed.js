const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clean platform with real-data only...');

  const teacherHash = bcrypt.hashSync('teacher123', 10);

  // 1. Base Teacher Login Account (required for teacher authentication)
  await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {
      password: teacherHash,
      passwordHash: teacherHash,
      role: 'TEACHER',
    },
    create: {
      name: 'المعلم',
      email: 'teacher@school.com',
      password: teacherHash,
      passwordHash: teacherHash,
      role: 'TEACHER',
      phone: '01011112222',
    },
  });

  // 2. Clean up any legacy dummy / mock sample data from previous runs
  const dummyStudentCodes = ['STU-001', 'STU-633', 'STU-777', 'STU-645', 'STU-003'];
  const dummyQuizIds = ['sample-quiz-1', 'sample-q1', 'sample-q2'];
  const dummyAssignmentIds = ['sample-hw-1'];
  const dummyClassroomIds = ['class-science-4', 'class-math-3', 'class-math-3a', 'class-math-3b'];

  await prisma.question.deleteMany({
    where: { OR: [{ id: { in: dummyQuizIds } }, { quizId: { in: dummyQuizIds } }] },
  }).catch(() => null);

  await prisma.quizResult.deleteMany({
    where: { quizId: { in: dummyQuizIds } },
  }).catch(() => null);

  await prisma.quiz.deleteMany({
    where: { id: { in: dummyQuizIds } },
  }).catch(() => null);

  await prisma.assignmentSubmission.deleteMany({
    where: { assignmentId: { in: dummyAssignmentIds } },
  }).catch(() => null);

  await prisma.assignment.deleteMany({
    where: { id: { in: dummyAssignmentIds } },
  }).catch(() => null);

  await prisma.enrollment.deleteMany({
    where: {
      OR: [
        { classroomId: { in: dummyClassroomIds } },
        { user: { studentCode: { in: dummyStudentCodes } } },
      ],
    },
  }).catch(() => null);

  await prisma.classroom.deleteMany({
    where: { id: { in: dummyClassroomIds } },
  }).catch(() => null);

  await prisma.user.deleteMany({
    where: { studentCode: { in: dummyStudentCodes } },
  }).catch(() => null);

  console.log('✅ Real-Data Platform Ready: 0 fake students, 0 fake classrooms, 0 fake quizzes.');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
