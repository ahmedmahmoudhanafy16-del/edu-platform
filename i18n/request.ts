// i18n/request.ts  ← next-intl 3.22+ required location
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // requestLocale is a Promise in next-intl ≥ 3.22
  let locale = await requestLocale;

  // Fall back to default if middleware didn't set it or value is invalid
  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
