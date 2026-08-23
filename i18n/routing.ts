// i18n/routing.ts
// Single source of truth for locales — imported by middleware AND request config
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  localePrefix: 'as-needed', // /ar/... optional, root = Arabic
});
