const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.user.updateMany({
    where: { role: 'STUDENT' },
    data: {
      grade: 'الصف الثالث الإعدادي',
      parentPhone: '01012345678',
    },
  });
  console.log(`Updated ${count.count} student(s) with grade 'الصف الثالث الإعدادي' and parentPhone '01012345678'`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
