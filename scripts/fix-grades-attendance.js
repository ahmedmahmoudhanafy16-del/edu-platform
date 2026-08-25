const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding and verifying student grades & attendance...');

  const students = await prisma.user.findMany({ where: { role: 'STUDENT' } });
  const quizzes = await prisma.quiz.findMany({ take: 3 });
  const liveSessions = await prisma.liveSession.findMany({ take: 3 });

  for (const s of students) {
    // 1. Seed realistic QuizResults with non-zero totalScore
    for (let i = 0; i < quizzes.length; i++) {
      const q = quizzes[i];
      const maxScore = q.passingScore > 0 ? 20 : 20;
      const totalScore = i === 0 ? 19 : i === 1 ? 17 : 18; // 95%, 85%, 90%
      const percentage = Math.round((totalScore / maxScore) * 100);
      const isPassed = percentage >= q.passingScore;

      await prisma.quizResult.upsert({
        where: { id: `result-${s.id}-${q.id}` },
        update: {
          totalScore,
          maxScore,
          autoScore: totalScore,
          isPassed,
          status: 'AUTO_GRADED',
        },
        create: {
          id: `result-${s.id}-${q.id}`,
          quizId: q.id,
          studentId: s.id,
          totalScore,
          maxScore,
          autoScore: totalScore,
          isPassed,
          status: 'AUTO_GRADED',
          startedAt: new Date(Date.now() - 3600000 * (i + 1)),
          submittedAt: new Date(Date.now() - 1800000 * (i + 1)),
        },
      });
    }

    // 2. Seed realistic LiveAttendance
    for (const session of liveSessions) {
      await prisma.liveAttendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: s.id,
          },
        },
        update: {
          durationMin: 50,
        },
        create: {
          sessionId: session.id,
          studentId: s.id,
          joinedAt: new Date(),
          durationMin: 50,
        },
      });
    }
  }

  console.log('Successfully seeded non-zero grades and live attendance for all students!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
