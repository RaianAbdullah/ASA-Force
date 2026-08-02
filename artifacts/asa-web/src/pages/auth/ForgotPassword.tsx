import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { authApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'wouter';

export const ForgotPassword: React.FC = () => {
  const [nationalId, setNationalId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const resetMutation = useMutation({
    mutationFn: () => authApi.forgotPassword(nationalId),
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ أثناء طلب إعادة تعيين كلمة المرور',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId) return;
    resetMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#C9963F]/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-2xl">
          {!isSuccess ? (
            <>
              <CardHeader className="space-y-2 text-center pb-8">
                <CardTitle className="text-2xl font-bold tracking-tight">نسيت كلمة المرور</CardTitle>
                <CardDescription>أدخل رقم الهوية لإرسال رابط إعادة تعيين كلمة المرور</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nationalId">رقم الهوية الوطنية</Label>
                    <Input 
                      id="nationalId" 
                      placeholder="أدخل رقم الهوية" 
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      dir="ltr"
                      className="text-right bg-black/20"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-semibold shadow-[0_0_15px_rgba(201,150,63,0.2)] bg-[#C9963F] hover:bg-[#C9963F]/90 text-white" 
                    disabled={!nationalId || resetMutation.isPending}
                  >
                    {resetMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'إرسال رابط إعادة التعيين'}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center transition-colors">
                    <ArrowRight className="h-4 w-4 ml-1" />
                    العودة لتسجيل الدخول
                  </Link>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="pt-10 pb-8 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-foreground">تم الإرسال بنجاح</h3>
                <p className="text-muted-foreground text-sm">
                  تم إرسال تعليمات إعادة تعيين كلمة المرور إلى رقم الجوال المسجل لدينا.
                </p>
              </div>
              
              <div className="pt-4">
                <Link href="/reset-password">
                  <Button variant="outline" className="w-full">
                    إدخال الرمز السري (مؤقت للاختبار)
                  </Button>
                </Link>
              </div>
              <div className="pt-2">
                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    العودة لتسجيل الدخول
                  </Button>
                </Link>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};
