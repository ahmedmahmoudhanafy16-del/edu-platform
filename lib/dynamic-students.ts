import fs from 'fs';
import path from 'path';

declare global {
  var dynamicStudentsList: any[] | undefined;
}

if (!global.dynamicStudentsList) {
  global.dynamicStudentsList = [];
}

function getTmpFilePath(): string {
  // On Windows or Unix /tmp
  const dir = process.platform === 'win32' ? (process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp') : '/tmp';
  return path.join(dir, 'dynamic_students.json');
}

export function getDynamicStudents(): any[] {
  try {
    const tmpFile = getTmpFilePath();
    if (fs.existsSync(tmpFile)) {
      const data = fs.readFileSync(tmpFile, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const map = new Map<string, any>();
        (global.dynamicStudentsList || []).forEach((s) => map.set(s.studentCode || s.id, s));
        parsed.forEach((s) => map.set(s.studentCode || s.id, s));
        global.dynamicStudentsList = Array.from(map.values());
      }
    }
  } catch (e) {}

  return global.dynamicStudentsList || [];
}

export function saveDynamicStudents(students: any[]): void {
  if (!Array.isArray(students)) return;

  try {
    const map = new Map<string, any>();
    (global.dynamicStudentsList || []).forEach((s) => map.set(s.studentCode || s.id, s));
    students.forEach((s) => {
      if (s && (s.studentCode || s.id)) {
        map.set(s.studentCode || s.id, s);
      }
    });

    global.dynamicStudentsList = Array.from(map.values());

    try {
      const tmpFile = getTmpFilePath();
      fs.writeFileSync(tmpFile, JSON.stringify(global.dynamicStudentsList), 'utf8');
    } catch (fsErr) {}
  } catch (e) {}
}

export function addDynamicStudent(student: any): void {
  if (!student) return;
  saveDynamicStudents([student]);
}

export function removeDynamicStudent(idOrCode: string): void {
  if (!idOrCode) return;
  const clean = String(idOrCode).trim().toUpperCase();
  try {
    const list = getDynamicStudents();
    const filtered = list.filter((s) => {
      const sId = String(s.id || '').trim().toUpperCase();
      const sCode = String(s.studentCode || '').trim().toUpperCase();
      return sId !== clean && sCode !== clean;
    });
    global.dynamicStudentsList = filtered;
    try {
      const tmpFile = getTmpFilePath();
      fs.writeFileSync(tmpFile, JSON.stringify(filtered), 'utf8');
    } catch (fsErr) {}
  } catch (e) {}
}

export function updateDynamicStudent(student: any): void {
  if (!student || (!student.id && !student.studentCode)) return;
  const targetId = String(student.id || '').trim().toUpperCase();
  const targetCode = String(student.studentCode || '').trim().toUpperCase();

  try {
    const list = getDynamicStudents();
    const updated = list.map((s) => {
      const sId = String(s.id || '').trim().toUpperCase();
      const sCode = String(s.studentCode || '').trim().toUpperCase();
      if ((targetId && sId === targetId) || (targetCode && sCode === targetCode)) {
        return { ...s, ...student };
      }
      return s;
    });
    global.dynamicStudentsList = updated;
    try {
      const tmpFile = getTmpFilePath();
      fs.writeFileSync(tmpFile, JSON.stringify(updated), 'utf8');
    } catch (fsErr) {}
  } catch (e) {}
}
