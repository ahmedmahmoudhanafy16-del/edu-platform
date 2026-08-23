# AGENTS.md — Platform Superpowers & System Rules

## 🧠 Active Plugins & Specialized Skills

### 1. 🌐 Omni (All-in-One Multi-Tool Orchestration)
- Autonomous tool chaining and multi-agent coordination.
- Parallel background task execution with reactive event-driven wakeups.
- Full filesystem, shell, git, and network tool integration.

### 2. 💾 Memory Engine (Claude Mem / Long-Term Knowledge)
- Persistent architecture decisions preserved across sessions:
  - TopNav architecture replaces vertical sidebars.
  - Arabic font standard: **Cairo** via Google Fonts.
  - Color palette: Warm stone neutrals (`#FAFAF7` - `#18180F`) + Single teal accent (`#0E7C7B`).
  - GitHub Remote: `https://github.com/ahmedmahmoudhanafy16-del/edu-platform.git`
  - Demo link: Cloudflare Tunnel daemon for instant live sharing.

### 3. ⚡ Superpowers (Agentic Execution & Autonomous Problem Solving)
- Self-healing: Automatically detect and resolve build errors, missing modules, or runtime exceptions.
- Verification-first: Test all endpoints with automated HTTP probes before declaring tasks complete.
- Parallel subagent spawning for complex research and refactors.

### 4. 🎛️ Headroom (Context & Token Optimization)
- High-signal, compact responses without repetitive file dumps.
- Strict token budgeting: focus on actionable code changes and clear summaries.
- Efficient file edits via targeted replacement rather than full overwrites where possible.

### 5. 🎨 Frontend Design (Enterprise Design System)
- **Design Tokens**:
  - Warm stone gray neutral scale (`n-50` to `n-900`).
  - Strictly **one** teal accent (`#0E7C7B`) — usage < 10% of total surface.
  - Crisp 1px borders (`border-n-200` light / `border-n-300` dark) — no complex box-shadows.
  - Transitions: 140ms on `background-color, border-color, color` only.
- **Typography**: Cairo font scale ($12px, 14px, 16px, 20px, 24px).
- **RTL/LTR**: Full bidirectional support with strict `dir="rtl"` alignment for Arabic.

### 6. 🔍 Code Review (Automated Quality & Standards)
- TypeScript strict typing (no `any` without justification).
- Next.js 14 App Router best practices: Server Components for data fetching, Client Components for interactivity.
- Prisma client singleton pattern (`lib/prisma.ts`) to prevent connection exhaustion.
- UTF-8 BOM encoding for Arabic CSV exports.

### 7. 🛡️ Security Review (Defense & Anti-Cheat)
- **Exam Integrity**: Real-time tab switch & blur detection, violation counters, auto-submit on limit.
- **Data Protection**: Role-based access control (TEACHER, STUDENT, PARENT).
- **Input Sanitization**: Parameterized queries via Prisma to prevent SQL injection.
- **Resource Security**: Dynamic watermarking on downloadable educational PDFs.

### 8. 🏗️ Stack Architecture
- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript.
- **Database / ORM**: Prisma ORM with SQLite (local) & Neon PostgreSQL (cloud).
- **Styling**: Tailwind CSS + next-themes (Dark/Light) + Lucide Icons.
- **Localization**: next-intl with request-based locale resolution.
- **Video/Live**: @jitsi/react-sdk with Arabic interface localization.
