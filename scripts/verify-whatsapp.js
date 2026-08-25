const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true, name: true, grade: true, parentPhone: true },
  });
  console.log('Students in database:', JSON.stringify(students, null, 2));

  // Test create a notification log
  const testLog = await prisma.notificationLog.create({
    data: {
      recipient: '201012345678',
      type: 'LIVE_SESSION_ALERT',
      status: 'SENT',
      content: 'تنبيه عاجل: بث مباشر جاري الآن! للصف الثالث الإعدادي',
      studentId: students[0]?.id || null,
    },
  });
  console.log('Successfully recorded test NotificationLog:', testLog);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
