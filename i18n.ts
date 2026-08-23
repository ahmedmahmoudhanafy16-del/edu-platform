// i18n.ts — kept for backward compatibility
// The real config now lives in i18n/request.ts (next-intl 3.22+ convention)
// and routing constants live in i18n/routing.ts
export { routing } from './i18n/routing';
export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ar';
