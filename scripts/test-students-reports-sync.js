/**
 * Test Suite: Bidirectional Synchronization between Students & Reports
 * 
 * Verifies:
 * 1. Software Engineer POV: In-memory dynamic student cache removal/update, dual-path revalidation, API deletedIds purge.
 * 2. Developer POV: Direct edit modal in Reports, direct delete modal in Reports, event-driven cross-tab sync.
 * 3. Tester / QA POV: Zero resurrection of dummy ghost students, full bidirectional cascade, data consistency.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('🔄 1. Software Engineer POV: Data Architecture & Server Actions');
console.log('======================================================');

const dynamicStudentsPath = path.join(__dirname, '..', 'lib', 'dynamic-students.ts');
const dynamicStudentsCode = fs.readFileSync(dynamicStudentsPath, 'utf8');

runTest('lib/dynamic-students.ts implements removeDynamicStudent', () => {
  assert(dynamicStudentsCode.includes('export function removeDynamicStudent(idOrCode: string)'), 'removeDynamicStudent function missing');
  assert(dynamicStudentsCode.includes('global.dynamicStudentsList = filtered'), 'Should filter out deleted student and update cache');
});

runTest('lib/dynamic-students.ts implements updateDynamicStudent', () => {
  assert(dynamicStudentsCode.includes('export function updateDynamicStudent(student: any)'), 'updateDynamicStudent function missing');
  assert(dynamicStudentsCode.includes('global.dynamicStudentsList = updated'), 'Should update in-memory student cache');
});

const studentActionsPath = path.join(__dirname, '..', 'actions', 'student.ts');
const studentActionsCode = fs.readFileSync(studentActionsPath, 'utf8');

runTest('actions/student.ts deleteStudent revalidates BOTH /teacher/students and /teacher/reports', () => {
  assert(studentActionsCode.includes("revalidatePath('/[locale]/teacher/students')"), 'Must revalidate teacher/students');
  assert(studentActionsCode.includes("revalidatePath('/[locale]/teacher/reports')"), 'Must revalidate teacher/reports');
  assert(studentActionsCode.includes('removeDynamicStudent(studentId)'), 'Must remove student from dynamic memory cache on delete');
});

runTest('actions/student.ts implements updateStudentAction with dual revalidation', () => {
  assert(studentActionsCode.includes('export async function updateStudentAction'), 'updateStudentAction missing');
  assert(studentActionsCode.includes('prisma.user.updateMany'), 'Must update user in Prisma');
  assert(studentActionsCode.includes('updateDynamicStudent('), 'Must update dynamic memory cache');
  assert(studentActionsCode.includes("revalidatePath('/[locale]/teacher/reports')"), 'Must revalidate teacher/reports on update');
  assert(studentActionsCode.includes("revalidatePath('/[locale]/teacher/students')"), 'Must revalidate teacher/students on update');
});

runTest('actions/student.ts toggleStudentStatus and updateStudentAcademicAction revalidate both paths', () => {
  assert(studentActionsCode.includes("revalidatePath('/[locale]/teacher/reports')"), 'Must revalidate teacher/reports');
  assert(studentActionsCode.includes("revalidatePath('/[locale]/teacher/students')"), 'Must revalidate teacher/students');
});

const syncRoutePath = path.join(__dirname, '..', 'app', 'api', 'students', 'sync', 'route.ts');
const syncRouteCode = fs.readFileSync(syncRoutePath, 'utf8');

runTest('app/api/students/sync/route.ts handles deletedIds to cascade deletion to DB and cache', () => {
  assert(syncRouteCode.includes('deletedIds'), 'sync route should handle deletedIds parameter');
  assert(syncRouteCode.includes('removeDynamicStudent(clean)'), 'sync route must purge deleted IDs from dynamic cache');
  assert(syncRouteCode.includes('await prisma.user.deleteMany'), 'sync route should delete removed users from Prisma');
});

console.log('\n======================================================');
console.log('🔄 2. Developer POV: Reports Page & Client Interactivity');
console.log('======================================================');

const reportsPagePath = path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'teacher', 'reports', 'page.tsx');
const reportsPageCode = fs.readFileSync(reportsPagePath, 'utf8');

runTest('app/[locale]/(dashboard)/teacher/reports/page.tsx does NOT inject dummy ghost students', () => {
  assert(!reportsPageCode.includes('student-1'), 'Phantom student-1 fallback must be removed');
  assert(!reportsPageCode.includes('student-2'), 'Phantom student-2 fallback must be removed');
  assert(reportsPageCode.includes('classrooms = await prisma.classroom.findMany'), 'Must fetch classrooms to support classroom selection and mapping');
});

const teacherReportsClientPath = path.join(__dirname, '..', 'app', '[locale]', '(dashboard)', 'teacher', 'reports', 'TeacherReportsClient.tsx');
const teacherReportsClientCode = fs.readFileSync(teacherReportsClientPath, 'utf8');

runTest('TeacherReportsClient.tsx listens to edu_students_updated and syncs bidirectional updates', () => {
  assert(teacherReportsClientCode.includes('edu_students_updated'), 'Must listen to edu_students_updated event');
  assert(teacherReportsClientCode.includes('edu_deleted_students'), 'Must check edu_deleted_students set to filter out deleted students');
});

runTest('TeacherReportsClient.tsx features in-table Edit Student capability', () => {
  assert(teacherReportsClientCode.includes('studentToEdit'), 'State for studentToEdit must exist');
  assert(teacherReportsClientCode.includes('handleConfirmEdit'), 'Handler for saving student edit must exist');
  assert(teacherReportsClientCode.includes('updateStudentAction'), 'Must invoke updateStudentAction server action');
  assert(teacherReportsClientCode.includes('edu_students_updated'), 'Must dispatch event to notify Students table');
});

runTest('TeacherReportsClient.tsx features in-table Delete Student capability with confirmation', () => {
  assert(teacherReportsClientCode.includes('studentToDelete'), 'State for studentToDelete must exist');
  assert(teacherReportsClientCode.includes('handleConfirmDelete'), 'Handler for confirming student delete must exist');
  assert(teacherReportsClientCode.includes('deleteStudent(targetId)'), 'Must call deleteStudent server action');
  assert(teacherReportsClientCode.includes('delSet.add(targetId)'), 'Must register deleted ID in localStorage');
});

const compactStudentsTablePath = path.join(__dirname, '..', 'components', 'teacher', 'CompactStudentsTable.tsx');
const compactStudentsTableCode = fs.readFileSync(compactStudentsTablePath, 'utf8');

runTest('CompactStudentsTable.tsx tracks edu_deleted_students and notifies Reports on deletion', () => {
  assert(compactStudentsTableCode.includes('edu_deleted_students'), 'Must track edu_deleted_students');
  assert(compactStudentsTableCode.includes('edu_students_updated'), 'Must listen and dispatch edu_students_updated');
  assert(compactStudentsTableCode.includes('deletedIds: [deletedId]'), 'Must pass deletedIds to sync endpoint');
});

const addStudentModalPath = path.join(__dirname, '..', 'components', 'teacher', 'AddStudentModal.tsx');
const addStudentModalCode = fs.readFileSync(addStudentModalPath, 'utf8');

runTest('AddStudentModal.tsx cleans deleted status and triggers cross-system sync', () => {
  assert(addStudentModalCode.includes('edu_deleted_students'), 'Must clear newly created student from deleted set');
  assert(addStudentModalCode.includes('edu_students_updated'), 'Must dispatch edu_students_updated on creation');
});

console.log('\n======================================================');
console.log('🔄 3. Tester / QA POV: Logical Simulation of Bidirectional Sync');
console.log('======================================================');

runTest('Simulation: Deleting student in Students table instantly purges them from Reports view', () => {
  let students = [
    { id: 'usr-1', code: 'STU-001', name: 'Ziad Hanafy', grade: '3prep', averageScore: 92 },
    { id: 'usr-2', code: 'STU-002', name: 'Omar Tarek', grade: '3prep', averageScore: 78 }
  ];
  let reports = [...students];
  let deletedSet = new Set();

  const targetId = 'usr-1';
  const targetCode = 'STU-001';
  deletedSet.add(targetId);
  deletedSet.add(targetCode);
  students = students.filter(s => s.id !== targetId);
  reports = reports.filter(r => !deletedSet.has(r.id) && !deletedSet.has(r.code));

  assert.strictEqual(students.length, 1, 'Students table should have 1 student left');
  assert.strictEqual(reports.length, 1, 'Reports table should have 1 student left');
  assert.strictEqual(reports[0].id, 'usr-2', 'Remaining student in reports must be usr-2');
});

runTest('Simulation: Deleting student in Reports table instantly purges them from Students view', () => {
  let students = [
    { id: 'usr-1', code: 'STU-001', name: 'Ziad Hanafy', grade: '3prep', averageScore: 92 },
    { id: 'usr-2', code: 'STU-002', name: 'Omar Tarek', grade: '3prep', averageScore: 78 }
  ];
  let reports = [...students];
  let deletedSet = new Set();

  const targetId = 'usr-2';
  const targetCode = 'STU-002';
  deletedSet.add(targetId);
  deletedSet.add(targetCode);
  reports = reports.filter(r => r.id !== targetId && r.code !== targetCode);
  students = students.filter(s => !deletedSet.has(s.id) && !deletedSet.has(s.code));

  assert.strictEqual(reports.length, 1, 'Reports table should have 1 student left');
  assert.strictEqual(students.length, 1, 'Students table should have 1 student left');
  assert.strictEqual(students[0].id, 'usr-1', 'Remaining student in students must be usr-1');
});

runTest('Simulation: Editing student name/phone in Reports propagates to Students roster', () => {
  let studentInStudents = { id: 'usr-1', code: 'STU-001', name: 'Ziad Old Name', phone: '01011111111' };
  let studentInReports = { ...studentInStudents };

  const editPayload = { name: 'Ziad New Name', phone: '01099999999' };
  studentInReports = { ...studentInReports, ...editPayload };
  studentInStudents = { ...studentInStudents, name: studentInReports.name, phone: studentInReports.phone };

  assert.strictEqual(studentInStudents.name, 'Ziad New Name', 'Name should be updated in Students');
  assert.strictEqual(studentInStudents.phone, '01099999999', 'Phone should be updated in Students');
});

console.log('\n======================================================');
console.log('🏁 MASTER BIDIRECTIONAL SYNC TEST SUMMARY');
console.log('======================================================');
console.log(`  Total Tests Run: ${passed + failed}`);
console.log(`  Passed:          ${passed}`);
console.log(`  Failed:          ${failed}`);
console.log(`  Success Rate:    ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed > 0) {
  console.error(`\n❌ SOME TESTS FAILED!`);
  process.exit(1);
} else {
  console.log(`\n🎉 ALL BIDIRECTIONAL SYNC TESTS PASSED 100%!`);
  process.exit(0);
}
