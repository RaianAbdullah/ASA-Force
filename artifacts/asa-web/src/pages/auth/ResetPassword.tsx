import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { authApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Link } from 'wouter';

export const ResetPassword: React.FC = () => {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: () => authApi.resetPassword(token, password),
    onSuccess: () => {
      toast({
        title: 'تم التغيير بنجاح',
        description: 'تم إعادة تعيين كلمة المرور، يمكنك الآن تسجيل الدخول',
      });
      setLocation('/login');
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'الرمز غير صحيح أو منتهي الصلاحية',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;
    if (password !== confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمات المرور غير متطابقة', variant: 'destructive' });
      return;
    }
    resetMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">إعادة تعيين كلمة المرور</CardTitle>
            <CardDescription>أدخل الرمز الذي استلمته وكلمة المرور الجديدة</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">رمز إعادة التعيين</Label>
                  <Input 
                    id="token" 
                    placeholder="أدخل الرمز" 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    dir="ltr"
                    className="text-right bg-black/20 text-center tracking-widest text-lg font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور الجديدة</Label>
                  <Input 
                    id="password" 
                    type="password"
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    dir="ltr"
                    className="text-right bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    placeholder="••••••••" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    className="text-right bg-black/20"
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-[0_0_15px_rgba(0,230,118,0.2)]" 
                disabled={!token || !password || !confirmPassword || resetMutation.isPending}
              >
                {resetMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ التغييرات'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground space-y-2 flex flex-col">
              <Link href="/forgot-password" className="text-primary hover:text-primary/80 transition-colors">
                طلب رمز جديد
              </Link>
              <Link href="/login" className="hover:text-foreground transition-colors mt-2 inline-block">
                العودة لتسجيل الدخول
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
