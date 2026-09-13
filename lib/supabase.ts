import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://mttmrsltkmcpkgrxanaw.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

/**
 * Returns true if a real Supabase Anon Key has been configured in environment variables.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY_HERE' &&
    (supabaseAnonKey.startsWith('ey') || supabaseAnonKey.startsWith('sb_'))
  );
}

// Fallback token to allow Next.js build-time static generation without crashing
const effectiveKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

/**
 * Central authoritative Supabase client for database queries, exams, and authentication.
 */
export const supabase = createClient(supabaseUrl, effectiveKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Server-side elevated client (if service role key is provided), otherwise falls back to standard client.
 */
export function getSupabaseServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (serviceRoleKey && (serviceRoleKey.startsWith('ey') || serviceRoleKey.startsWith('sb_'))) {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabase;
}

/**
 * Checks whether a student has already completed a specific exam in Supabase.
 */
export async function checkStudentExamAttempt(studentId: string, examId: string) {
  if (!isSupabaseConfigured() || !studentId || !examId) return null;
  try {
    const { data, error } = await supabase
      .from('exam_attempts')
      .select('id, student_id, exam_id, final_score, status, completed_at, student_answers')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] checkStudentExamAttempt notice:', error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.warn('[Supabase] checkStudentExamAttempt error:', err?.message);
    return null;
  }
}

/**
 * Inserts or updates an exam and its questions into Supabase.
 */
export async function syncExamToSupabase(examData: {
  id?: string;
  title: string;
  description?: string;
  duration_minutes: number;
  passing_score: number;
  total_marks: number;
  is_published?: boolean;
  questions?: Array<{
    question_text: string;
    options: string[];
    correct_answer?: string;
    score: number;
    order_index: number;
  }>;
}) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: exam, error: examErr } = await supabase
      .from('exams')
      .upsert({
        ...(examData.id ? { id: examData.id } : {}),
        title: examData.title,
        description: examData.description || '',
        duration_minutes: examData.duration_minutes,
        passing_score: examData.passing_score,
        total_marks: examData.total_marks,
        is_published: examData.is_published !== false,
      })
      .select('id')
      .maybeSingle();

    if (examErr || !exam?.id) {
      console.warn('[Supabase] syncExamToSupabase error:', examErr?.message);
      return null;
    }

    if (examData.questions && examData.questions.length > 0) {
      // Delete old questions if updating
      await supabase.from('questions').delete().eq('exam_id', exam.id);

      const questionsToInsert = examData.questions.map((q, idx) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer || '',
        score: q.score || 1,
        order_index: q.order_index || idx + 1,
      }));

      await supabase.from('questions').insert(questionsToInsert);
    }

    return exam;
  } catch (err: any) {
    console.warn('[Supabase] syncExamToSupabase fatal:', err?.message);
    return null;
  }
}

/**
 * Inserts or updates a student into Supabase students table.
 */
export async function syncStudentToSupabase(studentData: {
  student_code: string;
  full_name: string;
  phone?: string;
  parent_phone?: string;
  grade_level?: string;
  password_hash: string;
  is_active?: boolean;
}) {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('students')
      .upsert({
        student_code: studentData.student_code,
        full_name: studentData.full_name,
        phone: studentData.phone || null,
        parent_phone: studentData.parent_phone || null,
        grade_level: studentData.grade_level || null,
        password_hash: studentData.password_hash,
        is_active: studentData.is_active !== false,
      }, { onConflict: 'student_code' })
      .select('id, student_code')
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] syncStudentToSupabase notice:', error.message);
    }
    return data;
  } catch (err: any) {
    console.warn('[Supabase] syncStudentToSupabase fatal:', err?.message);
    return null;
  }
}

/**
 * Retrieves the teacher profile from Supabase by email or phone.
 */
export async function getTeacherFromSupabase(identifier: string) {
  if (!isSupabaseConfigured() || !identifier) return null;
  const clean = identifier.trim().toLowerCase();
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .or(`email.ilike.${clean},phone.eq.${clean}`)
      .limit(1)
      .maybeSingle();

    if (error) {
      // If table doesn't exist yet, return null gracefully
      return null;
    }
    return data;
  } catch (err: any) {
    return null;
  }
}

/**
 * Updates teacher profile name, email, and phone in Supabase.
 */
export async function updateTeacherProfileInSupabase(
  id: string,
  profile: { name: string; email?: string; phone?: string }
) {
  if (!isSupabaseConfigured()) return null;
  try {
    const client = getSupabaseServerClient();
    let query = client.from('teachers').update({
      name: profile.name,
      ...(profile.email ? { email: profile.email.toLowerCase() } : {}),
      phone: profile.phone || null,
      updated_at: new Date().toISOString(),
    });

    if (id && id !== 'teacher-admin-1') {
      query = query.eq('id', id);
    } else if (profile.email) {
      query = query.eq('email', profile.email.toLowerCase());
    } else {
      query = query.eq('email', 'rasha@yahoo.com');
    }

    const { data, error } = await query.select().maybeSingle();
    if (error) {
      console.warn('[Supabase] updateTeacherProfile notice:', error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.warn('[Supabase] updateTeacherProfile error:', err?.message);
    return null;
  }
}

/**
 * Updates teacher password and password_hash in Supabase.
 */
export async function updateTeacherPasswordInSupabase(
  id: string,
  newPassword: string,
  newPasswordHash: string
) {
  if (!isSupabaseConfigured() || !newPassword) return null;
  try {
    const client = getSupabaseServerClient();
    let query = client.from('teachers').update({
      password: newPassword,
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString(),
    });

    if (id && id !== 'teacher-admin-1') {
      query = query.eq('id', id);
    } else {
      query = query.eq('email', 'rasha@yahoo.com');
    }

    const { data, error } = await query.select().maybeSingle();
    if (error) {
      console.warn('[Supabase] updateTeacherPassword notice:', error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.warn('[Supabase] updateTeacherPassword error:', err?.message);
    return null;
  }
}

/**
 * Deletes a student from Supabase students table.
 */
export async function deleteStudentFromSupabase(studentIdOrCode: string) {
  if (!isSupabaseConfigured() || !studentIdOrCode) return null;
  try {
    const client = getSupabaseServerClient();
    const { error } = await client
      .from('students')
      .delete()
      .or(`id.eq.${studentIdOrCode},student_code.eq.${studentIdOrCode}`);
    if (error) {
      console.warn('[Supabase] deleteStudent notice:', error.message);
    }
    return !error;
  } catch (err: any) {
    console.warn('[Supabase] deleteStudent error:', err?.message);
    return false;
  }
}

/**
 * Toggles a student's active status in Supabase.
 */
export async function toggleStudentStatusInSupabase(studentIdOrCode: string, isActive: boolean) {
  if (!isSupabaseConfigured() || !studentIdOrCode) return null;
  try {
    const client = getSupabaseServerClient();
    const { error } = await client
      .from('students')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .or(`id.eq.${studentIdOrCode},student_code.eq.${studentIdOrCode}`);
    if (error) {
      console.warn('[Supabase] toggleStudentStatus notice:', error.message);
    }
    return !error;
  } catch (err: any) {
    console.warn('[Supabase] toggleStudentStatus error:', err?.message);
    return false;
  }
}

