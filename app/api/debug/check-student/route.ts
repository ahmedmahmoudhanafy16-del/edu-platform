import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: {
      id: true,
      name: true,
      studentCode: true,
      password: true,
      defaultPassword: true,
    }
  });

  const results = await Promise.all(
    students.map(async (s) => {
      let plainMatch = s.password === '1234';
      let bcryptMatch = false;
      try {
        bcryptMatch = await bcrypt.compare('1234', s.password || '');
      } catch {}

      return {
        name: s.name,
        studentCode: s.studentCode,
        defaultPassword: s.defaultPassword,
        passwordFirst20Chars: s.password?.substring(0, 20),
        isBcryptHash: s.password?.startsWith('$2'),
        plainTextMatch_1234: plainMatch,
        bcryptMatch_1234: bcryptMatch,
      };
    })
  );

  return NextResponse.json(results);
}
