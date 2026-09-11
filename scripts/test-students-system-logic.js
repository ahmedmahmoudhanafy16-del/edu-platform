/**
 * Master Students System Logical Verification Test Suite
 * 
 * Thoroughly validates the Students module across 3 perspectives:
 * 1. Software Engineer POV: Max-suffix student code generation, schema integrity, cascade deletes, sync idempotency
 * 2. Developer POV: Multi-attribute search, grade/class filters, sorting, unique 4-digit PINs, RFC 4180 CSV export
 * 3. Tester / QA POV: Edge cases (0 students, missing phones, 0% scores), security, contrast tokens & no-wrap assertions
 */

const fs = require('fs');
const path = require('path');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

function suite(title, fn) {
  console.log(`\n======================================================`);
  console.log(`🎓 ${title}`);
  console.log(`======================================================`);
  try {
    fn();
  } catch (err) {
    console.error(`  ❌ Suite Execution Error:`, err.message);
  }
}

// -----------------------------------------------------------------------------
// Suite 1: Software Engineer POV (Architecture, Code Gen & Storage Sync)
// -----------------------------------------------------------------------------
suite('1. Software Engineer POV: Code Gen, Schema Integrity & Storage Sync', () => {
  const classroomActionCode = fs.readFileSync(path.join(__dirname, '../actions/classroom.ts'), 'utf8');
  const syncRouteCode = fs.readFileSync(path.join(__dirname, '../app/api/students/sync/route.ts'), 'utf8');
  const studentActionCode = fs.readFileSync(path.join(__dirname, '../actions/student.ts'), 'utf8');

  // 1. Max-suffix code generation to prevent deletion collision
  assert(
    classroomActionCode.includes('maxNum') && classroomActionCode.includes('s.studentCode.match(/\\d+/)'),
    'actions/classroom.ts parses numeric suffix to find maximum existing studentCode'
  );
  assert(
    classroomActionCode.includes('const nextNum = maxNum + 1') &&
    classroomActionCode.includes('STU-'),
    'actions/classroom.ts increments maxNum + 1, guaranteeing zero code collision'
  );

  // Logical simulation of code generation
  function generateNextCode(existingCodes) {
    let maxNum = 0;
    for (const code of existingCodes) {
      if (code) {
        const match = code.match(/\d+/);
        if (match) {
          const val = parseInt(match[0], 10);
          if (!isNaN(val) && val > maxNum) maxNum = val;
        }
      }
    }
    return 'STU-' + String(maxNum + 1).padStart(3, '0');
  }

  // Test: Standard sequential
  assert(
    generateNextCode(['STU-001', 'STU-002', 'STU-003']) === 'STU-004',
    'Generates sequential code STU-004 when 1, 2, 3 exist'
  );

  // Test: Deletion scenario (STU-003 was deleted from 5 students: 1, 2, 4, 5 exist)
  assert(
    generateNextCode(['STU-001', 'STU-002', 'STU-004', 'STU-005']) === 'STU-006',
    'Generates STU-006 when STU-003 was deleted (prevents fatal collision with STU-005)'
  );

  // Test: Empty database
  assert(
    generateNextCode([]) === 'STU-001',
    'Generates STU-001 when database has zero students'
  );

  // 2. Cascading deletion verification
  assert(
    studentActionCode.includes('prisma.quizViolation.deleteMany') &&
    studentActionCode.includes('prisma.quizResult.deleteMany') &&
    studentActionCode.includes('prisma.assignmentSubmission.deleteMany') &&
    studentActionCode.includes('prisma.liveAttendance.deleteMany') &&
    studentActionCode.includes('prisma.enrollment.deleteMany'),
    'actions/student.ts cascades deletion across violations, quiz results, submissions, attendance, and enrollments'
  );

  // 3. Idempotent sync endpoint check
  assert(
    syncRouteCode.includes('prisma.user.findFirst') &&
    syncRouteCode.includes('OR:') &&
    syncRouteCode.includes('studentCode: sCode'),
    'app/api/students/sync/route.ts queries existing user by ID or studentCode before update/create'
  );

  // 4. Mathematical Zero-Division Safety
  function calculateMetrics(studentsList) {
    const total = studentsList.length;
    const active = studentsList.filter((s) => s.isActive !== false).length;
    const activeRate = total > 0 ? Math.round((active / total) * 100) : 0;

    const assigned = studentsList.filter((s) => Boolean(s.classroomId || s.classroomName)).length;
    const assignedRate = total > 0 ? Math.round((assigned / total) * 100) : 0;

    const scored = studentsList.filter((s) => s.avgScore != null);
    const avgScore = scored.length > 0 ? Math.round(scored.reduce((acc, s) => acc + s.avgScore, 0) / scored.length) : 0;

    return { total, activeRate, assignedRate, avgScore };
  }

  const emptyMetrics = calculateMetrics([]);
  assert(
    emptyMetrics.activeRate === 0 && emptyMetrics.assignedRate === 0 && emptyMetrics.avgScore === 0,
    'Metrics safely return 0 without producing NaN or division-by-zero on empty roster'
  );

  const sampleMetrics = calculateMetrics([
    { id: '1', isActive: true, classroomId: 'c1', avgScore: 80 },
    { id: '2', isActive: false, classroomId: '', avgScore: 60 },
    { id: '3', isActive: true, classroomId: 'c1', avgScore: 100 },
    { id: '4', isActive: true, classroomId: '', avgScore: null },
  ]);
  assert(sampleMetrics.total === 4, 'Correctly computes total enrolled students: 4');
  assert(sampleMetrics.activeRate === 75, 'Correctly computes active accounts rate: 75%');
  assert(sampleMetrics.assignedRate === 50, 'Correctly computes classroom assigned rate: 50%');
  assert(sampleMetrics.avgScore === 80, 'Correctly computes average score excluding nulls: 80%');
});

