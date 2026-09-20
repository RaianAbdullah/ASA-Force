import React from 'react';
import { Link, useLocation, useRouter } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Calendar, 
  Clock, 
  Plane, 
  MessageSquare, 
  Bell, 
  Repeat, 
  User, 
  LayoutDashboard, 
  Users, 
  Activity, 
  CalendarDays, 
  FileText, 
  Building, 
  Megaphone,
  LogOut,
  Menu,
  X,
  Shield,
  UserCircle2,
  StickyNote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { hasAnyRole } from '@/services/auth';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const employeeNav: NavItem[] = [
  { href: '/', label: 'الرئيسية', icon: Home },
  { href: '/schedule', label: 'جدول العمل', icon: Calendar },
  { href: '/attendance', label: 'سجل الحضور', icon: Clock },
  { href: '/vacations', label: 'الإجازات', icon: Plane },
  { href: '/messages', label: 'الرسائل', icon: MessageSquare },
  { href: '/announcements', label: 'الإشعارات والتبليغات', icon: Bell },
  { href: '/shift-swap', label: 'تبديل الورديات', icon: Repeat },
  { href: '/profile', label: 'الملف الشخصي', icon: User },
  { href: '/my-notes', label: 'ملاحظاتي الإدارية', icon: StickyNote },
];

const adminNav: NavItem[] = [
  { href: '/admin', label: 'لوحة الإدارة', icon: LayoutDashboard },
  { href: '/admin/employees', label: 'الموظفون', icon: Users },
  { href: '/admin/on-duty', label: 'الحضور اليوم', icon: Activity },
  { href: '/admin/schedules', label: 'الجداول', icon: CalendarDays },
  { href: '/admin/vacations', label: 'طلبات الإجازة', icon: FileText },
  { href: '/admin/departments', label: 'الأقسام', icon: Building },
  { href: '/admin/announcements', label: 'التبليغات', icon: Megaphone },
  { href: '/admin/swap-requests', label: 'طلبات التبديل', icon: Repeat },
];

export const Shell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, logout } = useAuth();
  const { isRTL } = useLanguage();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const router = useRouter();
  const isAdmin = session ? hasAnyRole(session.roles, ['SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER']) : false;
  const isInAdminSection = location.startsWith('/admin');

  const handleViewSwitch = () => {
    setIsMobileMenuOpen(false);
    if (isInAdminSection) {
      window.location.href = (router.base || '') + '/';
    } else {
      window.location.href = (router.base || '') + '/admin';
    }
  };

  const NavLinks = ({ items, className }: { items: NavItem[], className?: string }) => (
    <nav className={cn("space-y-1", className)}>
      {items.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <span
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className={cn(
      'min-h-[100dvh] flex flex-col md:flex-row bg-background text-foreground selection:bg-primary/30',
    )}>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
            <span className="text-primary font-bold text-sm">ASA</span>
          </div>
          <span className="font-semibold text-base text-white truncate">إدارة العمليات الأمنية</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ms-2">
          {isAdmin && (
            <Button
              variant="ghost" size="icon"
              onClick={handleViewSwitch}
              title={isInAdminSection ? 'عرض بوابة الموظف' : 'عرض لوحة الإدارة'}
              className={isInAdminSection ? 'text-primary hover:text-primary/80' : 'text-[#C9963F] hover:text-[#C9963F]/80'}
            >
              {isInAdminSection ? <UserCircle2 className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 z-50 w-72 bg-sidebar border-border transform transition-transform duration-300 ease-in-out md:relative md:transform-none flex flex-col',
        isRTL ? 'right-0 border-l' : 'left-0 border-r',
        isMobileMenuOpen
          ? 'translate-x-0'
          : isRTL
            ? 'translate-x-full md:translate-x-0'
            : '-translate-x-full md:translate-x-0',
      )}>
        <div className="p-6 hidden md:flex items-center gap-3 border-b border-border/50">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,230,118,0.15)]">
            <span className="text-primary font-bold">ASA</span>
          </div>
          <div>
            <h2 className="font-bold tracking-tight text-white">إدارة العمليات الأمنية</h2>
            <p className="text-xs text-muted-foreground">بوابة الموظفين</p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-8">
            <div>
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                القائمة الرئيسية
              </h3>
              <NavLinks items={employeeNav} />
            </div>

            {isAdmin && (
              <div>
                <h3 className="px-3 text-xs font-semibold text-[#C9963F] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9963F]" />
                  الإدارة
                </h3>
                <NavLinks items={adminNav} />
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-border/50 space-y-2">
          {isAdmin && (
            <button
              onClick={handleViewSwitch}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border ${
                isInAdminSection
                  ? 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/15'
                  : 'bg-[#C9963F]/10 border-[#C9963F]/20 text-[#C9963F] hover:bg-[#C9963F]/15'
              }`}
            >
              {isInAdminSection
                ? <><UserCircle2 className="h-4 w-4 shrink-0" /> التبديل إلى بوابة الموظف</>
                : <><Shield className="h-4 w-4 shrink-0" /> التبديل إلى لوحة الإدارة</>}
            </button>
          )}
          <div className="bg-card/50 rounded-xl p-3 flex items-center justify-between border border-border">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {session?.nameAr.charAt(0) || 'م'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{session?.nameAr}</p>
                <p className="text-xs text-primary/80 truncate">
                  {session?.departmentNameAr || 'القسم غير محدد'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">{session?.role}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gradient-to-br from-background via-background to-card/5">
        {/* Ambient subtle noise overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        
        <ScrollArea className="flex-1 z-10">
          <div className="container max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};
