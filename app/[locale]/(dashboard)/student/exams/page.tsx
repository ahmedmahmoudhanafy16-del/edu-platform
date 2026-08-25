import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function StudentExamsAliasPage({
  params,
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || 'ar';
  redirect(`/${locale}/student/quizzes`);
}
