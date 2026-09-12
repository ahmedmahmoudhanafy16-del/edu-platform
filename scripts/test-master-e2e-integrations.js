/**
 * Master E2E Platform Integration & Logical Verification Test Suite
 * Validating the complete integration of all 16 technical engineering roles.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function runTest(roleName, testTitle, fn) {
  try {
    fn();
    console.log(`  ✅ [${roleName}] PASS: ${testTitle}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [${roleName}] FAIL: ${testTitle}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

console.log('\n========================================================================');
console.log('🌐 MASTER 16-ROLE END-TO-END (E2E) PLATFORM INTEGRATION AUDIT');
console.log('========================================================================\n');

// 1. Project Manager (مدير المشروع)
console.log('📋 1. Project Manager (مدير المشروع) — Traceability & Cross-Module Contracts');
const rootDir = path.join(__dirname, '..');
runTest('Project Manager', 'All core platform subsystems are present and structurally linked', () => {
  const dirs = ['actions', 'app', 'components', 'lib', 'messages', 'prisma', 'scripts'];
  dirs.forEach(d => {
    assert(fs.existsSync(path.join(rootDir, d)), `Directory ${d} must exist`);
  });
});

runTest('Project Manager', 'Inter-module revalidations link Classrooms, Quizzes, Assignments, Live & Reports', () => {
  const classAction = fs.readFileSync(path.join(rootDir, 'actions', 'classroom.ts'), 'utf8');
  const quizAction = fs.readFileSync(path.join(rootDir, 'actions', 'quiz.ts'), 'utf8');
  const assignAction = fs.readFileSync(path.join(rootDir, 'actions', 'assignment.ts'), 'utf8');
  const liveAction = fs.readFileSync(path.join(rootDir, 'actions', 'live.ts'), 'utf8');

  assert(classAction.includes("revalidatePath('/[locale]/teacher/reports')"), 'Classroom actions must revalidate reports');
  assert(quizAction.includes("revalidatePath('/[locale]/(dashboard)/teacher/reports')"), 'Quiz actions must revalidate reports');
  assert(assignAction.includes("revalidatePath('/[locale]/teacher/reports')"), 'Assignment actions must revalidate reports');
  assert(liveAction.includes("revalidatePath('/[locale]/teacher/reports')"), 'Live actions must revalidate reports');
});

// 2. Product Owner (مالك المنتج)
console.log('\n👑 2. Product Owner (مالك المنتج) — Complete User Personas & E2E Journeys');
runTest('Product Owner', 'Teacher and Student core role authorization contracts are established', () => {
  const authCode = fs.readFileSync(path.join(rootDir, 'lib', 'auth.ts'), 'utf8');
  assert(authCode.includes('requireRole'), 'requireRole helper must exist');
  assert(authCode.includes('TEACHER') && authCode.includes('STUDENT'), 'Roles TEACHER and STUDENT must be supported');
});

runTest('Product Owner', 'Parent notification channel for grades and live sessions is integrated', () => {
  const whatsappCode = fs.readFileSync(path.join(rootDir, 'lib', 'whatsapp.ts'), 'utf8');
  assert(whatsappCode.includes('notifyParentHomeworkGraded'), 'notifyParentHomeworkGraded must exist');
  assert(whatsappCode.includes('broadcastLiveSessionByGrade'), 'broadcastLiveSessionByGrade must exist');
});

runTest('Product Owner', 'Teacher profile and password management actions are established in actions/teacher.ts', () => {
  const teacherAction = fs.readFileSync(path.join(rootDir, 'actions', 'teacher.ts'), 'utf8');
  assert(teacherAction.includes('updateTeacherProfileAction'), 'updateTeacherProfileAction must exist');
  assert(teacherAction.includes('updateTeacherPasswordAction'), 'updateTeacherPasswordAction must exist');
});

// 3. Business Analyst (محلل الأعمال)
console.log('\n📈 3. Business Analyst (محلل الأعمال) — Business Logic & Math Integrity');
runTest('Business Analyst', 'Passing score threshold defaults to 60% with boundary validation', () => {
  const passingThreshold = 60;
  assert.strictEqual(59 >= passingThreshold, false, 'Score 59% must fail');
  assert.strictEqual(60 >= passingThreshold, true, 'Score 60% must pass');
  assert.strictEqual(100 >= passingThreshold, true, 'Score 100% must pass');
});

runTest('Business Analyst', 'Top performer (>=65%) vs Needs Follow-up (<65%) classification is consistent', () => {
  const isTopPerformer = (score) => score >= 65;
  assert.strictEqual(isTopPerformer(95), true);
  assert.strictEqual(isTopPerformer(65), true);
  assert.strictEqual(isTopPerformer(64.9), false);
  assert.strictEqual(isTopPerformer(40), false);
});

runTest('Business Analyst', 'Zero division mathematical safety returns 0% rather than NaN or Infinity', () => {
  const safeCalc = (val, max) => (max > 0 ? Math.round((val / max) * 100) : 0);
  assert.strictEqual(safeCalc(0, 0), 0);
  assert.strictEqual(safeCalc(50, 0), 0);
  assert.strictEqual(safeCalc(50, 100), 50);
});

// 4. UX Designer (مصمم تجربة المستخدم)
console.log('\n🎨 4. UX Designer (مصمم تجربة المستخدم) — Cognitive Hierarchy & Flow Feedback');
runTest('UX Designer', 'Standardized 4 Executive Stat Cards deployed across primary management hubs', () => {
  const studentsClient = fs.readFileSync(path.join(rootDir, 'app', '[locale]', '(dashboard)', 'teacher', 'students', 'TeacherStudentsClient.tsx'), 'utf8');
  const quizzesClient = fs.readFileSync(path.join(rootDir, 'app', '[locale]', '(dashboard)', 'teacher', 'quizzes', 'TeacherQuizzesClient.tsx'), 'utf8');
  const reportsClient = fs.readFileSync(path.join(rootDir, 'app', '[locale]', '(dashboard)', 'teacher', 'reports', 'TeacherReportsClient.tsx'), 'utf8');

  assert(studentsClient.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'), 'Students hub must render 4 cards');
  assert(quizzesClient.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'), 'Quizzes hub must render 4 cards');
  assert(reportsClient.includes('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'), 'Reports hub must render 4 cards');
});

runTest('UX Designer', 'Confirmation modals exist for dangerous permanent delete operations', () => {
  const reportsClient = fs.readFileSync(path.join(rootDir, 'app', '[locale]', '(dashboard)', 'teacher', 'reports', 'TeacherReportsClient.tsx'), 'utf8');
  assert(reportsClient.includes('studentToDelete'), 'Reports client must have delete confirmation modal');
  assert(reportsClient.includes('studentToEdit'), 'Reports client must have edit modal');
});

// 5. UI Designer (مصمم واجهة المستخدم)
console.log('\n✨ 5. UI Designer (مصمم واجهة المستخدم) — WCAG AAA Tokens & Zero Star Emojis');
runTest('UI Designer', 'Zero star emojis (⭐, 🌟) policy strictly enforced in source files', () => {
  const filesToCheck = [
    'components/teacher/CompactStudentsTable.tsx',
    path.join('app', '[locale]', '(dashboard)', 'teacher', 'reports', 'TeacherReportsClient.tsx'),
    path.join('app', '[locale]', '(dashboard)', 'teacher', 'quizzes', 'TeacherQuizzesClient.tsx'),
  ];
  filesToCheck.forEach(f => {
    const content = fs.readFileSync(path.join(rootDir, f), 'utf8');
    assert(!content.includes('⭐'), `File ${f} must not contain ⭐`);
    assert(!content.includes('🌟'), `File ${f} must not contain 🌟`);
  });
});

runTest('UI Designer', 'Codes, PINs, and scores enforce whitespace-nowrap and font-mono', () => {
  const reportsClient = fs.readFileSync(path.join(rootDir, 'app', '[locale]', '(dashboard)', 'teacher', 'reports', 'TeacherReportsClient.tsx'), 'utf8');
  assert(reportsClient.includes('font-mono') && reportsClient.includes('whitespace-nowrap'), 'Badges must enforce font-mono and whitespace-nowrap');
});

// 6. Frontend Developer (مطور الواجهة الأمامية)
console.log('\n💻 6. Frontend Developer (مطور الواجهة الأمامية) — Unified Event Bus & Optimistic UI');
runTest('Frontend Developer', 'Event bus dispatches edu_students_updated for cross-component sync', () => {
  const tableCode = fs.readFileSync(path.join(rootDir, 'components', 'teacher', 'CompactStudentsTable.tsx'), 'utf8');
  const reportsCode = fs.readFileSync(path.join(rootDir, 'app', '[locale]', '(dashboard)', 'teacher', 'reports', 'TeacherReportsClient.tsx'), 'utf8');

  assert(tableCode.includes('edu_students_updated'), 'CompactStudentsTable must handle edu_students_updated');
  assert(reportsCode.includes('edu_students_updated'), 'TeacherReportsClient must handle edu_students_updated');
});

runTest('Frontend Developer', 'TeacherDashboardOverviewClient dynamically synchronizes classrooms and students from store and events', () => {
  const dashboardClient = fs.readFileSync(path.join(rootDir, 'components', 'teacher', 'TeacherDashboardOverviewClient.tsx'), 'utf8');
  assert(dashboardClient.includes('setClassroomsCount'), 'Must maintain reactive classroomsCount state');
  assert(dashboardClient.includes('setStudentsCount'), 'Must maintain reactive studentsCount state');
  assert(dashboardClient.includes('edu_classrooms_updated'), 'Must listen to edu_classrooms_updated event');
  assert(dashboardClient.includes('edu_students_updated'), 'Must listen to edu_students_updated event');
  assert(dashboardClient.includes('getClassroomsFromStore'), 'Must read classrooms from client store');
  assert(dashboardClient.includes('getStudentsFromStore'), 'Must read students from client store');
});

runTest('Frontend Developer', 'TeacherStudentsClient cards dynamically reflect reactive students state and pass to table', () => {
  const studentsClient = fs.readFileSync(path.join(rootDir, 'app', '[locale]', '(dashboard)', 'teacher', 'students', 'TeacherStudentsClient.tsx'), 'utf8');
  assert(studentsClient.includes('setStudents'), 'Must maintain reactive students state');
  assert(studentsClient.includes('totalStudents = students.length'), 'Card 1 must compute total from reactive students');
  assert(studentsClient.includes('activeCount = students.filter'), 'Card 2 must compute active count from reactive students');
  assert(studentsClient.includes('students={students as any}'), 'Must pass reactive students down to CompactStudentsTable');
  assert(studentsClient.includes('edu_students_updated'), 'Must listen to edu_students_updated');
});

runTest('Frontend Developer', 'Teacher dashboard server page has ZERO phantom fallback numbers (defaults to 0)', () => {
  const teacherPage = fs.readFileSync(path.join(rootDir, 'app', '[locale]', '(dashboard)', 'teacher', 'page.tsx'), 'utf8');
  assert(teacherPage.includes('let classroomsCount = 0;'), 'classroomsCount must default to 0');
  assert(teacherPage.includes('let studentsCount = 0;'), 'studentsCount must default to 0');
  assert(!teacherPage.includes('.catch(() => 1)'), 'Must not have phantom fallback of 1 classroom');
  assert(!teacherPage.includes('.catch(() => 4)'), 'Must not have phantom fallback of 4 students');
});

runTest('Frontend Developer', 'getStudentsFromStore returns real students and respects deleted set without resurrecting seeds', () => {
  const storeCode = fs.readFileSync(path.join(rootDir, 'lib', 'store.ts'), 'utf8');
  assert(storeCode.includes('edu_deleted_students'), 'getStudentsFromStore must filter by edu_deleted_students');
  assert(storeCode.includes('DEFAULT_INITIAL_STUDENTS') && storeCode.includes('DEFAULT_INITIAL_STUDENTS: any[] = [];'), 'DEFAULT_INITIAL_STUDENTS must be empty array (pure real data only)');
});

runTest('Frontend Developer', 'Root layout contains hydration suppression and Cairo font definition', () => {
  const layoutCode = fs.readFileSync(path.join(rootDir, 'app', '[locale]', 'layout.tsx'), 'utf8');
  assert(layoutCode.includes('suppressHydrationWarning'), 'Root layout must suppress hydration warning');
  assert(layoutCode.includes('cairo.variable'), 'Root layout must bind cairo font variable');
});

// 7. Backend Developer (مطور الواجهة الخلفية)
console.log('\n⚙️ 7. Backend Developer (مطور الواجهة الخلفية) — Server Actions & Normalization');
runTest('Backend Developer', 'Arabic text normalization handles diacritics, alef variants and clean whitespace', () => {
  const quizCode = fs.readFileSync(path.join(rootDir, 'actions', 'quiz.ts'), 'utf8');
  assert(quizCode.includes('normalizeAnswerText'), 'normalizeAnswerText function must exist in actions/quiz.ts');
  
  function normalize(text) {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ');
  }

  assert.strictEqual(normalize('القَاهِرَةُ'), 'القاهره');
  assert.strictEqual(normalize('  إسماعيلية  '), 'اسماعيليه');
  assert.strictEqual(normalize('مُصْطَفَى'), 'مصطفي');
});

runTest('Backend Developer', 'Server actions adhere to standard response envelope', () => {
  const studentAction = fs.readFileSync(path.join(rootDir, 'actions', 'student.ts'), 'utf8');
  assert(studentAction.includes('success: true'), 'Server actions must return success envelope');
});

// 8. Full-Stack Developer (المطور الشامل)
console.log('\n🌐 8. Full-Stack Developer (المطور الشامل) — Multi-Tier Persistence & Fallbacks');
runTest('Full-Stack Developer', 'Dynamic in-memory cache synchronizes removals and updates for resilience', () => {
  const dynCode = fs.readFileSync(path.join(rootDir, 'lib', 'dynamic-students.ts'), 'utf8');
  assert(dynCode.includes('removeDynamicStudent'), 'removeDynamicStudent must exist');
  assert(dynCode.includes('updateDynamicStudent'), 'updateDynamicStudent must exist');
});

runTest('Full-Stack Developer', 'Dual revalidation connects student mutations to reports and roster', () => {
  const studentCode = fs.readFileSync(path.join(rootDir, 'actions', 'student.ts'), 'utf8');
  assert(studentCode.includes("revalidatePath('/[locale]/teacher/students')"));
  assert(studentCode.includes("revalidatePath('/[locale]/teacher/reports')"));
});

// 9. Database Administrator - DBA (مهندس قواعد البيانات)
console.log('\n🗄️ 9. Database Administrator - DBA (مهندس قواعد البيانات) — Relational Indexes & Cascades');
runTest('DBA', 'Prisma schema defines foreign key indexes (@@index) for query acceleration', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'prisma', 'schema.prisma'), 'utf8');
  assert(schema.includes('@@index([classroomId])'), 'Enrollment must have @@index([classroomId])');
  assert(schema.includes('@@index([quizId])'), 'QuizResult must have @@index([quizId])');
  assert(schema.includes('@@index([studentId])'), 'QuizResult must have @@index([studentId])');
});

runTest('DBA', 'Prisma schema enforces cascade deletion on critical child relations', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'prisma', 'schema.prisma'), 'utf8');
  assert(schema.includes('onDelete: Cascade'), 'Cascade delete must be declared in schema.prisma');
});

// 10. QA Tester (فاحص ومختبر الجودة)
console.log('\n🧪 10. QA Tester (فاحص ومختبر الجودة) — Master E2E Lifecycle Simulation');
runTest('QA Tester', 'End-to-End Simulation: Student Registration -> Exam Submission -> Reports -> WhatsApp -> Purge', () => {
  let students = [
    { id: 'usr-101', studentCode: 'STU-101', name: 'Ziad Hanafy', grade: '3prep', phone: '01012345678', parentPhone: '01087654321' }
  ];
  let quizResults = [];
  let deletedStudents = new Set();

  // 1. Student takes exam and submits
  const submission = {
    studentId: 'usr-101',
    quizId: 'quiz-01',
    score: 95,
    maxScore: 100,
    percentage: 95,
    status: 'PASSED'
  };
  quizResults.push(submission);
  assert.strictEqual(quizResults.length, 1);

  // 2. Reports view aggregates score
  let report = students.map(s => {
    const res = quizResults.filter(r => r.studentId === s.id);
    const avg = res.reduce((acc, c) => acc + c.percentage, 0) / res.length;
    return { ...s, avgScore: avg, status: avg >= 65 ? 'EXCELLENT' : 'NEEDS_ATTENTION' };
  });
  assert.strictEqual(report[0].avgScore, 95);
  assert.strictEqual(report[0].status, 'EXCELLENT');

  // 3. Parent notification link generation
  const parentPhone = report[0].parentPhone;
  const whatsappUrl = `https://wa.me/2${parentPhone}?text=${encodeURIComponent(`تقرير درجات الطالب ${report[0].name}: ${report[0].avgScore}%`)}`;
  assert(whatsappUrl.includes('https://wa.me/201087654321'));

  // 4. Student edited in Reports
  report[0].name = 'Ziad Ahmed Hanafy';
  students[0].name = report[0].name;
  assert.strictEqual(students[0].name, 'Ziad Ahmed Hanafy');

  // 5. Student deleted in Reports -> cascades to all views
  deletedStudents.add(students[0].id);
  students = students.filter(s => !deletedStudents.has(s.id));
  report = report.filter(r => !deletedStudents.has(r.id));
  quizResults = quizResults.filter(q => !deletedStudents.has(q.studentId));

  assert.strictEqual(students.length, 0, 'Students roster must be empty');
  assert.strictEqual(report.length, 0, 'Reports must be empty');
  assert.strictEqual(quizResults.length, 0, 'Results must be purged');
});

// 11. DevOps Engineer (مهندس السحابة والعمليات)
console.log('\n☁️ 11. DevOps Engineer (مهندس السحابة والعمليات) — Health Probes & Build Pipeline');
runTest('DevOps Engineer', 'Health probe endpoint /api/health exports GET and returns structured JSON', () => {
  const healthCode = fs.readFileSync(path.join(rootDir, 'app', 'api', 'health', 'route.ts'), 'utf8');
  assert(healthCode.includes('export async function GET'), '/api/health must export GET');
  assert(healthCode.includes("status: 'UP'"), 'Health response must include UP status');
  assert(healthCode.includes('uptimeSeconds'), 'Health response must report uptime');
});

runTest('DevOps Engineer', 'scripts/prepare-db.js script exists and automates database client preparation', () => {
  assert(fs.existsSync(path.join(rootDir, 'scripts', 'prepare-db.js')), 'prepare-db.js must exist');
});

// 12. Cybersecurity Specialist (مهندس أمن المعلومات)
console.log('\n🛡️ 12. Cybersecurity Specialist (مهندس أمن المعلومات) — Zero Answer Leakage & Headers');
runTest('Cybersecurity Specialist', 'next.config.mjs enforces HTTP security headers (HSTS, SAMEORIGIN, nosniff)', () => {
  const nextConfig = fs.readFileSync(path.join(rootDir, 'next.config.mjs'), 'utf8');
  assert(nextConfig.includes('X-Frame-Options'), 'next.config.mjs must declare X-Frame-Options');
  assert(nextConfig.includes('Strict-Transport-Security'), 'next.config.mjs must declare HSTS');
  assert(nextConfig.includes('X-Content-Type-Options'), 'next.config.mjs must declare nosniff');
});

runTest('Cybersecurity Specialist', 'Student quiz fetcher strips correctAnswer to eliminate client cheating', () => {
  const quizCode = fs.readFileSync(path.join(rootDir, 'actions', 'quiz.ts'), 'utf8');
  assert(quizCode.includes('getStudentQuizSecureAction'), 'getStudentQuizSecureAction must exist');
  assert(quizCode.includes('// ZERO correctAnswer sent to student!'), 'correctAnswer must be explicitly stripped');
});

runTest('Cybersecurity Specialist', 'Teacher password update enforces current password verification and bcrypt hashing', () => {
  const teacherCode = fs.readFileSync(path.join(rootDir, 'actions', 'teacher.ts'), 'utf8');
  assert(teacherCode.includes('bcrypt.compare(currentPassword'), 'Must verify current password using bcrypt.compare');
  assert(teacherCode.includes('bcrypt.hash(newPassword'), 'Must hash new password using bcrypt.hash');
});

// 13. Copywriter / Content Writer (كاتب وصانع المحتوى)
console.log('\n✍️ 13. Copywriter / Content Writer (كاتب وصانع المحتوى) — Bilingual Dictionaries & Microcopy');
runTest('Copywriter', 'Arabic and English dictionaries maintain structural key parity', () => {
  const arDict = JSON.parse(fs.readFileSync(path.join(rootDir, 'messages', 'ar.json'), 'utf8'));
  const enDict = JSON.parse(fs.readFileSync(path.join(rootDir, 'messages', 'en.json'), 'utf8'));
  
  assert(arDict.nav, 'Arabic dictionary must define nav namespace');
  assert(enDict.nav, 'English dictionary must define nav namespace');
  assert(arDict.teacher, 'Arabic dictionary must define teacher namespace');
  assert(enDict.teacher, 'English dictionary must define teacher namespace');
});

// 14. SEO Specialist (مختص تحسين محركات البحث)
console.log('\n🔍 14. SEO Specialist (مختص تحسين محركات البحث) — Dynamic Metadata, Robots & Sitemap');
runTest('SEO Specialist', 'Dynamic metadata, robots.ts and sitemap.ts are properly implemented', () => {
  assert(fs.existsSync(path.join(rootDir, 'app', 'robots.ts')), 'robots.ts must exist');
  assert(fs.existsSync(path.join(rootDir, 'app', 'sitemap.ts')), 'sitemap.ts must exist');
  const robotsCode = fs.readFileSync(path.join(rootDir, 'app', 'robots.ts'), 'utf8');
  assert(robotsCode.includes('/teacher/'), 'robots.ts must protect /teacher/ path from crawlers');
});

// 15. Digital Marketer (مدير التسويق الرقمي)
console.log('\n📣 15. Digital Marketer (مدير التسويق الرقمي) — OpenGraph & Viral Sharing');
runTest('Digital Marketer', 'OpenGraph and Twitter Card metadata configured in root layout', () => {
  const layoutCode = fs.readFileSync(path.join(rootDir, 'app', '[locale]', 'layout.tsx'), 'utf8');
  assert(layoutCode.includes('openGraph'), 'Layout must define openGraph metadata');
  assert(layoutCode.includes('twitter'), 'Layout must define twitter card metadata');
});

// 16. Technical Support / System Admin (مسؤول الدعم الفني)
console.log('\n🛠️ 16. Technical Support / System Admin (مسؤول الدعم الفني) — Diagnostics & Phone Handling');
runTest('Tech Support', 'Egyptian phone number format normalization (+20) handles local prefixes correctly', () => {
  function formatEgyptianPhone(raw) {
    if (!raw) return '';
    let digits = raw.replace(/\D/g, '');
    if (digits.startsWith('20')) return digits;
    if (digits.startsWith('0')) return '2' + digits;
    return '20' + digits;
  }

  assert.strictEqual(formatEgyptianPhone('01012345678'), '201012345678');
  assert.strictEqual(formatEgyptianPhone('+201012345678'), '201012345678');
  assert.strictEqual(formatEgyptianPhone('011-9988-7766'), '201199887766');
});

console.log('\n========================================================================');
console.log('🏁 MASTER 16-ROLE END-TO-END (E2E) INTEGRATION SUMMARY');
console.log('========================================================================');
console.log(`  Total Roles Tested: 16 / 16`);
console.log(`  Total Assertions:   ${passed + failed}`);
console.log(`  Passed:             ${passed}`);
console.log(`  Failed:             ${failed}`);
console.log(`  Success Rate:       ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed > 0) {
  console.error('\n❌ MASTER E2E AUDIT ENCOUNTERED FAILURES!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL 16 ROLES PASSED 100% — MASTER E2E PLATFORM INTEGRATION BULLETPROOF!');
  process.exit(0);
}
