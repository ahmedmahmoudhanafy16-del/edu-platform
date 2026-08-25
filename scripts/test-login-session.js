const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create or ensure Student 2 exists
  const student2 = await prisma.user.upsert({
    where: { studentCode: 'STU-777' },
    update: {},
    create: {
      name: 'زياد طارق إبراهيم',
      studentCode: 'STU-777',
      password: '1234',
      phone: '01055554444',
      parentPhone: '01099998888',
      grade: 'الصف الثالث الإعدادي',
      role: 'STUDENT',
    },
  });

  console.log('Created/Verified Student 2:', student2.name, 'Code:', student2.studentCode, 'ID:', student2.id);

  // Verify finding student by code
  const foundStudent = await prisma.user.findFirst({
    where: {
      role: 'STUDENT',
      OR: [
        { studentCode: 'STU-777' },
        { phone: 'STU-777' },
      ],
    },
  });

  console.log('Login Query for STU-777 resolved EXACT user:', foundStudent?.name, 'ID:', foundStudent?.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
