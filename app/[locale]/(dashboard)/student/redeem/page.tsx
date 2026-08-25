import { getAuthenticatedStudent } from '@/lib/auth';
import { StudentRedeemClient } from './StudentRedeemClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StudentRedeemPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';

  const student = await getAuthenticatedStudent();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12" dir="rtl">
      <StudentRedeemClient
        locale={locale}
        studentName={student?.name || 'الطالب'}
      />
    </div>
  );
}
