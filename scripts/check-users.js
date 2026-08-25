const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('All Users in DB:');
  for (const u of users) {
    console.log(`- ID: ${u.id} | Name: ${u.name} | Role: ${u.role} | Code: ${u.studentCode} | Phone: ${u.phone} | Password: ${u.password}`);
  }
}

main().finally(() => prisma.$disconnect());
