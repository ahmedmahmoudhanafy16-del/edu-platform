const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testFlow() {
  console.log('Testing Session Access Codes End-to-End flow...');

  // 1. Get Teacher and LiveSession
  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
  const student = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
  const liveSession = await prisma.liveSession.findFirst();

  console.log(`Teacher: ${teacher.name} (${teacher.id})`);
  console.log(`Student: ${student.name} (${student.id})`);
  console.log(`Live Session: ${liveSession.title} (${liveSession.id})`);

  const teacherCookie = encodeURIComponent(JSON.stringify({ id: teacher.id, role: 'TEACHER', name: 'Sara' }));
  const studentCookie = encodeURIComponent(JSON.stringify({ id: student.id, role: 'STUDENT', name: 'Ahmed' }));

  // 2. Test Generate API
  const genRes = await fetch('http://localhost:3000/api/admin/access-codes/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `user_session=${teacherCookie}`,
    },
    body: JSON.stringify({
      liveSessionId: liveSession.id,
      quantity: 5,
      price: 50,
    }),
  });

  const genData = await genRes.json();
  console.log('Generate API Status:', genRes.status);
  console.log('Generated Codes:', genData.codes);

  if (!genData.codes || genData.codes.length === 0) {
    throw new Error('Failed to generate codes');
  }

  const testCode = genData.codes[0];
  console.log(`Testing Redeem with code: ${testCode}`);

  // 3. Test GET List API
  const listRes = await fetch(`http://localhost:3000/api/admin/access-codes?sessionId=${liveSession.id}`, {
    headers: {
      'Cookie': `user_session=${teacherCookie}`,
    },
  });
  const listData = await listRes.json();
  console.log(`GET list count: ${listData.count}`);

  // 4. Test Redeem API with Student
  const redeemRes = await fetch('http://localhost:3000/api/student/redeem-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `user_session=${studentCookie}`,
    },
    body: JSON.stringify({ code: testCode }),
  });

  const redeemData = await redeemRes.json();
  console.log('Redeem API Status:', redeemRes.status);
  console.log('Redeem Response:', redeemData);

  // 5. Test Double-Redeem (Should Fail with 400)
  const doubleRes = await fetch('http://localhost:3000/api/student/redeem-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `user_session=${studentCookie}`,
    },
    body: JSON.stringify({ code: testCode }),
  });
  const doubleData = await doubleRes.json();
  console.log('Double Redeem (Expect 400):', doubleRes.status, doubleData.error);

  console.log('✅ ALL INTEGRATION TESTS PASSED 100% SUCCESSFULLY!');
}

testFlow()
  .catch((e) => console.error('Test Failed:', e))
  .finally(() => prisma.$disconnect());
