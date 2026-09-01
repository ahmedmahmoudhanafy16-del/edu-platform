const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial production data for Vercel/Local deployment...');

  const teacherHash = bcrypt.hashSync('teacher123', 10);
  const defaultStudentPin = '1234';
  const defaultStudentHash = bcrypt.hashSync(defaultStudentPin, 10);

  // 1. Teacher Account
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {
      password: teacherHash,
      passwordHash: teacherHash,
      name: 'أ/ سارة أحمد',
      role: 'TEACHER',
      phone: '01011112222',
    },
    create: {
      name: 'أ/ سارة أحمد',
      email: 'teacher@school.com',
      password: teacherHash,
      passwordHash: teacherHash,
      role: 'TEACHER',
      phone: '01011112222',
    },
  });

  // 2. Student 1 (أحمد محمد علي) - PIN: 1234
  const student1 = await prisma.user.upsert({
    where: { studentCode: 'STU-001' },
    update: {
      password: defaultStudentHash,
      passwordHash: defaultStudentHash,
      defaultPassword: defaultStudentPin,
      name: 'أحمد محمد علي',
      role: 'STUDENT',
      phone: '01099998888',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'أحمد محمد علي',
      studentCode: 'STU-001',
      password: defaultStudentHash,
      passwordHash: defaultStudentHash,
      defaultPassword: defaultStudentPin,
      role: 'STUDENT',
      phone: '01099998888',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 2.5 Student STU-633 (أحمد محمود أحمد) - PIN: 1234
  const student633 = await prisma.user.upsert({
    where: { studentCode: 'STU-633' },
    update: {
      password: defaultStudentHash,
      passwordHash: defaultStudentHash,
      defaultPassword: defaultStudentPin,
      name: 'أحمد محمود أحمد',
      role: 'STUDENT',
      phone: '01012345678',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'أحمد محمود أحمد',
      studentCode: 'STU-633',
      password: defaultStudentHash,
      passwordHash: defaultStudentHash,
      defaultPassword: defaultStudentPin,
      role: 'STUDENT',
      phone: '01012345678',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 3. Student 2 (زياد طارق) - PIN: 1234
  const student2 = await prisma.user.upsert({
    where: { studentCode: 'STU-777' },
    update: {
      password: defaultStudentHash,
      passwordHash: defaultStudentHash,
      defaultPassword: defaultStudentPin,
      name: 'زياد طارق إبراهيم',
      role: 'STUDENT',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'زياد طارق إبراهيم',
      studentCode: 'STU-777',
      password: defaultStudentHash,
      passwordHash: defaultStudentHash,
      defaultPassword: defaultStudentPin,
      role: 'STUDENT',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // Reset all student accounts in DB to clean '1234'
  try {
    await prisma.user.updateMany({
      where: { role: 'STUDENT' },
      data: {
        password: defaultStudentHash,
        passwordHash: defaultStudentHash,
        defaultPassword: defaultStudentPin,
      },
    });
  } catch (e) {}

  // 4. Sample Classrooms
  const class1 = await prisma.classroom.upsert({
    where: { id: 'class-math-3a' },
    update: {
      name: 'فصل الرياضيات (3ع - أ)',
      subject: 'رياضيات',
      code: 'MATH3A',
      teacherId: teacher.id,
    },
    create: {
      id: 'class-math-3a',
      name: 'فصل الرياضيات (3ع - أ)',
      subject: 'رياضيات',
      code: 'MATH3A',
      teacherId: teacher.id,
    },
  });

  const class2 = await prisma.classroom.upsert({
    where: { id: 'class-math-3b' },
    update: {
      name: 'فصل الرياضيات (3ع - ب)',
      subject: 'رياضيات',
      code: 'MATH3B',
      teacherId: teacher.id,
    },
    create: {
      id: 'class-math-3b',
      name: 'فصل الرياضيات (3ع - ب)',
      subject: 'رياضيات',
      code: 'MATH3B',
      teacherId: teacher.id,
    },
  });

  // 5. Enrollments
  await prisma.enrollment.upsert({
    where: {
      userId_classroomId: {
        userId: student1.id,
        classroomId: class1.id,
      },
    },
    update: {},
    create: {
      userId: student1.id,
      classroomId: class1.id,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_classroomId: {
        userId: student633.id,
        classroomId: class1.id,
      },
    },
    update: {},
    create: {
      userId: student633.id,
      classroomId: class1.id,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_classroomId: {
        userId: student2.id,
        classroomId: class1.id,
      },
    },
    update: {},
    create: {
      userId: student2.id,
      classroomId: class1.id,
    },
  });

  // 6. Sample Quiz
  const quiz = await prisma.quiz.upsert({
    where: { id: 'sample-quiz-1' },
    update: {
      title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
      type: 'WEEKLY',
      duration: 20,
      passingScore: 60,
      isPublished: true,
      accessCode: 'MATH2026',
      classroomId: class1.id,
    },
    create: {
      id: 'sample-quiz-1',
      title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
      type: 'WEEKLY',
      duration: 20,
      passingScore: 60,
      isPublished: true,
      accessCode: 'MATH2026',
      classroomId: class1.id,
    },
  });

  // 7. Questions
  await prisma.question.upsert({
    where: { id: 'sample-q1' },
    update: {
      text: 'إذا كان س + 3 = 7، فإن قيمة 2س تساوي:',
      type: 'MCQ',
      options: JSON.stringify(['6', '8', '10', '12']),
      correctAnswer: '8',
      maxScore: 5,
      order: 1,
      quizId: quiz.id,
    },
    create: {
      id: 'sample-q1',
      text: 'إذا كان س + 3 = 7، فإن قيمة 2س تساوي:',
      type: 'MCQ',
      options: JSON.stringify(['6', '8', '10', '12']),
      correctAnswer: '8',
      maxScore: 5,
      order: 1,
      quizId: quiz.id,
    },
  });

  await prisma.question.upsert({
    where: { id: 'sample-q2' },
    update: {
      text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:',
      type: 'MCQ',
      options: JSON.stringify(['{3}', '{-3}', '{3, -3}', '∅']),
      correctAnswer: '{3, -3}',
      maxScore: 5,
      order: 2,
      quizId: quiz.id,
    },
    create: {
      id: 'sample-q2',
      text: 'مجموعة حل المعادلة س² - 9 = 0 في ح هي:',
      type: 'MCQ',
      options: JSON.stringify(['{3}', '{-3}', '{3, -3}', '∅']),
      correctAnswer: '{3, -3}',
      maxScore: 5,
      order: 2,
      quizId: quiz.id,
    },
  });

  // 8. Sample Assignment
  await prisma.assignment.upsert({
    where: { id: 'sample-hw-1' },
    update: {
      title: 'واجب الدرس الأول: الدوال الخطية',
      description: 'حل تمارين كتاب الوزارة صفحة 14 و 15 كاملة وإرفاق صورة للحل.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      classroomId: class1.id,
    },
    create: {
      id: 'sample-hw-1',
      title: 'واجب الدرس الأول: الدوال الخطية',
      description: 'حل تمارين كتاب الوزارة صفحة 14 و 15 كاملة وإرفاق صورة للحل.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      classroomId: class1.id,
    },
  });

  console.log('✅ Production Seeding Completed with Clean 1234 Student Passwords!');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
