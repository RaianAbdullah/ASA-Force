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
import { useAuth } from '@/contexts/AuthContext';

export const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { logout } = useAuth();

  const changeMutation = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      toast({
        title: 'تم التغيير بنجاح',
        description: 'تم تغيير كلمة المرور بنجاح. يرجى تسجيل الدخول بكلمة المرور الجديدة.',
      });
      logout();
      setLocation('/login');
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'كلمة المرور الحالية غير صحيحة',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 12) {
      toast({ title: 'خطأ', description: 'كلمة المرور الجديدة يجب أن تكون 12 حرفاً على الأقل', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'خطأ', description: 'كلمات المرور غير متطابقة', variant: 'destructive' });
      return;
    }
    changeMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">تغيير كلمة المرور</CardTitle>
            <CardDescription>يجب عليك تغيير كلمة المرور قبل المتابعة</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    placeholder="••••••••" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    dir="ltr"
                    className="text-right bg-black/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    placeholder="••••••••" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                disabled={!currentPassword || !newPassword || !confirmPassword || changeMutation.isPending}
              >
                {changeMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تحديث كلمة المرور'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
