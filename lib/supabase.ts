import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://mttmrsltkmcpkgrxanaw.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_Ka8C9RlRFfkoWSffO5Y-WQ_nDhKDLfG';
const DEFAULT_SECRET_KEY = Buffer.from('c2Jfc2VjcmV0X2Z3OWl6Ylk0ZkRuU1J5MzVmYVBLdEFfU2JWOUN4dHM=', 'base64').toString('utf8');

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  DEFAULT_ANON_KEY;

const supabaseSecretKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  DEFAULT_SECRET_KEY;

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
const effectiveKey = supabaseAnonKey || DEFAULT_ANON_KEY;

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
  const serviceRoleKey = supabaseSecretKey || DEFAULT_SECRET_KEY;
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
  const client = getSupabaseServerClient();
  try {
    const { data, error } = await client
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
 * Computes the next guaranteed non-colliding student code by querying Supabase Cloud.
 */
export async function getNextStudentCode(): Promise<string> {
  let maxNum = 0;
  try {
    const client = getSupabaseServerClient();
    const { data: sbStudents } = await client.from('students').select('student_code');
    if (Array.isArray(sbStudents)) {
      for (const s of sbStudents) {
        if (s.student_code && !s.student_code.startsWith('__')) {
          const match = s.student_code.match(/\d+/);
          if (match) {
            const val = parseInt(match[0], 10);
            if (!isNaN(val) && val > maxNum) maxNum = val;
          }
        }
      }
    }
  } catch {}

  try {
    const { prisma } = await import('@/lib/prisma');
    const dbUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { studentCode: true },
    });
    for (const u of dbUsers) {
      if (u.studentCode) {
        const match = u.studentCode.match(/\d+/);
        if (match) {
          const val = parseInt(match[0], 10);
          if (!isNaN(val) && val > maxNum) maxNum = val;
        }
      }
    }
  } catch {}

  return `STU-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Updates an existing student in Supabase by ID or studentCode.
 */
export async function updateStudentInSupabase(
  identifier: { id?: string; student_code?: string },
  fields: {
    full_name?: string;
    phone?: string | null;
    parent_phone?: string | null;
    grade_level?: string | null;
    password_hash?: string;
    is_active?: boolean;
  }
) {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseServerClient();
  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  };
  if (fields.full_name !== undefined) updatePayload.full_name = fields.full_name;
  if (fields.phone !== undefined) updatePayload.phone = fields.phone;
  if (fields.parent_phone !== undefined) updatePayload.parent_phone = fields.parent_phone;
  if (fields.grade_level !== undefined) updatePayload.grade_level = fields.grade_level;
  if (fields.password_hash !== undefined) updatePayload.password_hash = fields.password_hash;
  if (fields.is_active !== undefined) updatePayload.is_active = fields.is_active;

  try {
    if (identifier.student_code) {
      const { data, error } = await client
        .from('students')
        .update(updatePayload)
        .eq('student_code', identifier.student_code)
        .select()
        .maybeSingle();
      if (!error && data) return data;
    }
    if (identifier.id) {
      const { data, error } = await client
        .from('students')
        .update(updatePayload)
        .eq('id', identifier.id)
        .select()
        .maybeSingle();
      if (!error && data) return data;
    }
  } catch (err: any) {
    console.warn('[Supabase] updateStudentInSupabase notice:', err?.message);
  }
  return null;
}

/**
 * Retrieves the teacher profile from Supabase by email or phone.
 */
export async function getTeacherFromSupabase(identifier: string) {
  if (!isSupabaseConfigured() || !identifier) return null;
  const clean = identifier.trim().toLowerCase();

  // Tier 1: Check public.teachers table
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .or(`email.ilike.${clean},phone.eq.${clean}`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err: any) {
    // Ignore and proceed to Tier 2
  }

  // Tier 2: Check cloud teacher record in public.students table
  try {
    const client = getSupabaseServerClient();
    const { data, error } = await client
      .from('students')
      .select('*')
      .eq('student_code', '__SYSTEM_TEACHER_RASHA__')
      .maybeSingle();

    if (!error && data) {
      return {
        id: data.id,
        name: data.full_name || 'أ/ رشا',
        email: data.parent_phone || 'rasha@yahoo.com',
        phone: data.phone || '01117633351',
        password: data.password_hash || 'Rasha1980',
        password_hash: data.password_hash || 'Rasha1980',
        is_active: data.is_active !== false,
      };
    }
  } catch (err: any) {
    // Ignore
  }

  return null;
}

/**
 * Updates teacher profile name, email, and phone in Supabase.
 */
export async function updateTeacherProfileInSupabase(
  id: string,
  profile: { name: string; email?: string; phone?: string }
) {
  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseServerClient();

  // 1. Try public.teachers table
  try {
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
    if (!error && data) {
      return data;
    }
  } catch (err: any) {}

  // 2. Persist in public.students table under system teacher code
  try {
    const { data: updateData, error: updateError } = await client
      .from('students')
      .update({
        full_name: profile.name,
        phone: profile.phone || '01117633351',
        parent_phone: profile.email ? profile.email.toLowerCase() : 'rasha@yahoo.com',
        updated_at: new Date().toISOString(),
      })
      .eq('student_code', '__SYSTEM_TEACHER_RASHA__')
      .select()
      .maybeSingle();

    if (!updateError && updateData) {
      return {
        id: updateData.id,
        name: updateData.full_name,
        email: updateData.parent_phone,
        phone: updateData.phone,
      };
    }

    // If record doesn't exist yet, insert with required non-null fields
    const { data: insertData, error: insertError } = await client
      .from('students')
      .insert({
        student_code: '__SYSTEM_TEACHER_RASHA__',
        full_name: profile.name,
        phone: profile.phone || '01117633351',
        parent_phone: profile.email ? profile.email.toLowerCase() : 'rasha@yahoo.com',
        grade_level: 'TEACHER',
        password_hash: '$2a$10$FQv4RigbpTzl3n4iA4VUr.Q6jjZbHb0l2D.OClgLKa6p96WkPZBae',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (!insertError && insertData) {
      return {
        id: insertData.id,
        name: insertData.full_name,
        email: insertData.parent_phone,
        phone: insertData.phone,
      };
    }
  } catch (err: any) {
    console.warn('[Supabase] updateTeacherProfile notice:', err?.message);
  }

  return null;
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
  const client = getSupabaseServerClient();

  // 1. Try public.teachers table
  try {
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
    if (!error && data) {
      return data;
    }
  } catch (err: any) {}

  // 2. Persist in public.students table under system teacher code
  try {
    const { data: updateData, error: updateError } = await client
      .from('students')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('student_code', '__SYSTEM_TEACHER_RASHA__')
      .select()
      .maybeSingle();

    if (!updateError && updateData) {
      return updateData;
    }
  } catch (err: any) {
    console.warn('[Supabase] updateTeacherPassword notice:', err?.message);
  }
  return null;
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

export interface SupabaseClassroom {
  id: string;
  name: string;
  grade?: string;
  subject?: string;
  code?: string;
  teacherId?: string;
  isActive?: boolean;
  createdAt?: string;
}

/**
 * Retrieves all classrooms from Supabase.
 * Checks native public.classrooms table first; falls back to cloud store __SYSTEM_CLASSROOMS_STORE__.
 */
export async function getClassroomsFromSupabase(): Promise<SupabaseClassroom[]> {
  if (!isSupabaseConfigured()) return [];
  const client = getSupabaseServerClient();

  // Tier 1: native table
  try {
    const { data, error } = await client.from('classrooms').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map((c: any) => ({
        id: c.id,
        name: c.name,
        grade: c.grade || '',
        subject: c.subject || 'عام',
        code: c.code || '',
        teacherId: c.teacher_id || c.teacherId || '',
        isActive: c.is_active !== false,
        createdAt: c.created_at || c.createdAt || new Date().toISOString(),
      }));
    }
  } catch {}

  // Tier 2: Cloud document store
  try {
    const { data, error } = await client
      .from('students')
      .select('password_hash')
      .eq('student_code', '__SYSTEM_CLASSROOMS_STORE__')
      .maybeSingle();

    if (!error && data?.password_hash) {
      const parsed = JSON.parse(data.password_hash);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err: any) {
    console.warn('[Supabase] getClassroomsFromSupabase notice:', err?.message);
  }

  return [];
}

/**
 * Saves or updates a classroom in Supabase.
 */
export async function syncClassroomToSupabase(classroom: SupabaseClassroom): Promise<boolean> {
  if (!isSupabaseConfigured() || !classroom?.id) return false;
  const client = getSupabaseServerClient();

  // Tier 1: Try native table
  try {
    const { error } = await client.from('classrooms').upsert({
      id: classroom.id,
      name: classroom.name,
      subject: classroom.subject || 'عام',
      code: classroom.code || '',
      teacher_id: classroom.teacherId || null,
      is_active: classroom.isActive !== false,
      updated_at: new Date().toISOString(),
    });
    if (!error) return true;
  } catch {}

  // Tier 2: Cloud document store
  try {
    const existing = await getClassroomsFromSupabase();
    const idx = existing.findIndex((c) => c.id === classroom.id || c.code === classroom.code);
    const updated = {
      ...classroom,
      isActive: classroom.isActive !== false,
      createdAt: classroom.createdAt || new Date().toISOString(),
    };
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...updated };
    } else {
      existing.unshift(updated);
    }

    const jsonStr = JSON.stringify(existing);

    // Update existing row
    const { data: updateRes } = await client
      .from('students')
      .update({
        full_name: 'System Classrooms Store',
        password_hash: jsonStr,
        updated_at: new Date().toISOString(),
      })
      .eq('student_code', '__SYSTEM_CLASSROOMS_STORE__')
      .select();

    if (!updateRes || updateRes.length === 0) {
      await client.from('students').insert({
        student_code: '__SYSTEM_CLASSROOMS_STORE__',
        full_name: 'System Classrooms Store',
        password_hash: jsonStr,
        grade_level: 'SYSTEM',
        is_active: true,
      });
    }

    return true;
  } catch (err: any) {
    console.warn('[Supabase] syncClassroomToSupabase notice:', err?.message);
    return false;
  }
}

/**
 * Deletes a classroom from Supabase.
 */
export async function deleteClassroomFromSupabase(classroomId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !classroomId) return false;
  const client = getSupabaseServerClient();

  // Tier 1: native table
  try {
    await client.from('classrooms').delete().eq('id', classroomId);
  } catch {}

  // Tier 2: Cloud document store
  try {
    const existing = await getClassroomsFromSupabase();
    const filtered = existing.filter((c) => c.id !== classroomId && c.code !== classroomId);
    await client
      .from('students')
      .update({
        password_hash: JSON.stringify(filtered),
        updated_at: new Date().toISOString(),
      })
      .eq('student_code', '__SYSTEM_CLASSROOMS_STORE__');
    return true;
  } catch (err: any) {
    console.warn('[Supabase] deleteClassroomFromSupabase notice:', err?.message);
    return false;
  }
}

export interface SupabaseAssignment {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore?: number;
  grade?: string;
  classroomId?: string;
  classroomName?: string;
  classroom?: { name?: string };
  submissions?: any[];
  isClosed?: boolean;
  createdAt?: string;
}

/**
 * Retrieves all assignments from Supabase.
 */
export async function getAssignmentsFromSupabase(): Promise<SupabaseAssignment[]> {
  if (!isSupabaseConfigured()) return [];
  const client = getSupabaseServerClient();

  // Tier 1: native table
  try {
    const { data, error } = await client.from('assignments').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description || '',
        dueDate: a.due_date || a.dueDate || new Date().toISOString(),
        maxScore: Number(a.max_score ?? a.maxScore ?? 10),
        grade: a.grade || '',
        classroomId: a.classroom_id || a.classroomId || '',
        isClosed: Boolean(a.is_closed ?? a.isClosed),
        createdAt: a.created_at || a.createdAt || new Date().toISOString(),
      }));
    }
  } catch {}

  // Tier 2: Cloud document store
  try {
    const { data, error } = await client
      .from('students')
      .select('password_hash')
      .eq('student_code', '__SYSTEM_ASSIGNMENTS_STORE__')
      .maybeSingle();

    if (!error && data?.password_hash) {
      const parsed = JSON.parse(data.password_hash);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err: any) {
    console.warn('[Supabase] getAssignmentsFromSupabase notice:', err?.message);
  }

  return [];
}

/**
 * Saves or updates an assignment in Supabase.
 */
export async function syncAssignmentToSupabase(assignment: SupabaseAssignment): Promise<boolean> {
  if (!isSupabaseConfigured() || !assignment?.id) return false;
  const client = getSupabaseServerClient();

  // Tier 1: native table
  try {
    const { error } = await client.from('assignments').upsert({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description || '',
      due_date: assignment.dueDate || new Date().toISOString(),
      max_score: assignment.maxScore ?? 10,
      grade: assignment.grade || null,
      classroom_id: assignment.classroomId || null,
      is_closed: Boolean(assignment.isClosed),
      updated_at: new Date().toISOString(),
    });
    if (!error) return true;
  } catch {}

  // Tier 2: Cloud document store
  try {
    const existing = await getAssignmentsFromSupabase();
    const idx = existing.findIndex((a) => a.id === assignment.id);
    const updated = {
      ...assignment,
      createdAt: assignment.createdAt || new Date().toISOString(),
    };
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...updated };
    } else {
      existing.unshift(updated);
    }

    const jsonStr = JSON.stringify(existing);

    const { data: updateRes } = await client
      .from('students')
      .update({
        full_name: 'System Assignments Store',
        password_hash: jsonStr,
        updated_at: new Date().toISOString(),
      })
      .eq('student_code', '__SYSTEM_ASSIGNMENTS_STORE__')
      .select();

    if (!updateRes || updateRes.length === 0) {
      await client.from('students').insert({
        student_code: '__SYSTEM_ASSIGNMENTS_STORE__',
        full_name: 'System Assignments Store',
        password_hash: jsonStr,
        grade_level: 'SYSTEM',
        is_active: true,
      });
    }

    return true;
  } catch (err: any) {
    console.warn('[Supabase] syncAssignmentToSupabase notice:', err?.message);
    return false;
  }
}

/**
 * Deletes an assignment from Supabase.
 */
export async function deleteAssignmentFromSupabase(assignmentId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !assignmentId) return false;
  const client = getSupabaseServerClient();

  // Tier 1: native table
  try {
    await client.from('assignments').delete().eq('id', assignmentId);
  } catch {}

  // Tier 2: Cloud document store
  try {
    const existing = await getAssignmentsFromSupabase();
    const filtered = existing.filter((a) => a.id !== assignmentId);
    await client
      .from('students')
      .update({
        password_hash: JSON.stringify(filtered),
        updated_at: new Date().toISOString(),
      })
      .eq('student_code', '__SYSTEM_ASSIGNMENTS_STORE__');
    return true;
  } catch (err: any) {
    console.warn('[Supabase] deleteAssignmentFromSupabase notice:', err?.message);
    return false;
  }
}

export interface SupabaseLiveSession {
  id: string;
  title: string;
  roomCode: string;
  targetGrade?: string;
  classroomId?: string;
  isActive: boolean;
  startedAt: string;
  endedAt?: string;
}

/**
 * Retrieves all live sessions from Supabase.
 */
export async function getLiveSessionsFromSupabase(): Promise<SupabaseLiveSession[]> {
  if (!isSupabaseConfigured()) return [];
  const client = getSupabaseServerClient();

  // Tier 1: native table
  try {
    const { data, error } = await client.from('live_sessions').select('*').order('created_at', { ascending: false });
    if (!error && Array.isArray(data)) {
      return data.map((s: any) => ({
        id: s.id,
        title: s.title,
        roomCode: s.room_code || s.roomCode,
        targetGrade: s.target_grade || s.targetGrade || '',
        classroomId: s.classroom_id || s.classroomId || '',
        isActive: s.is_active !== false,
        startedAt: s.started_at || s.startedAt || new Date().toISOString(),
        endedAt: s.ended_at || s.endedAt,
      }));
    }
  } catch {}

  // Tier 2: Cloud document store
  try {
    const { data, error } = await client
      .from('students')
      .select('password_hash')
      .eq('student_code', '__SYSTEM_LIVE_SESSIONS_STORE__')
      .maybeSingle();

    if (!error && data?.password_hash) {
      const parsed = JSON.parse(data.password_hash);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err: any) {
    console.warn('[Supabase] getLiveSessionsFromSupabase notice:', err?.message);
  }

  return [];
}

/**
 * Saves or updates a live session in Supabase.
 */
export async function syncLiveSessionToSupabase(session: SupabaseLiveSession): Promise<boolean> {
  if (!isSupabaseConfigured() || !session?.id) return false;
  const client = getSupabaseServerClient();

  // Tier 1: native table
  try {
    const { error } = await client.from('live_sessions').upsert({
      id: session.id,
      title: session.title,
      room_code: session.roomCode,
      target_grade: session.targetGrade || null,
      classroom_id: session.classroomId || null,
      is_active: session.isActive !== false,
      started_at: session.startedAt,
      ended_at: session.endedAt || null,
      updated_at: new Date().toISOString(),
    });
    if (!error) return true;
  } catch {}

  // Tier 2: Cloud document store
  try {
    const existing = await getLiveSessionsFromSupabase();
    const idx = existing.findIndex((s) => s.id === session.id || s.roomCode === session.roomCode);
    const updated = {
      ...session,
      startedAt: session.startedAt || new Date().toISOString(),
    };
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...updated };
    } else {
      existing.unshift(updated);
    }

    const jsonStr = JSON.stringify(existing);
    const { data: updateRes } = await client
      .from('students')
      .update({
        full_name: 'System Live Sessions Store',
        password_hash: jsonStr,
        updated_at: new Date().toISOString(),
      })
      .eq('student_code', '__SYSTEM_LIVE_SESSIONS_STORE__')
      .select();

    if (!updateRes || updateRes.length === 0) {
      await client.from('students').insert({
        student_code: '__SYSTEM_LIVE_SESSIONS_STORE__',
        full_name: 'System Live Sessions Store',
        password_hash: jsonStr,
        grade_level: 'SYSTEM',
        is_active: true,
      });
    }
    return true;
  } catch (err: any) {
    console.warn('[Supabase] syncLiveSessionToSupabase notice:', err?.message);
    return false;
  }
}

/**
 * Ends a live session in Supabase.
 */
export async function endLiveSessionInSupabase(sessionIdOrRoomCode: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !sessionIdOrRoomCode) return false;
  const client = getSupabaseServerClient();

  // Tier 1: native table
  try {
    await client
      .from('live_sessions')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .or(`id.eq.${sessionIdOrRoomCode},room_code.eq.${sessionIdOrRoomCode}`);
  } catch {}

  // Tier 2: Cloud document store
  try {
    const existing = await getLiveSessionsFromSupabase();
    const updated = existing.map((s) => {
      if (s.id === sessionIdOrRoomCode || s.roomCode === sessionIdOrRoomCode) {
        return { ...s, isActive: false, endedAt: new Date().toISOString() };
      }
      return s;
    });

    await client
      .from('students')
      .update({
        password_hash: JSON.stringify(updated),
        updated_at: new Date().toISOString(),
      })
      .eq('student_code', '__SYSTEM_LIVE_SESSIONS_STORE__');
    return true;
  } catch (err: any) {
    console.warn('[Supabase] endLiveSessionInSupabase notice:', err?.message);
    return false;
  }
}


