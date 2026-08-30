const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial production data for Vercel/Local deployment...');

  const teacherHash = bcrypt.hashSync('teacher123', 10);
  const studentHash = bcrypt.hashSync('1234', 10);

  // 1. Teacher Account
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {
      passwordHash: teacherHash,
      name: 'أ/ سارة أحمد',
      role: 'TEACHER',
      phone: '01011112222',
    },
    create: {
      name: 'أ/ سارة أحمد',
      email: 'teacher@school.com',
      passwordHash: teacherHash,
      role: 'TEACHER',
      phone: '01011112222',
    },
  });

  // 2. Student 1 (أحمد محمد علي)
  const student1 = await prisma.user.upsert({
    where: { studentCode: 'STU-001' },
    update: {
      passwordHash: studentHash,
      name: 'أحمد محمد علي',
      role: 'STUDENT',
      phone: '01099998888',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'أحمد محمد علي',
      studentCode: 'STU-001',
      passwordHash: studentHash,
      role: 'STUDENT',
      phone: '01099998888',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 3. Student 2 (زياد طارق)
  const student2 = await prisma.user.upsert({
    where: { studentCode: 'STU-777' },
    update: {
      passwordHash: studentHash,
      name: 'زياد طارق إبراهيم',
      role: 'STUDENT',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'زياد طارق إبراهيم',
      studentCode: 'STU-777',
      passwordHash: studentHash,
      role: 'STUDENT',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 4. Classrooms
  const classroomsList = await prisma.classroom.findMany({ take: 1 });
  let classroom = classroomsList[0];
  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: {
        id: 'class-math-3',
        name: 'الصف الثالث الإعدادي - رياضيات',
        subject: 'الرياضيات والجبر',
        grade: 'PREP_3',
        teacherId: teacher.id,
      },
    });
  }

  // 5. Enrollments
  await prisma.enrollment.upsert({
    where: {
      userId_classroomId: {
        userId: student1.id,
        classroomId: classroom.id,
      },
    },
    update: {},
    create: {
      userId: student1.id,
      classroomId: classroom.id,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      userId_classroomId: {
        userId: student2.id,
        classroomId: classroom.id,
      },
    },
    update: {},
    create: {
      userId: student2.id,
      classroomId: classroom.id,
    },
  });

  // 6. Assignment
  await prisma.assignment.upsert({
    where: { id: 'sample-assignment-1' },
    update: {},
    create: {
      id: 'sample-assignment-1',
      title: 'حل تمارين معادلات الدرجة الأولى',
      description: 'قم بحل المسائل في الصفحة رقم 45 من كتاب التدريبات واكتب خطوات الحل كاملة.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 10,
      classroomId: classroom.id,
    },
  });

  // 7. Quiz & Questions (Passcode Protected)
  await prisma.quiz.upsert({
    where: { id: 'sample-quiz-1' },
    update: {
      accessCode: 'QUIZ-MATH-2026',
      isCodeRequired: true,
    },
    create: {
      id: 'sample-quiz-1',
      title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
      type: 'WEEKLY',
      duration: 20,
      passingScore: 60,
      classroomId: classroom.id,
      isPublished: true,
      accessCode: 'QUIZ-MATH-2026',
      isCodeRequired: true,
      questions: {
        create: [
          {
            text: 'إذا كانت س + 5 = 12، فإن قيمة س تساوي:',
            type: 'MCQ',
            options: JSON.stringify(['5', '7', '12', '17']),
            correctAnswer: '7',
            maxScore: 5,
            order: 1,
            difficulty: 'EASY',
          },
          {
            text: 'المعادلة 2س - 4 = 10، حل المعادلة هو:',
            type: 'MCQ',
            options: JSON.stringify(['3', '5', '7', '8']),
            correctAnswer: '7',
            maxScore: 5,
            order: 2,
            difficulty: 'MEDIUM',
          },
          {
            text: 'اشرح بالخطوات كيفية حل نظام من معادلتين خطيتين بطريقة الحذف مع ذكر مثال بسيط.',
            type: 'ESSAY',
            options: '[]',
            correctAnswer: null,
            maxScore: 10,
            order: 3,
            difficulty: 'HARD',
          },
        ],
      },
    },
  });

  // 8. Live Session
  const liveSession = await prisma.liveSession.upsert({
    where: { roomCode: 'LIVE-MATH1' },
    update: {},
    create: {
      title: 'مراجعة شاملة للوحدة الأولى والبث المباشر',
      roomCode: 'LIVE-MATH1',
      isActive: true,
      classroomId: classroom.id,
    },
  });

  // 9. Class Resource
  const existingResources = await prisma.classResource.count({ where: { classroomId: classroom.id } });
  if (existingResources === 0) {
    await prisma.classResource.createMany({
      data: [
        {
          title: 'ملخص الوحدة الأولى – المعادلات الخطية',
          type: 'SUMMARY',
          fileUrl: '#',
          classroomId: classroom.id,
        },
        {
          title: 'نموذج اختبار أسبوعي – الجبر',
          type: 'PDF',
          fileUrl: '#',
          classroomId: classroom.id,
        },
      ],
    });
  }

  console.log('✅ Seeding completed successfully on build!');
}

main()
  .catch((e) => {
    console.error('Seed Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
