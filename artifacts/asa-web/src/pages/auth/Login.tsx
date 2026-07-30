import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { authApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export const Login: React.FC = () => {
  const [nationalId, setNationalId] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(nationalId, password),
    onSuccess: (data) => {
      const roles = data.roles || [data.role];
      login({
        token: data.accessToken,
        refreshToken: data.refreshToken,
        role: data.role,
        roles,
        nameAr: data.nameAr,
        employeeId: data.employeeId,
        departmentNameAr: data.departmentNameAr
      });
      
      if (data.mustChangePassword) {
        setLocation('/change-password');
      } else if (roles.includes('SYSTEM_ADMIN')) {
        setLocation('/admin');
      } else {
        setLocation('/');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'فشل تسجيل الدخول',
        description: error.message || 'رقم الهوية أو كلمة المرور غير صحيحة',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId || !password) {
      toast({ title: 'خطأ', description: 'يرجى إدخال جميع الحقول المطلوبة', variant: 'destructive' });
      return;
    }
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Aesthetic background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#C9963F]/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(0,230,118,0.15)] relative">
            <span className="text-primary font-bold text-xl">ASA</span>
            <div className="absolute inset-0 rounded-2xl border border-primary/30 mix-blend-overlay"></div>
          </div>
        </div>

        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بيانات الاعتماد الخاصة بك للوصول إلى النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nationalId">رقم الهوية الوطنية</Label>
                  <Input 
                    id="nationalId" 
                    placeholder="أدخل رقم الهوية" 
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    dir="ltr"
                    className="text-right bg-black/20"
                    data-testid="input-nationalId"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Link href="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors">
                      نسيت كلمة المرور؟
                    </Link>
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="text-right bg-black/20"
                    data-testid="input-password"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-[0_0_15px_rgba(0,230,118,0.2)]" 
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تسجيل الدخول'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{' '}
              <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                إنشاء حساب جديد
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
