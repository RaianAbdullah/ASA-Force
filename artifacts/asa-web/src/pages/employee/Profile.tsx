import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Shield, KeyRound, Smartphone, Fingerprint } from 'lucide-react';
import { Link } from 'wouter';

export const Profile: React.FC = () => {
  const { session } = useAuth();

  const roleMap: Record<string, string> = {
    SYSTEM_ADMIN: 'مدير النظام',
    MAIN_MANAGER: 'المدير العام',
    DEPARTMENT_MANAGER: 'مدير القسم',
    WEEKEND_MANAGER: 'مدير المناوبة (عطلة)',
    RESPONSIBLE_OFFICER: 'الضابط المسؤول',
    EMPLOYEE: 'موظف',
  };

  const roleName = session?.role ? (roleMap[session.role] || session.role) : 'مستخدم';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader 
        title="الملف الشخصي" 
        description="إدارة معلومات حسابك وإعدادات الأمان"
      />

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border bg-card/60 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
              <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl font-bold text-primary border border-primary/20 shadow-inner z-10 shrink-0">
                {session?.nameAr.charAt(0) || 'م'}
              </div>
              <div className="space-y-2 z-10">
                <h2 className="text-2xl font-bold text-foreground">{session?.nameAr}</h2>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                    <Shield className="h-3.5 w-3.5" /> {roleName}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" /> المعلومات الأساسية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-black/20 border border-white/5">
                <p className="text-xs text-muted-foreground mb-1">المعرف الفريد للموظف</p>
                <p className="font-mono text-sm tracking-tight text-foreground truncate" dir="ltr">{session?.employeeId}</p>
              </div>
              <div className="p-3 rounded-lg bg-black/20 border border-white/5 flex items-center gap-3 text-muted-foreground">
                <Fingerprint className="h-5 w-5" />
                <p className="text-sm">يتم استخدام بصمة الوجه/الإصبع في التطبيق للتحقق السريع</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-muted-foreground" /> الأمان والحساب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                تأكد من تحديث كلمة المرور الخاصة بك بشكل دوري للحفاظ على أمان حسابك.
              </p>
              <Link href="/change-password" className="block">
                <Button variant="outline" className="w-full justify-between group h-12 bg-black/20 border-white/10 hover:bg-black/40">
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 text-primary" />
                    تغيير كلمة المرور
                  </span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
