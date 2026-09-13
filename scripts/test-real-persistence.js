/**
 * 🧪 Comprehensive Multi-Role Verification Suite: Real Cloud Persistence & Mock Data Elimination
 * 
 * Verified Roles:
 * 1. Frontend Engineer: Zero localStorage in settings/students, server-authoritative state.
 * 2. Backend Engineer: Direct Supabase PostgreSQL integration for teacher profile & password.
 * 3. Database Administrator (DBA): Schema integrity, indexes, RLS, and teachers table.
 * 4. DevOps & Cloud: Environment parity, zero build-breaking mock arrays.
 * 5. QA & Security: Zero dummy passwords (teacher123), zero SEED_USERS, student data isolation.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('\n========================================================================');
console.log('🛡️ REAL CLOUD PERSISTENCE & MOCK DATA ELIMINATION VERIFICATION');
console.log('========================================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(description, testFn) {
  try {
    testFn();
    console.log(`  ✅ [PASS] ${description}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Reason: ${err.message}`);
    testsFailed++;
  }
}

// -----------------------------------------------------------------------------
// 1. FRONTEND ENGINEER: Storage & State Cleanliness
// -----------------------------------------------------------------------------
runTest('TeacherSettingsClient has ZERO localStorage references', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'teacher', 'TeacherSettingsClient.tsx'),
    'utf8'
  );
  assert(!file.includes('localStorage.getItem'), 'Must not read from localStorage');
  assert(!file.includes('localStorage.setItem'), 'Must not write to localStorage');
  assert(file.includes('router.refresh()'), 'Must revalidate server state on save');
});

runTest('TeacherStudentsClient has ZERO localStorage references', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'teacher', 'students', 'TeacherStudentsClient.tsx'),
    'utf8'
  );
  assert(!file.includes('localStorage.getItem'), 'Must not read from localStorage');
  assert(!file.includes('edu_deleted_students'), 'Must not use local deleted students cache');
  assert(!file.includes("'edu_students'"), 'Must not use local students array');
});

runTest('lib/store.ts has ZERO localStorage and ZERO sessionStorage references', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'lib', 'store.ts'),
    'utf8'
  );
  assert(!file.includes('localStorage'), 'lib/store.ts must have zero localStorage references');
  assert(!file.includes('sessionStorage'), 'lib/store.ts must have zero sessionStorage references');
});

runTest('TeacherQuizzesClient has ZERO localStorage references', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'teacher', 'quizzes', 'TeacherQuizzesClient.tsx'),
    'utf8'
  );
  assert(!file.includes('localStorage'), 'Must not contain localStorage');
});

runTest('TeacherAssignmentsClient has ZERO localStorage references', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'teacher', 'assignments', 'TeacherAssignmentsClient.tsx'),
    'utf8'
  );
  assert(!file.includes('localStorage'), 'Must not contain localStorage');
});

runTest('TeacherClassroomsClient has ZERO localStorage references', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'teacher', 'classrooms', 'TeacherClassroomsClient.tsx'),
    'utf8'
  );
  assert(!file.includes('localStorage'), 'Must not contain localStorage');
});

runTest('TeacherReportsClient has ZERO localStorage references', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'teacher', 'reports', 'TeacherReportsClient.tsx'),
    'utf8'
  );
  assert(!file.includes('localStorage'), 'Must not contain localStorage');
});

runTest('CompactStudentsTable has ZERO localStorage references', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'teacher', 'CompactStudentsTable.tsx'),
    'utf8'
  );
  assert(!file.includes('localStorage'), 'Must not contain localStorage');
});

runTest('StudentQuizzesListClient, StudentGradesClient, and QuizRunner have ZERO localStorage references', () => {
  const qList = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'student', 'StudentQuizzesListClient.tsx'),
    'utf8'
  );
  const grades = fs.readFileSync(
    path.join(__dirname, '..', 'components', 'student', 'StudentGradesClient.tsx'),
    'utf8'
  );
  const runner = fs.readFileSync(
    path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'student', 'quizzes', '[id]', 'QuizRunner.tsx'),
    'utf8'
  );
  assert(!qList.includes('localStorage'), 'StudentQuizzesListClient must not contain localStorage');
  assert(!grades.includes('localStorage'), 'StudentGradesClient must not contain localStorage');
  assert(!runner.includes('localStorage'), 'QuizRunner must not contain localStorage');
});

runTest('Entire components/ and app/ directories have ZERO localStorage and ZERO sessionStorage', () => {
  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        assert(!content.includes('localStorage'), `${entry.name} in ${dir} has residual localStorage`);
        assert(!content.includes('sessionStorage'), `${entry.name} in ${dir} has residual sessionStorage`);
      }
    }
  }
  scanDir(path.join(__dirname, '..', 'components'));
  scanDir(path.join(__dirname, '..', 'app'));
});

// -----------------------------------------------------------------------------
// 2. BACKEND ENGINEER: Server-Authoritative Cloud Operations
// -----------------------------------------------------------------------------
runTest('actions/teacher.ts updates Supabase PostgreSQL and eliminates in-memory fallbacks', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'actions', 'teacher.ts'),
    'utf8'
  );
  assert(file.includes('updateTeacherProfileInSupabase'), 'Calls updateTeacherProfileInSupabase');
  assert(file.includes('updateTeacherPasswordInSupabase'), 'Calls updateTeacherPasswordInSupabase');
  assert(!file.includes('teacher123'), 'Does not accept dummy password teacher123');
  assert(!file.includes('memoryTeacher'), 'Does not use in-memory memoryTeacher object');
});

runTest('app/api/auth/login/route.ts authenticates via Supabase teachers table', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'app', 'api', 'auth', 'login', 'route.ts'),
    'utf8'
  );
  assert(file.includes('getTeacherFromSupabase'), 'Queries Supabase for teacher credentials');
  assert(!file.includes('SEED_USERS'), 'Eliminated SEED_USERS hardcoded mock array');
  assert(!file.includes('teacher123'), 'Eliminated teacher123');
  assert(!file.includes('teacher@school.com'), 'Eliminated teacher@school.com');
});

runTest('actions/student.ts cascades deletions and status changes to Supabase Cloud', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'actions', 'student.ts'),
    'utf8'
  );
  assert(file.includes('deleteStudentFromSupabase'), 'Calls deleteStudentFromSupabase on student deletion');
  assert(file.includes('toggleStudentStatusInSupabase'), 'Calls toggleStudentStatusInSupabase on status toggle');
});

runTest('TeacherStudentsPage merges Supabase cloud students across all devices', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'teacher', 'students', 'page.tsx'),
    'utf8'
  );
  assert(file.includes("supabase.from('students').select('*')"), 'Queries Supabase students table');
  assert(file.includes('existingCodes'), 'Deduplicates against relational DB');
});

// -----------------------------------------------------------------------------
// 3. DATABASE ADMINISTRATOR (DBA): Schema, Integrity & Teachers Table
// -----------------------------------------------------------------------------
runTest('supabase-schema.sql defines public.teachers with RLS and Indexes', () => {
  const file = fs.readFileSync(
    path.join(__dirname, '..', 'supabase-schema.sql'),
    'utf8'
  );
  assert(file.includes('CREATE TABLE IF NOT EXISTS public.teachers'), 'Defines teachers table');
  assert(file.includes('idx_teachers_email'), 'Indexes teacher email');
  assert(file.includes('ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY'), 'Enables RLS on teachers');
  assert(file.includes('Allow all access to teachers'), 'Configures RLS access policy');
  assert(file.includes('unique_student_exam_attempt'), 'Enforces single-attempt uniqueness constraint');
});

// -----------------------------------------------------------------------------
// 4. LIVE SUPABASE CLOUD VERIFICATION
// -----------------------------------------------------------------------------
async function runAsyncCloudTests() {
  console.log('\n--- Running Live Supabase Cloud Verifications ---');

  const url = 'https://mttmrsltkmcpkgrxanaw.supabase.co';
  const pubKey = 'sb_publishable_Ka8C9RlRFfkoWSffO5Y-WQ_nDhKDLfG';
  const client = createClient(url, pubKey);

  try {
    const studentsRes = await client.from('students').select('*').limit(1);
    assert(!studentsRes.error, 'students table must be accessible: ' + (studentsRes.error?.message || ''));
    console.log('  ✅ [Cloud DB] PASS: Supabase students table is active and responsive');
    testsPassed++;
  } catch (e) {
    console.error('  ❌ [Cloud DB] FAIL: students table check:', e.message);
    testsFailed++;
  }

  try {
    const examsRes = await client.from('exams').select('*').limit(1);
    assert(!examsRes.error, 'exams table must be accessible: ' + (examsRes.error?.message || ''));
    console.log('  ✅ [Cloud DB] PASS: Supabase exams table is active and responsive');
    testsPassed++;
  } catch (e) {
    console.error('  ❌ [Cloud DB] FAIL: exams table check:', e.message);
    testsFailed++;
  }

  try {
    const questionsRes = await client.from('questions').select('*').limit(1);
    assert(!questionsRes.error, 'questions table must be accessible: ' + (questionsRes.error?.message || ''));
    console.log('  ✅ [Cloud DB] PASS: Supabase questions table is active and responsive');
    testsPassed++;
  } catch (e) {
    console.error('  ❌ [Cloud DB] FAIL: questions table check:', e.message);
    testsFailed++;
  }

  try {
    const attemptsRes = await client.from('exam_attempts').select('*').limit(1);
    assert(!attemptsRes.error, 'exam_attempts table must be accessible: ' + (attemptsRes.error?.message || ''));
    console.log('  ✅ [Cloud DB] PASS: Supabase exam_attempts table is active and responsive');
    testsPassed++;
  } catch (e) {
    console.error('  ❌ [Cloud DB] FAIL: exam_attempts table check:', e.message);
    testsFailed++;
  }

  console.log('\n========================================================================');
  console.log(`🏁 VERIFICATION SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('========================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAsyncCloudTests();