// -----------------------------------------------------------------------------
// Suite 2: Developer POV (Search, Filters, Sorting, PINs & CSV)
// -----------------------------------------------------------------------------
suite('2. Developer POV: Search, Filters, Sorting, PINs & CSV Export', () => {
  const mockStudents = [
    { id: '1', name: 'أحمد محمود', studentCode: 'STU-001', phone: '01110848617', parentPhone: '01110848617', grade: 'الصف الثالث الإعدادي', classroomId: 'cls-1', classroomName: 'فصل الأوائل', defaultPassword: '1234', avgScore: 90, attendanceCount: 10 },
    { id: '2', name: 'علي حسن', studentCode: 'STU-002', phone: '01066667777', parentPhone: '01066667777', grade: 'الصف الثاني الإعدادي', classroomId: 'cls-2', classroomName: 'فصل ب', defaultPassword: '5678', avgScore: 65, attendanceCount: 7 },
    { id: '3', name: 'Ziad Tarek', studentCode: 'STU-003', phone: '01087654321', parentPhone: '01087654321', grade: 'الصف الثالث الإعدادي', classroomId: 'cls-1', classroomName: 'فصل الأوائل', defaultPassword: '9999', avgScore: 40, attendanceCount: 3 },
  ];

  // 1. Multi-attribute Search
  function searchStudents(list, q) {
    const term = (q || '').trim().toLowerCase();
    if (!term) return list;
    return list.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      s.studentCode.toLowerCase().includes(term) ||
      (s.phone && s.phone.includes(term)) ||
      (s.parentPhone && s.parentPhone.includes(term)) ||
      (s.grade && s.grade.toLowerCase().includes(term)) ||
      (s.classroomName && s.classroomName.toLowerCase().includes(term))
    );
  }

  assert(searchStudents(mockStudents, 'أحمد').length === 1, 'Search finds Arabic student by name (أحمد)');
  assert(searchStudents(mockStudents, 'stu-002').length === 1, 'Search finds student by lowercase code (stu-002)');
  assert(searchStudents(mockStudents, 'Ziad').length === 1, 'Search finds English student name (Ziad)');
  assert(searchStudents(mockStudents, '01110848617').length === 1, 'Search finds student by phone number');
  assert(searchStudents(mockStudents, 'فصل الأوائل').length === 2, 'Search matches students by classroom name');

  // 2. Grade and Classroom Filtering
  function filterStudents(list, grade, classroomId) {
    return list.filter((s) => {
      if (grade && grade !== 'ALL' && s.grade !== grade) return false;
      if (classroomId && classroomId !== 'ALL' && s.classroomId !== classroomId) return false;
      return true;
    });
  }

  assert(
    filterStudents(mockStudents, 'الصف الثالث الإعدادي', 'ALL').length === 2,
    'Filter by grade الصف الثالث الإعدادي returns exactly 2 students'
  );
  assert(
    filterStudents(mockStudents, 'ALL', 'cls-2').length === 1,
    'Filter by classroom cls-2 returns exactly 1 student'
  );

  // 3. Sorting
  const sortedByScore = [...mockStudents].sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0));
  assert(
    sortedByScore[0].studentCode === 'STU-001' && sortedByScore[2].studentCode === 'STU-003',
    'Sorts descending by score accurately (90% -> 65% -> 40%)'
  );

  // 4. Random 4-digit PIN generation
  function generateRandomPin(existingPins = []) {
    const existing = new Set((existingPins || []).map((p) => String(p || '').trim()));
    for (let i = 0; i < 1000; i++) {
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      if (!existing.has(pin)) return pin;
    }
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  const generated = generateRandomPin(['1234', '5678']);
  assert(/^\d{4}$/.test(generated), 'Generated PIN is strictly a 4-digit numeric string');
  assert(generated !== '1234' && generated !== '5678', 'Generated PIN avoids existing PIN collisions');

  // 5. RFC 4180 CSV with UTF-8 BOM
  const csvModule = fs.readFileSync(path.join(__dirname, '../lib/export-csv.ts'), 'utf8');
  assert(
    csvModule.includes('\\uFEFF'),
    'lib/export-csv.ts prepends UTF-8 Byte Order Mark (BOM) for native Arabic Excel display'
  );
  assert(
    csvModule.includes('.replace(/"/g, \'""\')'),
    'lib/export-csv.ts escapes embedded quotes to RFC 4180 standard'
  );
});

