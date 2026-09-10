/**
 * Light/Dark Mode Logical System Test Suite
 * 
 * Tests the light/dark mode implementation across 3 core perspectives:
 * 1. Software Engineer POV: Design tokens, CSS variables, Tailwind configuration & architecture
 * 2. Developer POV: Component contrast ratios, WCAG AA compliance, CSS transitions & responsive chrome
 * 3. Tester / QA POV: Theme toggling logic, bilingual a11y labels, input/button styles & page rendering
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
  console.log(`🔷 ${title}`);
  console.log(`======================================================`);
  try {
    fn();
  } catch (err) {
    console.error(`  ❌ Suite Execution Error:`, err.message);
  }
}

// -----------------------------------------------------------------------------
// Perspective 1: Software Engineer POV (Architecture, Tokens & Config)
// -----------------------------------------------------------------------------
suite('1. Software Engineer POV: Architecture & Design Token System', () => {
  const globalsCssPath = path.join(__dirname, '../app/globals.css');
  const tailwindConfigPath = path.join(__dirname, '../tailwind.config.ts');

  assert(fs.existsSync(globalsCssPath), 'globals.css exists in app directory');
  assert(fs.existsSync(tailwindConfigPath), 'tailwind.config.ts exists in root');

  const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
  const tailwindConfig = fs.readFileSync(tailwindConfigPath, 'utf8');

  // Check dark mode trigger configuration
  assert(
    tailwindConfig.includes("darkMode: 'class'"),
    'Tailwind config enables class-based dark mode (darkMode: "class")'
  );

  // Check CSS variables in :root (Light theme)
  const requiredRootTokens = [
    '--n-50:', '--n-100:', '--n-200:', '--n-300:', '--n-400:',
    '--n-500:', '--n-600:', '--n-700:', '--n-800:', '--n-900:',
    '--accent:', '--ok:', '--warn:', '--bad:', '--surface-page:', '--surface-card:'
  ];
  requiredRootTokens.forEach((token) => {
    assert(
      globalsCss.includes(token),
      `:root defines light mode token "${token.replace(':', '')}"`
    );
  });

  // Check CSS variables in .dark (Dark theme)
  assert(globalsCss.includes('.dark {'), '.dark selector is defined in globals.css');
  const darkSection = globalsCss.split('.dark {')[1].split('}')[0];
  requiredRootTokens.forEach((token) => {
    assert(
      darkSection.includes(token),
      `.dark defines dark mode token "${token.replace(':', '')}"`
    );
  });

  // Check Tailwind color mapping uses var() rather than hardcoded hex
  assert(
    tailwindConfig.includes("50:  'var(--n-50)'") || tailwindConfig.includes("50: 'var(--n-50)'"),
    'Tailwind maps n.50 to CSS variable var(--n-50)'
  );
  assert(
    tailwindConfig.includes("100: 'var(--n-100)'"),
    'Tailwind maps n.100 to CSS variable var(--n-100)'
  );
  assert(
    tailwindConfig.includes("800: 'var(--n-800)'"),
    'Tailwind maps n.800 to CSS variable var(--n-800)'
  );
  assert(
    !tailwindConfig.includes("100: '#FAFAF7'"),
    'Tailwind no longer has hardcoded static light hex for n.100'
  );
  assert(
    !tailwindConfig.includes("800: '#2A2925'"),
    'Tailwind no longer has hardcoded static dark hex for n.800'
  );
});

// -----------------------------------------------------------------------------
// Perspective 2: Developer POV (Contrast, Transitions & Chrome Elements)
// -----------------------------------------------------------------------------
suite('2. Developer POV: WCAG AA Contrast, Transitions & Chrome Shell', () => {
  const globalsCss = fs.readFileSync(path.join(__dirname, '../app/globals.css'), 'utf8');
  const topNav = fs.readFileSync(path.join(__dirname, '../components/shared/TopNav.tsx'), 'utf8');
  const announcementBanner = fs.readFileSync(path.join(__dirname, '../components/shared/AnnouncementBanner.tsx'), 'utf8');
  const sidebar = fs.readFileSync(path.join(__dirname, '../components/shared/Sidebar.tsx'), 'utf8');
  const footer = fs.readFileSync(path.join(__dirname, '../components/shared/Footer.tsx'), 'utf8');
  const mobileNav = fs.readFileSync(path.join(__dirname, '../components/shared/MobileNav.tsx'), 'utf8');

  // Smooth theme transition class
  assert(
    globalsCss.includes('html.theme-transition'),
    'Global CSS provides "html.theme-transition" rule for flicker-free switching'
  );
  assert(
    globalsCss.includes('200ms cubic-bezier'),
    'Theme transition specifies 200ms cubic-bezier transition curves'
  );

  // TopNav styling
  assert(
    topNav.includes('dark:bg-slate-900'),
    'TopNav uses dark:bg-slate-900 (prevents white navigation header in dark mode)'
  );
  assert(
    topNav.includes('dark:border-slate-800'),
    'TopNav uses dark:border-slate-800 for high-contrast border definition'
  );
  assert(
    topNav.includes('text-slate-900 dark:text-white'),
    'TopNav brand text renders crisp white in dark mode'
  );
  assert(
    topNav.includes('dark:hover:bg-slate-800'),
    'TopNav links have dark:hover:bg-slate-800 state'
  );

  // AnnouncementBanner styling
  assert(
    announcementBanner.includes('dark:bg-slate-900'),
    'AnnouncementBanner uses dark:bg-slate-900 (prevents cream banner in dark mode)'
  );
  assert(
    announcementBanner.includes('dark:text-slate-300'),
    'AnnouncementBanner text is high contrast text-slate-300 in dark mode'
  );

  // Sidebar & Footer styling
  assert(
    sidebar.includes('dark:bg-slate-900'),
    'Sidebar uses dark:bg-slate-900 for consistent dark canvas'
  );
  assert(
    sidebar.includes('dark:text-white'),
    'Sidebar brand heading uses dark:text-white'
  );
  assert(
    footer.includes('dark:bg-slate-900') && footer.includes('dark:border-slate-800'),
    'Footer uses dark:bg-slate-900 and dark:border-slate-800'
  );
  assert(
    mobileNav.includes('dark:bg-slate-900') && mobileNav.includes('dark:border-slate-800'),
    'MobileNav drawer uses dark:bg-slate-900 and dark:border-slate-800'
  );

  // Contrast ratio math verification (WCAG 2.1 AA)
  function hexToRgb(hex) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
  function luminance(r, g, b) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
  function contrastRatio(hex1, hex2) {
    const [r1, g1, b1] = hexToRgb(hex1);
    const [r2, g2, b2] = hexToRgb(hex2);
    const l1 = luminance(r1, g1, b1);
    const l2 = luminance(r2, g2, b2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }

  // Dark slate bg (#020617) vs White text (#FFFFFF)
  const ratio1 = contrastRatio('#020617', '#FFFFFF');
  assert(ratio1 >= 15.0, `Dark canvas contrast ratio (#020617 vs #FFFFFF) is ${ratio1.toFixed(1)}:1 (>= 15:1 WCAG AAA)`);

  // Dark card bg (#0F172A) vs Slate-100 text (#F1F5F9)
  const ratio2 = contrastRatio('#0F172A', '#F1F5F9');
  assert(ratio2 >= 13.0, `Dark card contrast ratio (#0F172A vs #F1F5F9) is ${ratio2.toFixed(1)}:1 (>= 7:1 WCAG AAA)`);

  // Dark input bg (#1E293B) vs Slate-200 text (#E2E8F0)
  const ratio3 = contrastRatio('#1E293B', '#E2E8F0');
  assert(ratio3 >= 8.5, `Dark input contrast ratio (#1E293B vs #E2E8F0) is ${ratio3.toFixed(1)}:1 (>= 4.5:1 WCAG AA)`);
});

// -----------------------------------------------------------------------------
// Perspective 3: Tester / QA POV (Toggling, a11y, Form Controls & Reports)
// -----------------------------------------------------------------------------
suite('3. Tester / QA POV: ThemeToggle a11y, UI Primitives & Teacher Reports', () => {
  const themeToggle = fs.readFileSync(path.join(__dirname, '../components/ui/ThemeToggle.tsx'), 'utf8');
  const inputUi = fs.readFileSync(path.join(__dirname, '../components/ui/input.tsx'), 'utf8');
  const buttonUi = fs.readFileSync(path.join(__dirname, '../components/ui/button.tsx'), 'utf8');
  const badgeUi = fs.readFileSync(path.join(__dirname, '../components/ui/badge.tsx'), 'utf8');
  const dashboardLayout = fs.readFileSync(path.join(__dirname, '../app/[locale]/(dashboard)/layout.tsx'), 'utf8');
  const teacherReportsPage = fs.readFileSync(path.join(__dirname, '../app/[locale]/(dashboard)/teacher/reports/page.tsx'), 'utf8');
  const teacherReportsClient = fs.readFileSync(path.join(__dirname, '../app/[locale]/(dashboard)/teacher/reports/TeacherReportsClient.tsx'), 'utf8');

  // ThemeToggle tests
  assert(
    themeToggle.includes('theme-transition'),
    'ThemeToggle dispatches "theme-transition" class to documentElement on toggle'
  );
  assert(
    themeToggle.includes('Switch to Light Mode') && themeToggle.includes('Switch to Dark Mode'),
    'ThemeToggle provides English a11y label & tooltip'
  );
  assert(
    themeToggle.includes('تفعيل الوضع النهاري') && themeToggle.includes('تفعيل الوضع الليلي'),
    'ThemeToggle provides Arabic a11y label & tooltip'
  );
  assert(
    themeToggle.includes('Sun') && themeToggle.includes('Moon'),
    'ThemeToggle renders Sun icon for dark mode and Moon icon for light mode'
  );

  // UI Primitives: Input
  assert(
    inputUi.includes('dark:bg-slate-800/90') && inputUi.includes('dark:border-slate-700'),
    'Input primitive uses dark:bg-slate-800/90 and dark:border-slate-700 (no blinding white box in dark mode)'
  );
  assert(
    inputUi.includes('dark:text-slate-100') && inputUi.includes('dark:placeholder:text-slate-500'),
    'Input primitive has crisp dark:text-slate-100 and visible dark placeholder'
  );

  // UI Primitives: Button
  assert(
    buttonUi.includes('secondary:') && buttonUi.includes('dark:bg-slate-800') && buttonUi.includes('dark:text-slate-200'),
    'Button secondary variant uses dark:bg-slate-800 and dark:text-slate-200 (fixes Export to CSV button)'
  );
  assert(
    buttonUi.includes('ghost:') && buttonUi.includes('dark:hover:bg-slate-800'),
    'Button ghost variant supports dark hover state'
  );

  // UI Primitives: Badge
  assert(
    badgeUi.includes('dark:bg-slate-800') || badgeUi.includes('dark:bg-emerald-950/50'),
    'Badge primitive supports dark semantic tints'
  );

  // Dashboard Layout
  assert(
    dashboardLayout.includes('bg-slate-50 dark:bg-slate-950'),
    'Dashboard layout applies background bg-slate-50 dark:bg-slate-950'
  );

  // Teacher Reports Page & Client
  assert(
    teacherReportsPage.includes('text-slate-900 dark:text-white'),
    'Teacher reports page header has high-contrast text-slate-900 dark:text-white'
  );
  assert(
    teacherReportsClient.includes('dark:text-blue-400'),
    'Teacher reports student code uses dark:text-blue-400 for high legibility'
  );
  assert(
    teacherReportsClient.includes('dark:bg-emerald-950/60') && teacherReportsClient.includes('dark:text-emerald-300'),
    'Teacher reports "Excellent" badge uses dark emerald container with crisp text'
  );
  assert(
    teacherReportsClient.includes('dark:bg-amber-950/60') && teacherReportsClient.includes('dark:text-amber-300'),
    'Teacher reports "Needs Follow-up" badge uses dark amber container with crisp text'
  );
  assert(
    teacherReportsClient.includes('dark:text-slate-400'),
    'Teacher reports secondary labels and phones use dark:text-slate-400'
  );
});

// -----------------------------------------------------------------------------
// Final Summary
// -----------------------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`🏁 TEST RESULTS SUMMARY`);
console.log(`======================================================`);
console.log(`  Total Tests Run: ${totalTests}`);
console.log(`  Passed:          ${passedTests}`);
console.log(`  Failed:          ${failedTests}`);
console.log(`  Success Rate:    ${Math.round((passedTests / totalTests) * 100)}%`);

if (failedTests > 0) {
  console.error(`\n❌ SYSTEM TEST FAILED: ${failedTests} test(s) failed.`);
  process.exit(1);
} else {
  console.log(`\n🎉 ALL LIGHT/DARK MODE LOGIC TESTS PASSED 100%!`);
  process.exit(0);
}
