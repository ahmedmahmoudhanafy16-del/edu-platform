// middleware.ts — Global Security Firewall & Localization Router
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Never intercept internal or static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Split path to find locale and target resource
  const segments = pathname.split('/');
  const hasLocalePrefix = routing.locales.includes(segments[1] as any);
  const locale = hasLocalePrefix ? segments[1] : routing.defaultLocale;
  const pathWithoutLocale = hasLocalePrefix
    ? '/' + segments.slice(2).join('/')
    : pathname;

  // 3. Public Auth Pages: NEVER redirect or protect (Prevents infinite loops!)
  if (
    pathWithoutLocale === '' ||
    pathWithoutLocale === '/' ||
    pathWithoutLocale === '/student-login' ||
    pathWithoutLocale.startsWith('/student-login/') ||
    pathWithoutLocale === '/login' ||
    pathWithoutLocale.startsWith('/login/') ||
    pathWithoutLocale === '/logout' ||
    pathWithoutLocale === '/suspended'
  ) {
    return intlMiddleware(req);
  }

  // 4. Strict route identification: Must be '/teacher/' or '/student/' (NOT '/student-login')
  const isTeacherRoute = pathWithoutLocale === '/teacher' || pathWithoutLocale.startsWith('/teacher/');
  const isStudentRoute = pathWithoutLocale === '/student' || pathWithoutLocale.startsWith('/student/');

  if (!isTeacherRoute && !isStudentRoute) {
    return intlMiddleware(req);
  }

  // 5. Read session safely
  const sessionCookie = req.cookies.get('user_session')?.value;
  let userSession: any = null;
  if (sessionCookie) {
    try {
      userSession = JSON.parse(decodeURIComponent(sessionCookie));
    } catch {
      try {
        userSession = JSON.parse(sessionCookie);
      } catch {}
    }
  }

  // 6. Guard Teacher Pages: Strictly TEACHER or ADMIN only
  if (isTeacherRoute) {
    if (!userSession || (userSession.role !== 'TEACHER' && userSession.role !== 'ADMIN')) {
      const loginUrl = new URL(`/${locale}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 7. Guard Student Pages: Strictly authenticated STUDENT only
  if (isStudentRoute) {
    if (!userSession || userSession.role !== 'STUDENT') {
      const returnTarget = pathname + search;
      const studentLoginUrl = new URL(
        `/${locale}/student-login?redirect=${encodeURIComponent(returnTarget)}`,
        req.url
      );
      return NextResponse.redirect(studentLoginUrl);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  // Match every path except: API routes, Next.js internals, static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
