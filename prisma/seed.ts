import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {},
    create: {
      name: 'سارة أحمد',
      email: 'teacher@school.com',
      password: 'teacher123',
      role: 'TEACHER',
      phone: '01011112222',
    },
  });

  // 2. Student
  const student = await prisma.user.upsert({
    where: { studentCode: 'STU-001' },
    update: {},
    create: {
      name: 'أحمد محمد علي',
      studentCode: 'STU-001',
      password: '1234',
      role: 'STUDENT',
      phone: '01099998888',
    },
  });

  // 3. Classroom
  const classroom = await prisma.classroom.upsert({
    where: { code: 'MATH-101' },
    update: {},
    create: {
      name: 'الصف الثالث الإعدادي - رياضيات',
      subject: 'الرياضيات والجبر',
      code: 'MATH-101',
      teacherId: teacher.id,
    },
  });

  // 4. Enrollment
  await prisma.enrollment.upsert({
    where: {
      userId_classroomId: {
        userId: student.id,
        classroomId: classroom.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      classroomId: classroom.id,
    },
  });

  // 5. Assignment
  const assignment = await prisma.assignment.create({
    data: {
      title: 'حل تمارين معادلات الدرجة الأولى',
      description: 'قم بحل المسائل في الصفحة رقم 45 من كتاب التدريبات واكتب خطوات الحل كاملة.',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxScore: 10,
      classroomId: classroom.id,
    },
  });

  // 6. Quiz with MCQ + Essay Questions
  const quiz = await prisma.quiz.create({
    data: {
      title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
      type: 'WEEKLY',
      duration: 20,
      passingScore: 60,
      classroomId: classroom.id,
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

  // 7. Live Session
  await prisma.liveSession.upsert({
    where: { roomCode: 'LIVE-MATH1' },
    update: {},
    create: {
      title: 'مراجعة شاملة للوحدة الأولى والبث المباشر',
      roomCode: 'LIVE-MATH1',
      isActive: true,
      classroomId: classroom.id,
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
