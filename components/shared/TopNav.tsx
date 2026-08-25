'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { GraduationCap, LogOut, Menu, Bell, ChevronDown } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

interface TopNavProps {
  role?: 'TEACHER' | 'STUDENT';
  userName?: string;
  brandName?: string;
}

interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

export function TopNav({
  role: _role,
  userName: initialName,
  brandName = 'منصة التعليم',
}: TopNavProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-detect role from URL — never depends on a slow DB query
  const isTeacher = pathname.includes('/teacher');
  const role = isTeacher ? 'TEACHER' : 'STUDENT';
  const userName = initialName ?? (isTeacher ? 'أ/ أحمد محمود' : 'يوسف الطالب');
  const base = `/${locale}/${isTeacher ? 'teacher' : 'student'}`;

  const teacherLinks: NavLink[] = [
    { label: 'الرئيسية',     href: `/${locale}/teacher` },
    { label: 'الفصول',       href: `/${locale}/teacher/classrooms` },
    { label: 'الواجبات',     href: `/${locale}/teacher/assignments` },
    { label: 'الامتحانات',   href: `/${locale}/teacher/quizzes` },
    { label: 'الطلاب',       href: `/${locale}/teacher/students` },
    { label: 'البث المباشر', href: `/${locale}/teacher/live`, badge: 'LIVE' },
  ];

  const studentLinks: NavLink[] = [
    { label: 'الرئيسية',     href: `/${locale}/student` },
    { label: 'الاختبارات',   href: `/${locale}/student/quizzes` },
    { label: 'الواجبات',     href: `/${locale}/student/assignments` },
    { label: 'سجل الدرجات', href: `/${locale}/student/grades` },
    { label: 'لوحة الشرف',  href: `/${locale}/student/leaderboard` },
    { label: 'البث المباشر', href: `/${locale}/student/live`, badge: 'LIVE' },
  ];

  const links = role === 'TEACHER' ? teacherLinks : studentLinks;

  const isActive = (href: string) =>
    href === base ? pathname === href : pathname.startsWith(href);

  const initials = userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <header
      dir="rtl"
      className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-3">

        {/* ── Brand ─────────────────────────────────────────── */}
        <Link href={base} prefetch className="flex items-center gap-2 flex-shrink-0 me-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
            <GraduationCap className="h-4 w-4 text-primary-foreground" strokeWidth={2} />
          </div>
          <span className="hidden sm:block text-sm font-bold text-foreground leading-none tracking-tight">
            {brandName}
          </span>
        </Link>

        {/* ── Desktop Navigation ────────────────────────────── */}
        <NavigationMenu className="hidden md:flex flex-1" dir="rtl">
          <NavigationMenuList className="gap-0.5">
            {links.map(({ label, href, badge }) => (
              <NavigationMenuItem key={href}>
                <Link href={href} prefetch legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      'h-8 px-3 text-sm font-medium gap-1.5',
                      isActive(href)
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {label}
                    {badge === 'LIVE' && (
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* ── Spacer ────────────────────────────────────────── */}
        <div className="flex-1 md:hidden" />

        {/* ── Right Controls ────────────────────────────────── */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />
          <LanguageSwitcher />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-8 w-8 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 end-1 h-1.5 w-1.5 rounded-full bg-destructive" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden sm:flex items-center gap-2 h-8 px-2 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer border border-transparent">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium text-foreground max-w-[80px] truncate">
                {userName}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52" dir="rtl">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {role === 'TEACHER' ? 'معلم' : 'طالب'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-destructive cursor-pointer" onClick={() => window.location.href = `/${locale}/login`}>
                <LogOut className="h-3.5 w-3.5" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted text-foreground transition-colors cursor-pointer border border-transparent">
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0" dir="rtl">
              <SheetHeader className="px-5 py-4 border-b border-border/60">
                <SheetTitle className="flex items-center gap-2 text-start text-base">
                  <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                    <GraduationCap className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  {brandName}
                </SheetTitle>
              </SheetHeader>

              {/* User in mobile */}
              <div className="px-5 py-3 flex items-center gap-3 border-b border-border/40">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {role === 'TEACHER' ? 'معلم' : 'طالب'}
                  </p>
                </div>
              </div>

              {/* Nav links */}
              <nav className="px-3 py-3 space-y-0.5">
                {links.map(({ label, href, badge }) => (
                  <Link
                    key={href}
                    href={href}
                    prefetch
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive(href)
                        ? 'bg-accent text-accent-foreground font-semibold'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {label}
                    {badge === 'LIVE' && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                        مباشر
                      </Badge>
                    )}
                  </Link>
                ))}
              </nav>

              <Separator className="my-2" />
              <div className="px-3 pb-4">
                <Link
                  href={`/${locale}/login`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  تسجيل الخروج
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
