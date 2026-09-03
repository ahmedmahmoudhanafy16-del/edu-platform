// middleware.ts — Global Security Firewall & Localization Router
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Split path to find locale and target resource
  const segments = pathname.split('/');
  const hasLocalePrefix = routing.locales.includes(segments[1] as any);
  const locale = hasLocalePrefix ? segments[1] : routing.defaultLocale;
  const pathWithoutLocale = hasLocalePrefix
    ? '/' + segments.slice(2).join('/')
    : pathname;

  const isTeacherRoute = pathWithoutLocale.startsWith('/teacher');
  const isStudentRoute = pathWithoutLocale.startsWith('/student');

  // Read session from user_session cookie
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

  // 1. Guard Teacher Pages: Strictly TEACHER or ADMIN only
  if (isTeacherRoute) {
    if (!userSession || (userSession.role !== 'TEACHER' && userSession.role !== 'ADMIN')) {
      const loginUrl = new URL(`/${locale}/login`, req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Guard Student Pages: Strictly authenticated STUDENT only
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
  // Match every path except: API routes, Next.js internals, static files, favicon
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
