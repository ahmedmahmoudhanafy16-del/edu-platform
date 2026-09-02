const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial production data for Vercel/Local deployment...');

  const teacherHash = bcrypt.hashSync('teacher123', 10);
  const pin001 = '4829';
  const pin633 = '9715';
  const pin777 = '6341';
  const student1Hash = bcrypt.hashSync(pin001, 10);
  const student633Hash = bcrypt.hashSync(pin633, 10);
  const student777Hash = bcrypt.hashSync(pin777, 10);

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

  // 2. Student 1 (أحمد محمد علي) - PIN: 4829
  const student1 = await prisma.user.upsert({
    where: { studentCode: 'STU-001' },
    update: {
      password: student1Hash,
      passwordHash: student1Hash,
      defaultPassword: pin001,
      name: 'أحمد محمد علي',
      role: 'STUDENT',
      phone: '01099998888',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'أحمد محمد علي',
      studentCode: 'STU-001',
      password: student1Hash,
      passwordHash: student1Hash,
      defaultPassword: pin001,
      role: 'STUDENT',
      phone: '01099998888',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 2.5 Student STU-633 (أحمد محمود أحمد) - PIN: 9715
  const student633 = await prisma.user.upsert({
    where: { studentCode: 'STU-633' },
    update: {
      password: student633Hash,
      passwordHash: student633Hash,
      defaultPassword: pin633,
      name: 'أحمد محمود أحمد',
      role: 'STUDENT',
      phone: '01012345678',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'أحمد محمود أحمد',
      studentCode: 'STU-633',
      password: student633Hash,
      passwordHash: student633Hash,
      defaultPassword: pin633,
      role: 'STUDENT',
      phone: '01012345678',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 3. Student 2 (زياد طارق) - PIN: 6341
  const student2 = await prisma.user.upsert({
    where: { studentCode: 'STU-777' },
    update: {
      password: student777Hash,
      passwordHash: student777Hash,
      defaultPassword: pin777,
      name: 'زياد طارق إبراهيم',
      role: 'STUDENT',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'زياد طارق إبراهيم',
      studentCode: 'STU-777',
      password: student777Hash,
      passwordHash: student777Hash,
      defaultPassword: pin777,
      role: 'STUDENT',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 3.5 Student 3 (علي حسين) - PIN: 5192
  const pin645 = '5192';
  const student645Hash = bcrypt.hashSync(pin645, 10);
  const student645 = await prisma.user.upsert({
    where: { studentCode: 'STU-645' },
    update: {
      password: student645Hash,
      passwordHash: student645Hash,
      defaultPassword: pin645,
      name: 'علي حسين',
      role: 'STUDENT',
      phone: '01066667777',
      parentPhone: '01066667777',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'علي حسين',
      studentCode: 'STU-645',
      password: student645Hash,
      passwordHash: student645Hash,
      defaultPassword: pin645,
      role: 'STUDENT',
      phone: '01066667777',
      parentPhone: '01066667777',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 3.6 Student STU-003 (أحمد محمود) - PIN: 7490 (also accepts 1234, 3293)
  const pin003 = '7490';
  const student003Hash = bcrypt.hashSync(pin003, 10);
  const student003 = await prisma.user.upsert({
    where: { studentCode: 'STU-003' },
    update: {
      password: student003Hash,
      passwordHash: student003Hash,
      defaultPassword: pin003,
      name: 'أحمد محمود',
      role: 'STUDENT',
      phone: '01550128663',
      parentPhone: '0118848617',
      grade: 'الصف الرابع الابتدائي',
    },
    create: {
      name: 'أحمد محمود',
      studentCode: 'STU-003',
      password: student003Hash,
      passwordHash: student003Hash,
      defaultPassword: pin003,
      role: 'STUDENT',
      phone: '01550128663',
      parentPhone: '0118848617',
      grade: 'الصف الرابع الابتدائي',
    },
  });

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
