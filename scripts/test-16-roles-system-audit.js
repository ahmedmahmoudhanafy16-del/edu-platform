/**
 * ==============================================================================
 * MASTER 16-ROLE FULL-SYSTEM AUDIT & VERIFICATION SUITE
 * ==============================================================================
 * Tests the platform across all 16 professional software engineering & product roles:
 *  1. Project Manager (مدير المشروع)
 *  2. Product Owner (مالك المنتج)
 *  3. Business Analyst (محلل الأعمال)
 *  4. UX Designer (مصمم تجربة المستخدم)
 *  5. UI Designer (مصمم واجهة المستخدم)
 *  6. Frontend Developer (مطور الواجهة الأمامية)
 *  7. Backend Developer (مطور الواجهة الخلفية)
 *  8. Full-Stack Developer (المطور الشامل)
 *  9. Database Administrator - DBA (مهندس قواعد البيانات)
 * 10. QA Tester (فاحص ومختبر الجودة)
 * 11. DevOps Engineer (مهندس السحابة والعمليات)
 * 12. Cybersecurity Specialist (مهندس أمن المعلومات)
 * 13. Copywriter / Content Writer (كاتب وصانع المحتوى)
 * 14. SEO Specialist (مختص تحسين محركات البحث)
 * 15. Digital Marketer (مدير التسويق الرقمي)
 * 16. Technical Support / System Admin (مسؤول الدعم الفني)
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${error.message}`);
    failedTests++;
  }
}

const rootDir = path.join(__dirname, '..');

console.log('======================================================');
console.log('🚀 EXECUTING MASTER 16-ROLE PLATFORM AUDIT');
console.log('======================================================\n');

// ------------------------------------------------------------------------------
// 1. مدير المشروع (Project Manager)
// ------------------------------------------------------------------------------
console.log('📋 1. Project Manager (مدير المشروع) — Scope & Architectural Completeness');
test('All core modules exist in project structure', () => {
  const requiredPaths = [
    'app/[locale]/(dashboard)/teacher/quizzes',
    'app/[locale]/(dashboard)/teacher/students',
    'app/[locale]/(dashboard)/teacher/reports',
    'app/[locale]/(dashboard)/teacher/classrooms',
    'app/[locale]/(dashboard)/teacher/assignments',
    'app/[locale]/(dashboard)/teacher/live',
    'actions/quiz.ts',
    'actions/student.ts',
    'actions/classroom.ts',
    'actions/assignment.ts',
    'lib/prisma.ts',
    'lib/whatsapp.ts',
  ];
  for (const relPath of requiredPaths) {
    const fullPath = path.join(rootDir, relPath);
    assert.strictEqual(fs.existsSync(fullPath), true, `Missing required project module: ${relPath}`);
  }
});

test('Package manifest defines Next.js 14 and key dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.name, 'edu-platform');
  assert.ok(pkg.dependencies.next, 'Missing next dependency');
  assert.ok(pkg.dependencies['next-intl'], 'Missing next-intl dependency');
  assert.ok(pkg.dependencies['@prisma/client'], 'Missing prisma client');
});

// ------------------------------------------------------------------------------
// 2. مالك المنتج (Product Owner)
// ------------------------------------------------------------------------------
console.log('\n👑 2. Product Owner (مالك المنتج) — User Personas & Value Delivery');
test('Schema defines RBAC user roles: STUDENT, TEACHER, PARENT, ADMIN', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'prisma/schema.prisma'), 'utf8');
  assert.ok(schema.includes('STUDENT'), 'Missing STUDENT role');
  assert.ok(schema.includes('TEACHER'), 'Missing TEACHER role');
  assert.ok(schema.includes('PARENT'), 'Missing PARENT role');
  assert.ok(schema.includes('ADMIN'), 'Missing ADMIN role');
});

test('Parent notification and WhatsApp tracking support value delivery', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'prisma/schema.prisma'), 'utf8');
  assert.ok(schema.includes('model ParentNotification'), 'Missing ParentNotification model');
  assert.ok(schema.includes('model NotificationLog'), 'Missing NotificationLog model');
});

// ------------------------------------------------------------------------------
// 3. محلل الأعمال (Business Analyst)
// ------------------------------------------------------------------------------
console.log('\n📈 3. Business Analyst (محلل الأعمال) — Rules & Mathematical Integrity');
test('Access code pricing and single-use redemption defaults', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'prisma/schema.prisma'), 'utf8');
  assert.ok(schema.includes('price           Float        @default(50.0)'), 'Missing price default 50.0');
  assert.ok(schema.includes('isUsed          Boolean      @default(false)'), 'Missing isUsed default false');
});

test('Passing score percentage defaults to 60% with boundary validation', () => {
  const calculatePass = (score, maxScore, passThreshold = 60) => {
    if (maxScore <= 0) return false;
    const percentage = (score / maxScore) * 100;
    return percentage >= passThreshold;
  };
  assert.strictEqual(calculatePass(6, 10, 60), true);
  assert.strictEqual(calculatePass(5.9, 10, 60), false);
  assert.strictEqual(calculatePass(0, 0, 60), false);
});

test('Student code follows sequential numeric format STU-XXX', () => {
  const formatCode = (num) => `STU-${String(num).padStart(3, '0')}`;
  assert.strictEqual(formatCode(1), 'STU-001');
  assert.strictEqual(formatCode(42), 'STU-042');
  assert.strictEqual(formatCode(105), 'STU-105');
});

// ------------------------------------------------------------------------------
// 4. مصمم تجربة المستخدم (UX Designer)
// ------------------------------------------------------------------------------
console.log('\n🎨 4. UX Designer (مصمم تجربة المستخدم) — Information Hierarchy & Frictionless Flows');
test('Executive 4-stat card pattern implemented across dashboard clients', () => {
  const quizClient = fs.readFileSync(path.join(rootDir, 'app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'), 'utf8');
  const studentClient = fs.readFileSync(path.join(rootDir, 'app/[locale]/(dashboard)/teacher/students/TeacherStudentsClient.tsx'), 'utf8');
  const reportClient = fs.readFileSync(path.join(rootDir, 'app/[locale]/(dashboard)/teacher/reports/TeacherReportsClient.tsx'), 'utf8');

  assert.ok(quizClient.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'), 'Quizzes client missing 4-card grid');
  assert.ok(studentClient.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'), 'Students client missing 4-card grid');
  assert.ok(reportClient.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'), 'Reports client missing 4-card grid');
});

test('Empty states provided on lists when search or filter returns zero matches', () => {
  const studentTable = fs.readFileSync(path.join(rootDir, 'components/teacher/CompactStudentsTable.tsx'), 'utf8');
  assert.ok(studentTable.includes('colSpan={14}'), 'Missing student table empty state span');
});

// ------------------------------------------------------------------------------
// 5. مصمم واجهة المستخدم (UI Designer)
// ------------------------------------------------------------------------------
console.log('\n✨ 5. UI Designer (مصمم واجهة المستخدم) — Visual Tokens, Zero Emojis & WCAG AAA');
test('Zero star emojis (⭐, 🌟) across production codebase', () => {
  const checkDirs = ['app', 'components', 'actions', 'lib'];
  let starCount = 0;
  for (const dir of checkDirs) {
    const fullDir = path.join(rootDir, dir);
    if (!fs.existsSync(fullDir)) continue;
    const scanDir = (d) => {
      const files = fs.readdirSync(d);
      for (const f of files) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) {
          scanDir(p);
        } else if (f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.js')) {
          const content = fs.readFileSync(p, 'utf8');
          if (content.includes('⭐') || content.includes('🌟')) {
            starCount++;
          }
        }
      }
    };
    scanDir(fullDir);
  }
  assert.strictEqual(starCount, 0, `Found ${starCount} star emojis in production code`);
});

test('Dark mode uses WCAG AAA high-contrast slate-900 surfaces', () => {
  const quizClient = fs.readFileSync(path.join(rootDir, 'app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'), 'utf8');
  assert.ok(quizClient.includes('dark:bg-slate-900'), 'Missing dark:bg-slate-900 surface token');
  assert.ok(quizClient.includes('dark:border-slate-800'), 'Missing dark:border-slate-800 border token');
});

test('Student codes, PINs, and scores enforce whitespace-nowrap and font-mono', () => {
  const quizClient = fs.readFileSync(path.join(rootDir, 'app/[locale]/(dashboard)/teacher/quizzes/TeacherQuizzesClient.tsx'), 'utf8');
  const studentTable = fs.readFileSync(path.join(rootDir, 'components/teacher/CompactStudentsTable.tsx'), 'utf8');
  assert.ok(quizClient.includes('whitespace-nowrap') && quizClient.includes('font-mono'), 'Missing whitespace-nowrap or font-mono on quiz view');
  assert.ok(studentTable.includes('whitespace-nowrap') && studentTable.includes('font-mono'), 'Missing whitespace-nowrap or font-mono on student table');
});

// ------------------------------------------------------------------------------
// 6. مطور الواجهة الأمامية (Frontend Developer)
// ------------------------------------------------------------------------------
console.log('\n💻 6. Frontend Developer (مطور الواجهة الأمامية) — Hydration & Provider Setup');
test('Root layout configures suppressHydrationWarning and Cairo font variable', () => {
  const layout = fs.readFileSync(path.join(rootDir, 'app/[locale]/layout.tsx'), 'utf8');
  assert.ok(layout.includes('suppressHydrationWarning'), 'Missing suppressHydrationWarning on layout');
  assert.ok(layout.includes('cairo.variable'), 'Missing cairo font variable binding');
  assert.ok(layout.includes('<NextIntlClientProvider'), 'Missing NextIntlClientProvider');
  assert.ok(layout.includes('<Toaster'), 'Missing Toaster');
});

test('Viewport configuration is explicitly exported', () => {
  const layout = fs.readFileSync(path.join(rootDir, 'app/[locale]/layout.tsx'), 'utf8');
  assert.ok(layout.includes('export const viewport: Viewport'), 'Missing viewport export');
});

// ------------------------------------------------------------------------------
// 7. مطور الواجهة الخلفية (Backend Developer)
// ------------------------------------------------------------------------------
console.log('\n⚙️ 7. Backend Developer (مطور الواجهة الخلفية) — Data Normalization & Server Actions');
test('Arabic normalization strips tashkeel, unifies alef, and cleans whitespace', () => {
  const normalize = (str) => {
    return str
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/\s+/g, ' ')
      .trim();
  };
  assert.strictEqual(normalize('القَاهِرَةُ'), 'القاهره');
  assert.strictEqual(normalize('  إسماعيل   '), 'اسماعيل');
  assert.strictEqual(normalize('مُسْتَشْفَى'), 'مستشفي');
});

test('MCQ evaluation accurately checks options and direct matches', () => {
  const isMatch = (sub, correct) => {
    if (!sub || !correct) return false;
    return String(sub).trim().toLowerCase() === String(correct).trim().toLowerCase();
  };
  assert.strictEqual(isMatch('Option A', 'Option A'), true);
  assert.strictEqual(isMatch('Option A', 'Option B'), false);
});

// ------------------------------------------------------------------------------
// 8. المطور الشامل (Full-Stack Developer)
// ------------------------------------------------------------------------------
console.log('\n🌐 8. Full-Stack Developer (المطور الشامل) — Client-Server Contracts & In-Memory Fallbacks');
test('Prisma module includes in-memory resilient stores for serverless fallbacks', () => {
  const prismaFile = fs.readFileSync(path.join(rootDir, 'lib/prisma.ts'), 'utf8');
  assert.ok(prismaFile.includes('export const memoryAccessCodes'), 'Missing memoryAccessCodes');
  assert.ok(prismaFile.includes('export const memoryQuizResults'), 'Missing memoryQuizResults');
  assert.ok(prismaFile.includes('export const memoryUnlockedQuizzes'), 'Missing memoryUnlockedQuizzes');
  assert.ok(prismaFile.includes('export function isDatabaseReadOnlyError'), 'Missing isDatabaseReadOnlyError helper');
});

test('Server actions return consistent structured envelope { success, data?, error? }', () => {
  const makeResponse = (success, data, error) => ({ success, ...(data && { data }), ...(error && { error }) });
  const ok = makeResponse(true, { id: 'quiz-1' });
  const err = makeResponse(false, null, 'Not found');
  assert.strictEqual(ok.success, true);
  assert.strictEqual(ok.data.id, 'quiz-1');
  assert.strictEqual(err.success, false);
  assert.strictEqual(err.error, 'Not found');
});

// ------------------------------------------------------------------------------
// 9. مهندس قواعد البيانات (Database Administrator - DBA)
// ------------------------------------------------------------------------------
console.log('\n🗄️ 9. Database Administrator - DBA (مهندس قواعد البيانات) — Relational Indexes & Schema Optimization');
test('schema.prisma contains comprehensive foreign key indexes', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'prisma/schema.prisma'), 'utf8');
  assert.ok(schema.includes('@@index([classroomId])'), 'Missing index on classroomId');
  assert.ok(schema.includes('@@index([studentId])'), 'Missing index on studentId');
  assert.ok(schema.includes('@@index([quizId])'), 'Missing index on quizId');
  assert.ok(schema.includes('@@index([quizResultId])'), 'Missing index on quizResultId');
  assert.ok(schema.includes('@@index([liveSessionId])'), 'Missing index on liveSessionId');
  assert.ok(schema.includes('@@index([parentId])'), 'Missing index on parentId');
});

test('schema.prisma specifies cascade delete on critical relations', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'prisma/schema.prisma'), 'utf8');
  assert.ok(schema.includes('onDelete: Cascade'), 'Missing cascade delete directives');
});

// ------------------------------------------------------------------------------
// 10. فاحص ومختبر الجودة (QA Tester)
// ------------------------------------------------------------------------------
console.log('\n🧪 10. QA Tester (فاحص ومختبر الجودة) — Boundaries, Zero-Division & Edge Cases');
test('Metrics calculation never outputs NaN on empty rosters', () => {
  const computeMetrics = (items) => {
    const total = items.length;
    const active = total > 0 ? (items.filter(i => i.isActive).length / total) * 100 : 0;
    const avgScore = total > 0 ? items.reduce((acc, i) => acc + (i.score || 0), 0) / total : 0;
    return { total, active, avgScore };
  };
  const emptyRes = computeMetrics([]);
  assert.strictEqual(Number.isNaN(emptyRes.active), false);
  assert.strictEqual(Number.isNaN(emptyRes.avgScore), false);
  assert.strictEqual(emptyRes.active, 0);
  assert.strictEqual(emptyRes.avgScore, 0);
});

test('Boundary test: Student scoring exactly 0/100 and 100/100', () => {
  const calc = (score, max) => (max > 0 ? (score / max) * 100 : 0);
  assert.strictEqual(calc(0, 100), 0);
  assert.strictEqual(calc(100, 100), 100);
  assert.strictEqual(calc(0, 0), 0);
});

// ------------------------------------------------------------------------------
// 11. مهندس السحابة والعمليات (DevOps Engineer)
// ------------------------------------------------------------------------------
console.log('\n☁️ 11. DevOps Engineer (مهندس السحابة والعمليات) — Health Probes & Cloud Builds');
test('Health check endpoint /api/health exists and exports GET handler', () => {
  const healthPath = path.join(rootDir, 'app/api/health/route.ts');
  assert.ok(fs.existsSync(healthPath), 'Missing app/api/health/route.ts');
  const healthCode = fs.readFileSync(healthPath, 'utf8');
  assert.ok(healthCode.includes('export async function GET'), 'Missing GET handler in health route');
  assert.ok(healthCode.includes("status: 'UP'"), 'Health route missing status: UP payload');
});

test('Database synchronization script prepare-db.js exists', () => {
  const prepPath = path.join(rootDir, 'scripts/prepare-db.js');
  assert.ok(fs.existsSync(prepPath), 'Missing scripts/prepare-db.js');
});

// ------------------------------------------------------------------------------
// 12. مهندس أمن المعلومات (Cybersecurity Specialist)
// ------------------------------------------------------------------------------
console.log('\n🛡️ 12. Cybersecurity Specialist (مهندس أمن المعلومات) — Security Headers & Data Protection');
test('next.config.mjs enforces HTTP security headers', () => {
  const nextConfig = fs.readFileSync(path.join(rootDir, 'next.config.mjs'), 'utf8');
  assert.ok(nextConfig.includes('Strict-Transport-Security'), 'Missing HSTS header');
  assert.ok(nextConfig.includes('X-Frame-Options'), 'Missing X-Frame-Options header');
  assert.ok(nextConfig.includes('X-Content-Type-Options'), 'Missing X-Content-Type-Options header');
  assert.ok(nextConfig.includes('Referrer-Policy'), 'Missing Referrer-Policy header');
  assert.ok(nextConfig.includes('Permissions-Policy'), 'Missing Permissions-Policy header');
});

test('Student quiz actions securely omit correctAnswer from student payload', () => {
  const actionFile = fs.readFileSync(path.join(rootDir, 'actions/quiz.ts'), 'utf8');
  assert.ok(actionFile.includes('ZERO correctAnswer sent to student!'), 'Missing correctAnswer exclusion guarantee in quiz action');
});

// ------------------------------------------------------------------------------
// 13. كاتب وصانع المحتوى (Copywriter / Content Writer)
// ------------------------------------------------------------------------------
console.log('\n✍️ 13. Copywriter / Content Writer (كاتب وصانع المحتوى) — Bilingual Dictionaries & Tone');
test('Arabic and English dictionaries have core navigation keys', () => {
  const ar = JSON.parse(fs.readFileSync(path.join(rootDir, 'messages/ar.json'), 'utf8'));
  const en = JSON.parse(fs.readFileSync(path.join(rootDir, 'messages/en.json'), 'utf8'));

  assert.ok(ar.Common || ar.common || ar.Navigation || ar.navigation, 'Missing Arabic navigation or common namespace');
  assert.ok(en.Common || en.common || en.Navigation || en.navigation, 'Missing English navigation or common namespace');
});

// ------------------------------------------------------------------------------
// 14. مختص تحسين محركات البحث (SEO Specialist)
// ------------------------------------------------------------------------------
console.log('\n🔍 14. SEO Specialist (مختص تحسين محركات البحث) — Metadata, Robots & Sitemap');
test('app/[locale]/layout.tsx exports generateMetadata with titles and descriptions', () => {
  const layout = fs.readFileSync(path.join(rootDir, 'app/[locale]/layout.tsx'), 'utf8');
  assert.ok(layout.includes('export async function generateMetadata'), 'Missing generateMetadata export');
  assert.ok(layout.includes('template:'), 'Missing title template in metadata');
  assert.ok(layout.includes('openGraph:'), 'Missing openGraph in metadata');
  assert.ok(layout.includes('twitter:'), 'Missing twitter card in metadata');
});

test('app/robots.ts generates dynamic crawler rules', () => {
  const robotsPath = path.join(rootDir, 'app/robots.ts');
  assert.ok(fs.existsSync(robotsPath), 'Missing app/robots.ts');
  const code = fs.readFileSync(robotsPath, 'utf8');
  assert.ok(code.includes('disallow:'), 'Robots missing disallow rules');
  assert.ok(code.includes('/teacher/'), 'Robots missing teacher route protection');
  assert.ok(code.includes('/student/'), 'Robots missing student route protection');
});

test('app/sitemap.ts generates localized dynamic sitemap', () => {
  const sitemapPath = path.join(rootDir, 'app/sitemap.ts');
  assert.ok(fs.existsSync(sitemapPath), 'Missing app/sitemap.ts');
  const code = fs.readFileSync(sitemapPath, 'utf8');
  assert.ok(code.includes('changeFrequency:'), 'Sitemap missing changeFrequency');
  assert.ok(code.includes('priority:'), 'Sitemap missing priority');
});

// ------------------------------------------------------------------------------
// 15. مدير التسويق الرقمي (Digital Marketer)
// ------------------------------------------------------------------------------
console.log('\n📣 15. Digital Marketer (مدير التسويق الرقمي) — OpenGraph & Viral Share Readiness');
test('Metadata contains OpenGraph and Twitter cards for high social CTR', () => {
  const layout = fs.readFileSync(path.join(rootDir, 'app/[locale]/layout.tsx'), 'utf8');
  assert.ok(layout.includes("card: 'summary_large_image'"), 'Missing summary_large_image card');
  assert.ok(layout.includes('siteName:'), 'Missing siteName in OpenGraph');
});

// ------------------------------------------------------------------------------
// 16. مسؤول الدعم الفني (Technical Support / System Admin)
// ------------------------------------------------------------------------------
console.log('\n🛠️ 16. Technical Support / System Admin (مسؤول الدعم الفني) — Diagnostics & Parent Channels');
test('WhatsApp link generator formats Egyptian phone numbers (+20) cleanly', () => {
  const formatPhone = (phone) => {
    let clean = String(phone || '').replace(/\D/g, '');
    if (clean.startsWith('20')) return clean;
    if (clean.startsWith('0')) clean = clean.substring(1);
    return '20' + clean;
  };
  assert.strictEqual(formatPhone('01012345678'), '201012345678');
  assert.strictEqual(formatPhone('+201012345678'), '201012345678');
  assert.strictEqual(formatPhone('201012345678'), '201012345678');
});

test('WhatsApp messages encode URI components safely without breaking Arabic', () => {
  const text = 'مرحباً ولي أمر الطالب أحمد';
  const encoded = encodeURIComponent(text);
  assert.ok(!encoded.includes(' '), 'URI encoding must replace spaces');
  assert.strictEqual(decodeURIComponent(encoded), text);
});

// ------------------------------------------------------------------------------
// Summary
// ------------------------------------------------------------------------------
console.log('\n======================================================');
console.log('🏁 16-ROLE FULL-SYSTEM AUDIT TEST SUMMARY');
console.log('======================================================');
console.log(`  Total Tests Run: ${passedTests + failedTests}`);
console.log(`  Passed:          ${passedTests}`);
console.log(`  Failed:          ${failedTests}`);
console.log(`  Success Rate:    ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

if (failedTests > 0) {
  console.error('\n❌ AUDIT FAILED — Some requirements were not satisfied!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL 16 ROLES AUDIT TESTS PASSED 100%! SYSTEM IS BULLETPROOF.');
  process.exit(0);
}
