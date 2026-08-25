const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial production data for Vercel/Local deployment...');

  // 1. Teacher Account
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@school.com' },
    update: {
      password: 'teacher123',
      name: 'سارة أحمد',
      role: 'TEACHER',
      phone: '01011112222',
    },
    create: {
      name: 'سارة أحمد',
      email: 'teacher@school.com',
      password: 'teacher123',
      role: 'TEACHER',
      phone: '01011112222',
    },
  });

  // 2. Student 1 (أحمد محمد علي)
  const student1 = await prisma.user.upsert({
    where: { studentCode: 'STU-001' },
    update: {
      password: '1234',
      name: 'أحمد محمد علي',
      role: 'STUDENT',
      phone: '01099998888',
      parentPhone: '01012345678',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'أحمد محمد علي',
      studentCode: 'STU-001',
      password: '1234',
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
      password: '1234',
      name: 'زياد طارق إبراهيم',
      role: 'STUDENT',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
    },
    create: {
      name: 'زياد طارق إبراهيم',
      studentCode: 'STU-777',
      password: '1234',
      role: 'STUDENT',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
    },
  });

  // 4. Classrooms
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
  const assignment = await prisma.assignment.upsert({
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

  // 7. Quiz & Questions
  const quiz = await prisma.quiz.upsert({
    where: { id: 'sample-quiz-1' },
    update: {},
    create: {
      id: 'sample-quiz-1',
      title: 'الاختبار الأسبوعي الأول - الجبر والإحصاء',
      type: 'WEEKLY',
      duration: 20,
      passingScore: 60,
      classroomId: classroom.id,
      isPublished: true,
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

  // 8. Quiz Results for students
  await prisma.quizResult.upsert({
    where: { id: `result-${student1.id}-1` },
    update: {
      totalScore: 18,
      maxScore: 20,
      autoScore: 18,
      isPassed: true,
      status: 'AUTO_GRADED',
    },
    create: {
      id: `result-${student1.id}-1`,
      quizId: quiz.id,
      studentId: student1.id,
      totalScore: 18,
      maxScore: 20,
      autoScore: 18,
      isPassed: true,
      status: 'AUTO_GRADED',
      startedAt: new Date(Date.now() - 3600000),
      submittedAt: new Date(Date.now() - 1800000),
    },
  });

  // 9. Live Session
  const liveSession = await prisma.liveSession.upsert({
    where: { roomCode: 'LIVE-MATH1' },
    update: {},
    create: {
      title: 'مراجعة شاملة للوحدة الأولى والبث المباشر',
      roomCode: 'LIVE-MATH1',
      isActive: true,
      classroomId: classroom.id,
      targetGrade: 'الصف الثالث الإعدادي',
    },
  });

  // 10. Live Attendance
  await prisma.liveAttendance.upsert({
    where: {
      sessionId_studentId: {
        sessionId: liveSession.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      sessionId: liveSession.id,
      studentId: student1.id,
      joinedAt: new Date(),
      durationMin: 45,
    },
  });

  // 11. Sample PDF resources
  const existingResources = await prisma.classResource.count({ where: { classroomId: classroom.id } });
  if (existingResources === 0) {
    await prisma.classResource.createMany({
      data: [
        {
          title: 'ملخص الوحدة الأولى – المعادلات الخطية',
          type: 'SUMMARY',
          url: '#',
          description: 'ملخص شامل لأسلوب الحل ونماذج الأسئلة',
          classroomId: classroom.id,
        },
        {
          title: 'نموذج اختبار أسبوعي – الجبر',
          type: 'PDF',
          url: '#',
          description: 'نموذج امتحان بالإجابات النموذجية',
          classroomId: classroom.id,
        },
        {
          title: 'حل واجب معادلات الدرجة الأولى',
          type: 'HOMEWORK_SOLUTION',
          url: '#',
          description: 'الحل التفصيلي لتمارين صفحة 45',
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
