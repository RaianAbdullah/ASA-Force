import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { authApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const VerifyOtp: React.FC = () => {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const nationalId = searchParams.get('nationalId');
  const { toast } = useToast();
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!nationalId) {
      setLocation('/login');
    }
  }, [nationalId, setLocation]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const verifyMutation = useMutation({
    mutationFn: () => authApi.verifyOtp(nationalId!, otp),
    onSuccess: () => {
      toast({
        title: 'تم التحقق بنجاح',
        description: 'حسابك الآن قيد المراجعة من قبل الإدارة',
      });
      setLocation('/waiting');
    },
    onError: (error: any) => {
      toast({
        title: 'فشل التحقق',
        description: error.message || 'رمز التحقق غير صحيح',
        variant: 'destructive'
      });
    }
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp(nationalId!),
    onSuccess: () => {
      toast({
        title: 'تم الإرسال',
        description: 'تم إرسال رمز تحقق جديد إلى رقم جوالك',
      });
      setCountdown(60);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إرسال الرمز الجديد',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    verifyMutation.mutate();
  };

  if (!nationalId) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">التحقق من رقم الجوال</CardTitle>
            <CardDescription>أدخل الرمز المكون من 6 أرقام المرسل إلى جوالك</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8 flex flex-col items-center">
              <div dir="ltr" className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <InputOTPSlot 
                        key={index} 
                        index={index} 
                        className="w-12 h-14 text-xl border-border bg-black/20 rounded-md" 
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold shadow-[0_0_15px_rgba(0,230,118,0.2)]" 
                disabled={otp.length !== 6 || verifyMutation.isPending}
              >
                {verifyMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تأكيد الرمز'}
              </Button>
            </form>

            <div className="mt-8 flex flex-col items-center space-y-2">
              <p className="text-sm text-muted-foreground">لم تستلم الرمز؟</p>
              <Button
                variant="ghost"
                className="text-primary hover:text-primary/80 hover:bg-primary/10"
                disabled={countdown > 0 || resendMutation.isPending}
                onClick={() => resendMutation.mutate()}
              >
                {resendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : null}
                {countdown > 0 ? `إعادة الإرسال بعد ${countdown} ثانية` : 'إعادة إرسال الرمز'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
