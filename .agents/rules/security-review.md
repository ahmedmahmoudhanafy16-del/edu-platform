# Security Review & Anti-Cheat Standards

## Anti-Cheat Mechanics
1. **Exam Window Integrity**:
   - Track `document.visibilityState` changes and `window.blur` events.
   - Increment violation counters and record timestamps in database.
   - Automatically auto-submit the exam upon exceeding `maxViolations` threshold.
2. **Answer Resilience**:
   - Cache exam answers in `localStorage` under `quiz_answers_{quizId}_{studentId}`.
   - Restore cached answers on page refresh or accidental disconnect.
3. **Authentication & Authorization**:
   - Passwords must be hashed with bcrypt (`bcryptjs`).
   - Validate student and parent access tokens before serving grade reports.
4. **Data Isolation**:
   - All server actions must filter data strictly by `teacherId` or `studentId`.
   - Never leak other students' grades or violation logs.
