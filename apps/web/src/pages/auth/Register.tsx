import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLocation } from 'wouter';
import { authApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

const registerSchema = z.object({
  nationalId: z.string().regex(/^\d{10}$/, 'رقم الهوية يجب أن يتكون من 10 أرقام'),
  firstNameAr: z.string().min(2, 'الاسم الأول مطلوب باللغة العربية'),
  middleNameAr: z.string().optional(),
  lastNameAr: z.string().min(2, 'الاسم الأخير مطلوب باللغة العربية'),
  phoneNumber: z.string().regex(/^\+?[0-9]{9,15}$/, 'رقم الجوال غير صحيح'),
  password: z.string().min(12, 'كلمة المرور يجب أن تكون 12 حرفاً على الأقل'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nationalId: '',
      firstNameAr: '',
      middleNameAr: '',
      lastNameAr: '',
      phoneNumber: '',
      password: '',
      confirmPassword: ''
    }
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormValues) => {
      const { confirmPassword, ...apiData } = data;
      return authApi.register(apiData);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'تم التسجيل بنجاح',
        description: 'تم إرسال رمز التحقق إلى رقم جوالك',
      });
      setLocation(`/verify-otp?nationalId=${variables.nationalId}`);
    },
    onError: (error: any) => {
      toast({
        title: 'فشل التسجيل',
        description: error.message || 'حدث خطأ أثناء التسجيل',
        variant: 'destructive'
      });
    }
  });

  const onSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-xl p-4 relative z-10">
        <Card className="border-border bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-8">
            <CardTitle className="text-2xl font-bold tracking-tight">إنشاء حساب جديد</CardTitle>
            <CardDescription>أدخل بياناتك الشخصية للتسجيل في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstNameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأول</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم الأول" className="bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="middleNameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الأب (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم الأب" className="bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastNameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الاسم الأخير</FormLabel>
                        <FormControl>
                          <Input placeholder="الاسم الأخير" className="bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>رقم الهوية الوطنية</FormLabel>
                        <FormControl>
                          <Input placeholder="رقم الهوية" dir="ltr" className="text-right bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>رقم الجوال</FormLabel>
                        <FormControl>
                          <Input placeholder="05XXXXXXXX" dir="ltr" className="text-right bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" dir="ltr" className="text-right bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة المرور</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" dir="ltr" className="text-right bg-black/20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold shadow-[0_0_15px_rgba(0,230,118,0.2)]" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'تسجيل حساب'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                تسجيل الدخول
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
