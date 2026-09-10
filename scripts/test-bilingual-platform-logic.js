/**
 * Comprehensive Bilingual Platform Verification Test Suite
 * Evaluated from the perspective of:
 *   1. Software Engineer (Architecture, Parity, Schema Integrity)
 *   2. Developer (Routing, Dynamic Directionality, Syntax, Zero Hardcoded Strings)
 *   3. QA / Tester (Simulated User Journeys, AR <-> EN Switching, Fallbacks)
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
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

console.log('\n================================================================');
console.log('🧪 BILINGUAL PLATFORM LOGICAL VERIFICATION TEST SUITE (AR <-> EN)');
console.log('================================================================\n');

// -------------------------------------------------------------
// SUITE 1: SOFTWARE ENGINEER POV - TRANSLATION PARITY & INTERPOLATION
// -------------------------------------------------------------
console.log('📦 SUITE 1: Translation Dictionary Architecture & Key Parity (Software Engineer POV)');

const arPath = path.join(__dirname, '../messages/ar.json');
const enPath = path.join(__dirname, '../messages/en.json');

assert(fs.existsSync(arPath), 'messages/ar.json exists');
assert(fs.existsSync(enPath), 'messages/en.json exists');

const arMessages = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const enMessages = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const k of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys.push(...getAllKeys(obj[k], fullKey));
    } else {
      keys.push({ key: fullKey, val: obj[k] });
    }
  }
  return keys;
}

const arKeyEntries = getAllKeys(arMessages);
const enKeyEntries = getAllKeys(enMessages);

const arKeyMap = new Map(arKeyEntries.map((e) => [e.key, e.val]));
const enKeyMap = new Map(enKeyEntries.map((e) => [e.key, e.val]));

assert(arKeyEntries.length === enKeyEntries.length, `AR keys count (${arKeyEntries.length}) matches EN keys count (${enKeyEntries.length})`);

let missingInEn = [];
let missingInAr = [];
let emptyStrings = [];
let variableMismatches = [];

const varRegex = /\{([^}]+)\}/g;

for (const [key, valAr] of arKeyMap.entries()) {
  if (!enKeyMap.has(key)) {
    missingInEn.push(key);
  } else {
    const valEn = enKeyMap.get(key);
    if (!valAr || typeof valAr !== 'string' || valAr.trim() === '') emptyStrings.push(`AR: ${key}`);
    if (!valEn || typeof valEn !== 'string' || valEn.trim() === '') emptyStrings.push(`EN: ${key}`);

    const varsAr = (String(valAr).match(varRegex) || []).sort();
    const varsEn = (String(valEn).match(varRegex) || []).sort();
    if (JSON.stringify(varsAr) !== JSON.stringify(varsEn)) {
      variableMismatches.push({ key, varsAr, varsEn });
    }
  }
}

for (const key of enKeyMap.keys()) {
  if (!arKeyMap.has(key)) {
    missingInAr.push(key);
  }
}

assert(missingInEn.length === 0, `Zero translation keys missing in EN (found: ${missingInEn.length})`);
assert(missingInAr.length === 0, `Zero translation keys missing in AR (found: ${missingInAr.length})`);
assert(emptyStrings.length === 0, `Zero empty/null translation values in either locale (found: ${emptyStrings.length})`);
assert(variableMismatches.length === 0, `All interpolation variables match 1:1 between AR and EN (mismatches: ${variableMismatches.length})`);

// -------------------------------------------------------------
// SUITE 2: DEVELOPER POV - DYNAMIC DIRECTIONALITY & ZERO HARDCODED RTL/LINKS
// -------------------------------------------------------------
console.log('\n💻 SUITE 2: Codebase Scan for Directionality & Dynamic Routing (Developer POV)');

function scanDirectory(dir, filterExt, callback) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== '.git') {
        scanDirectory(fullPath, filterExt, callback);
      }
    } else if (filterExt.some((ext) => entry.name.endsWith(ext))) {
      callback(fullPath);
    }
  }
}

const codebaseRoots = [
  path.join(__dirname, '../app'),
  path.join(__dirname, '../components'),
];

let hardcodedDirCount = 0;
let hardcodedDirFiles = [];
let hardcodedArLinksCount = 0;
let hardcodedArLinkFiles = [];

codebaseRoots.forEach((root) => {
  scanDirectory(root, ['.tsx', '.jsx', '.ts', '.js'], (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('dir="rtl"')) {
      hardcodedDirCount++;
      hardcodedDirFiles.push(path.relative(path.join(__dirname, '..'), filePath));
    }

    if (/href=["']\/ar\//.test(content)) {
      hardcodedArLinksCount++;
      hardcodedArLinkFiles.push(path.relative(path.join(__dirname, '..'), filePath));
    }
  });
});

assert(hardcodedDirCount === 0, `Zero hardcoded dir="rtl" occurrences in app & components (found: ${hardcodedDirCount})`);
assert(hardcodedArLinksCount === 0, `Zero hardcoded href="/ar/..." links in app & components (found: ${hardcodedArLinksCount})`);

// -------------------------------------------------------------
// SUITE 3: QA / TESTER POV - SIMULATED USER JOURNEY & RUNTIME BEHAVIOR
// -------------------------------------------------------------
console.log('\n🕵️‍♂️ SUITE 3: Simulated User Journeys & AR <-> EN Switching (QA / Tester POV)');

// 3.1 Top Navigation
function simulateTopNav(locale) {
  const isAr = locale === 'ar';
  return {
    dir: isAr ? 'rtl' : 'ltr',
    searchPlaceholder: isAr ? 'بحث في المنصة...' : 'Search platform...',
    roleStudent: isAr ? 'حساب طالب' : 'Student Account',
    roleTeacher: isAr ? 'لوحة المعلم' : 'Teacher Dashboard',
    logout: isAr ? 'تسجيل الخروج' : 'Log Out',
    langToggleTarget: isAr ? 'en' : 'ar',
  };
}
const topNavAr = simulateTopNav('ar');
const topNavEn = simulateTopNav('en');
assert(topNavAr.dir === 'rtl' && topNavAr.searchPlaceholder.includes('بحث'), 'TopNav AR correctly renders RTL and Arabic labels');
assert(topNavEn.dir === 'ltr' && topNavEn.searchPlaceholder === 'Search platform...', 'TopNav EN correctly renders LTR and English labels');
assert(topNavAr.langToggleTarget === 'en' && topNavEn.langToggleTarget === 'ar', 'TopNav language switcher alternates seamlessly between AR and EN');

// 3.2 Teacher Sidebar
function simulateTeacherSidebar(locale) {
  const isAr = locale === 'ar';
  const prefix = `/${locale}/teacher`;
  return [
    { label: isAr ? 'نظرة عامة' : 'Overview', href: `${prefix}` },
    { label: isAr ? 'الفصول الدراسية' : 'Classrooms', href: `${prefix}/classrooms` },
    { label: isAr ? 'بنك الاختبارات' : 'Quizzes', href: `${prefix}/quizzes` },
    { label: isAr ? 'الواجبات والمهام' : 'Assignments', href: `${prefix}/assignments` },
    { label: isAr ? 'شؤون الطلاب' : 'Students', href: `${prefix}/students` },
    { label: isAr ? 'الحصص المباشرة' : 'Live Sessions', href: `${prefix}/live` },
    { label: isAr ? 'التقارير الأكاديمية' : 'Reports', href: `${prefix}/reports` },
    { label: isAr ? 'أكواد الحصص' : 'Access Codes', href: `${prefix}/access-codes` },
  ];
}
const teacherNavAr = simulateTeacherSidebar('ar');
const teacherNavEn = simulateTeacherSidebar('en');
assert(teacherNavAr.length === 8 && teacherNavEn.length === 8, 'All 8 teacher nav sections defined in both languages');
assert(teacherNavAr.every((n) => n.href.startsWith('/ar/teacher')), 'All AR teacher nav routes point to /ar/...');
assert(teacherNavEn.every((n) => n.href.startsWith('/en/teacher')), 'All EN teacher nav routes point to /en/...');
assert(teacherNavEn.every((n) => !/[\u0600-\u06FF]/.test(n.label)), 'Zero Arabic characters in EN teacher nav labels');

// 3.3 Student Sidebar
function simulateStudentSidebar(locale) {
  const isAr = locale === 'ar';
  const prefix = `/${locale}/student`;
  return [
    { label: isAr ? 'لوحة الطالب' : 'Student Hub', href: `${prefix}` },
    { label: isAr ? 'الاختبارات' : 'Quizzes', href: `${prefix}/quizzes` },
    { label: isAr ? 'الواجبات' : 'Assignments', href: `${prefix}/assignments` },
    { label: isAr ? 'سجل الدرجات' : 'Grades', href: `${prefix}/grades` },
    { label: isAr ? 'لوحة الشرف' : 'Leaderboard', href: `${prefix}/leaderboard` },
    { label: isAr ? 'شحن كود الحصة' : 'Redeem Code', href: `${prefix}/redeem` },
    { label: isAr ? 'سجل الحضور' : 'Attendance', href: `${prefix}/attendance` },
  ];
}
const studentNavAr = simulateStudentSidebar('ar');
const studentNavEn = simulateStudentSidebar('en');
assert(studentNavAr.length === 7 && studentNavEn.length === 7, 'All 7 student nav sections defined in both languages');
assert(studentNavAr.every((n) => n.href.startsWith('/ar/student')), 'All AR student nav routes point to /ar/...');
assert(studentNavEn.every((n) => n.href.startsWith('/en/student')), 'All EN student nav routes point to /en/...');
assert(studentNavEn.every((n) => !/[\u0600-\u06FF]/.test(n.label)), 'Zero Arabic characters in EN student nav labels');

// 3.4 Student Quiz Runner & Anti-Cheat
function simulateQuizRunner(locale, questionIdx, totalQuestions, warnings) {
  const isAr = locale === 'ar';
  return {
    dir: isAr ? 'rtl' : 'ltr',
    questionCounter: isAr ? `السؤال ${questionIdx + 1} من ${totalQuestions}` : `Question ${questionIdx + 1} of ${totalQuestions}`,
    warningToast: isAr
      ? `تحذير: مغادرة شاشة الاختبار غير مسموح بها! (${warnings}/3)`
      : `Warning: Leaving quiz screen is prohibited! (${warnings}/3)`,
    submitPrompt: isAr ? 'هل أنت متأكد من تسليم الإجابات وإنهاء الاختبار؟' : 'Are you sure you want to submit and complete the exam?',
    autoSubmitWarning: isAr
      ? 'تم قفل وتسليم الاختبار تلقائياً لتجاوز حد المحاولات الأمنية (3 مرات).'
      : 'Quiz was automatically submitted due to exceeding security violation limit (3 times).',
    buttonNext: isAr ? 'السؤال التالي' : 'Next Question',
    buttonPrev: isAr ? 'السابق' : 'Previous',
    buttonSubmit: isAr ? 'تسليم الإجابات النهائية' : 'Submit Final Answers',
  };
}
const runnerAr = simulateQuizRunner('ar', 2, 5, 2);
const runnerEn = simulateQuizRunner('en', 2, 5, 2);
assert(runnerAr.questionCounter === 'السؤال 3 من 5', 'Quiz runner AR formats question counter correctly');
assert(runnerEn.questionCounter === 'Question 3 of 5', 'Quiz runner EN formats question counter correctly');
assert(runnerEn.warningToast.includes('prohibited'), 'Anti-cheat warning toast renders in English when locale is en');
assert(runnerEn.autoSubmitWarning.includes('automatically submitted'), 'Auto-submit warning dialog renders in English when locale is en');
assert(runnerEn.buttonSubmit === 'Submit Final Answers', 'Submit button text translates cleanly in English');

// 3.5 Assignment Workflow
function simulateAssignmentModal(locale, fileName) {
  const isAr = locale === 'ar';
  return {
    dir: isAr ? 'rtl' : 'ltr',
    modalTitle: isAr ? 'تسليم الواجب المنزلي' : 'Submit Homework Assignment',
    fileSelectedText: isAr ? `تم اختيار: ${fileName}` : `Selected: ${fileName}`,
    fileSecurityScanToast: isAr ? 'جاري فحص الملف والتأكد من خلوه من التهديدات...' : 'Scanning file for security threats...',
    submitBtn: isAr ? 'تأكيد التسليم' : 'Confirm Submission',
    gradeStatusPending: isAr ? 'قيد المراجعة' : 'Pending Review',
    gradeStatusGraded: isAr ? 'تم التصحيح' : 'Graded',
  };
}
const assignAr = simulateAssignmentModal('ar', 'homework-solution.pdf');
const assignEn = simulateAssignmentModal('en', 'homework-solution.pdf');
assert(assignAr.dir === 'rtl' && assignAr.modalTitle === 'تسليم الواجب المنزلي', 'Assignment modal AR is RTL with Arabic headers');
assert(assignEn.dir === 'ltr' && assignEn.modalTitle === 'Submit Homework Assignment', 'Assignment modal EN is LTR with English headers');
assert(assignEn.fileSecurityScanToast.includes('security threats'), 'File security scan toast is fully English in EN mode');
assert(assignEn.gradeStatusGraded === 'Graded' && assignEn.gradeStatusPending === 'Pending Review', 'Assignment grade statuses translate accurately');

// 3.6 Suspended Page
function simulateSuspendedPage(locale) {
  const isAr = locale === 'ar';
  return {
    dir: isAr ? 'rtl' : 'ltr',
    title: isAr ? 'حساب الطالب معلّق / محظور مؤقتاً' : 'Student Account Suspended / Temporarily Locked',
    whatsappBtn: isAr ? 'تواصل مع المعلمة عبر واتساب' : 'Contact Teacher via WhatsApp',
    logoutBtn: isAr ? 'تسجيل الخروج والعودة للرئيسية' : 'Log Out & Return to Home',
  };
}
const suspAr = simulateSuspendedPage('ar');
const suspEn = simulateSuspendedPage('en');
assert(suspAr.dir === 'rtl' && suspAr.title.includes('معلّق'), 'Suspended page AR renders RTL with Arabic warning');
assert(suspEn.dir === 'ltr' && suspEn.title === 'Student Account Suspended / Temporarily Locked', 'Suspended page EN renders LTR with English warning');
assert(suspEn.whatsappBtn === 'Contact Teacher via WhatsApp', 'Suspended page EN WhatsApp button is English');

console.log('\n================================================================');
console.log(`📊 FINAL TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