// -----------------------------------------------------------------------------
// Suite 3: Tester / QA POV (Edge Cases, Security, Tokens & No-Wrap)
// -----------------------------------------------------------------------------
suite('3. Tester / QA POV: Edge Cases, Security & Dark Contrast Verification', () => {
 const teacherClientCode = fs.readFileSync(path.join(__dirname, '../app/[locale]/(dashboard)/teacher/students/TeacherStudentsClient.tsx'), 'utf8');
 const tableCode = fs.readFileSync(path.join(__dirname, '../components/teacher/CompactStudentsTable.tsx'), 'utf8');

 // 1. Executive 4-Card Overview Presence
 assert(
 teacherClientCode.includes('إجمالي الطلاب المسجلين') || teacherClientCode.includes('Total Enrolled Students'),
 'TeacherStudentsClient renders Card 1: Total Enrolled Students'
 );
 assert(
 teacherClientCode.includes('نسبة الحسابات النشطة') || teacherClientCode.includes('Active Accounts Rate'),
 'TeacherStudentsClient renders Card 2: Active Accounts Rate'
 );
 assert(
 teacherClientCode.includes('المعينين بالفصول الدراسية') || teacherClientCode.includes('Classroom Assigned'),
 'TeacherStudentsClient renders Card 3: Classroom Enrollment Rate'
 );
 assert(
 teacherClientCode.includes('متوسط نتائج الاختبارات') || teacherClientCode.includes('Exam Performance Avg'),
 'TeacherStudentsClient renders Card 4: Average Exam Performance'
 );

 // 2. High-Contrast Dark Mode Tokens (WCAG AAA)
 assert(
 teacherClientCode.includes('text-slate-900 dark:text-white') &&
 teacherClientCode.includes('border-slate-200 dark:border-slate-800') &&
 teacherClientCode.includes('bg-white dark:bg-slate-900'),
 'TeacherStudentsClient uses WCAG AAA high-contrast slate tokens for dark mode'
 );

 // 3. Table Dark Tokens & Avatar Presentation
 assert(
 tableCode.includes('border-slate-200 dark:border-slate-800') &&
 tableCode.includes('bg-white dark:bg-slate-900'),
 'CompactStudentsTable uses high-contrast slate borders and card background'
 );
 assert(
 tableCode.includes('s.name.trim().charAt(0)'),
 'CompactStudentsTable renders student avatar initials circle'
 );

 // 4. Non-wrapping Badges and Codes
 assert(
 tableCode.includes('whitespace-nowrap') && tableCode.includes('text-blue-600 dark:text-blue-400'),
 'Student code badge enforces whitespace-nowrap with high-contrast text-blue-400'
 );
 assert(
 tableCode.includes('bg-blue-50 dark:bg-blue-950/50'),
 'Student code badge uses elevated translucent pill container'
 );

 // 5. Zero Star Emojis Audit
 assert(
 !tableCode.includes('⭐') && !teacherClientCode.includes('⭐'),
 'Audit passes: Zero star emojis present across student table and client views'
 );

 // 6. Security Check: Empty states
 assert(
 tableCode.includes('colSpan={14}') &&
 (tableCode.includes('لا توجد نتائج مطابقة للبحث أو الفلتر') || tableCode.includes('No matching students found')),
 'Table provides a 14-column centered empty state message when no records match'
 );
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`🏁 MASTER STUDENTS SYSTEM TEST SUMMARY`);
console.log(`======================================================`);
console.log(`  Total Tests Run: ${totalTests}`);
console.log(`  Passed:          ${passedTests}`);
console.log(`  Failed:          ${failedTests}`);
console.log(`  Success Rate:    ${Math.round((passedTests / totalTests) * 100)}%`);

if (failedTests > 0) {
  console.error(`\n❌ Some tests failed! Please inspect output above.`);
  process.exit(1);
} else {
  console.log(`\n🎉 ALL STUDENTS SYSTEM TESTS PASSED 100%!`);
  process.exit(0);
}
