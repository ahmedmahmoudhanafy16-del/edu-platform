// middleware.ts — uses routing object from i18n/routing.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match every path except: API routes, Next.js internals, static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
