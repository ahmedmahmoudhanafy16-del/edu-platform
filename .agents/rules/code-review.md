# Code Review & Quality Standards

## Rules & Checklist
1. **Server vs Client Components**:
   - Default to React Server Components (RSC) for pages and data loading.
   - Use `'use client'` only when state, event handlers, lifecycle hooks, or browser APIs are required.
2. **TypeScript Strictness**:
   - All interfaces, props, and server actions must be strictly typed.
   - Avoid `any` without specific reason.
3. **Database Access**:
   - Always use the singleton Prisma client from `@/lib/prisma`.
   - Never initiate multiple PrismaClient instances.
4. **Localization (next-intl)**:
   - Use `useTranslations` or `getTranslations` for all user-facing strings.
   - Never hardcode English strings on Arabic routes.
5. **Data Export & Files**:
   - Arabic CSV files must include the UTF-8 BOM (`\uFEFF`) to open cleanly in Excel without mangling characters.
