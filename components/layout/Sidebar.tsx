'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { settingsApi } from '@/lib/api/settings';
import { useAppSelector } from '@/lib/store/hooks';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  FileText,
  DollarSign,
  BookMarked,
  Calendar,
  MessageSquare,
  Settings,
  Menu,
  X,
  School,
  Clock,
  CalendarDays,
  FileQuestion,
  Building2,
  Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const allMenuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['admin', 'teacher', 'staff', 'principal'] },
  { icon: Users, label: 'Students', href: '/dashboard/students', roles: ['admin', 'teacher', 'principal'] },
  { icon: GraduationCap, label: 'Teachers', href: '/dashboard/teachers', roles: ['admin', 'principal'] },
  { icon: BookOpen, label: 'Courses', href: '/dashboard/courses', roles: ['admin', 'teacher', 'principal'] },
  { icon: Building2, label: 'Classes', href: '/dashboard/classes', roles: ['admin', 'teacher', 'principal'] },
  { icon: ClipboardCheck, label: 'Attendance', href: '/dashboard/attendance', roles: ['admin', 'teacher', 'principal'] },
  { icon: FileText, label: 'Admissions', href: '/dashboard/admissions', roles: ['admin', 'principal'] },
  { icon: DollarSign, label: 'Financial', href: '/dashboard/financial', roles: ['admin', 'principal'] },
  { icon: BookMarked, label: 'Academics', href: '/dashboard/academics', roles: ['admin', 'teacher', 'principal'] },
  { icon: Award, label: 'Grades', href: '/dashboard/grades', roles: ['admin', 'teacher', 'principal'] },
  { icon: Clock, label: 'Timetable', href: '/dashboard/timetable', roles: ['admin', 'teacher', 'principal'] },
  { icon: CalendarDays, label: 'Calendar', href: '/dashboard/calendar', roles: ['admin', 'teacher', 'principal'] },
  { icon: FileQuestion, label: 'Exam Timetable', href: '/dashboard/exam-timetable', roles: ['admin', 'principal'] },
  { icon: Calendar, label: 'Leaves', href: '/dashboard/leaves', roles: ['admin', 'teacher', 'principal'] },
  { icon: CalendarDays, label: 'Holidays', href: '/dashboard/holidays', roles: ['admin', 'principal'] },
  { icon: MessageSquare, label: 'Communications', href: '/dashboard/communications', roles: ['admin', 'teacher', 'principal'] },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings', roles: ['admin', 'teacher', 'staff', 'principal'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  // Sort menu items by href length (longest first) to prioritize more specific routes
  const sortedMenuItems = useMemo(() => {
    return [...menuItems].sort((a, b) => b.href.length - a.href.length);
  }, [menuItems]);

  // Find the most specific active menu item
  const activeHref = useMemo(() => {
    // Check for exact match first
    const exactMatch = menuItems.find(item => pathname === item.href);
    if (exactMatch) return exactMatch.href;

    // Find the most specific prefix match
    const prefixMatch = sortedMenuItems.find(item => 
      pathname.startsWith(item.href + '/')
    );
    return prefixMatch?.href || null;
  }, [pathname, menuItems, sortedMenuItems]);

  useEffect(() => {
    loadLogo();
  }, []);

  const loadLogo = async () => {
    try {
      const setting = await settingsApi.getSetting('logo_url');
      if (setting?.value) {
        setLogoUrl(setting.value);
      }
    } catch (error) {
      console.error('Failed to load logo:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform',
          'lg:translate-x-0',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center mb-8 px-3">
            {logoUrl ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${logoUrl}`}
                alt="School Logo"
                className="h-10 w-10 object-contain mr-2"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <School className="h-8 w-8 text-primary mr-2" />
            )}
            <span className="text-xl font-bold">School Management</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === activeHref;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

