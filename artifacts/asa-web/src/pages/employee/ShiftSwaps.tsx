import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { scheduleApi, adminApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Repeat, Plus, Loader2, CalendarDays, ArrowLeftRight } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

const swapSchema = z.object({
  targetId: z.string().min(1, 'يجب اختيار الموظف البديل'),
  myWeekStart: z.string().min(1, 'تاريخ أسبوعك مطلوب'),
  theirWeekStart: z.string().min(1, 'تاريخ أسبوع البديل مطلوب'),
  reason: z.string().optional()
});

export const ShiftSwaps: React.FC = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: swaps, isLoading: isLoadingSwaps } = useQuery({
    queryKey: queryKeys.schedules.swapsMy,
    queryFn: scheduleApi.getMySwaps,
  });

  const { data: employees, isLoading: isLoadingEmps } = useQuery({
    queryKey: queryKeys.admin.employeesActive,
    queryFn: adminApi.listActiveEmployees,
  });

  const form = useForm<z.infer<typeof swapSchema>>({
    resolver: zodResolver(swapSchema),
    defaultValues: { targetId: '', myWeekStart: '', theirWeekStart: '', reason: '' }
  });

  const submitMutation = useMutation({
    mutationFn: (data: z.infer<typeof swapSchema>) => scheduleApi.createSwapRequest(data),
    onSuccess: () => {
      toast({ title: 'تم تقديم الطلب', description: 'تم إرسال طلب التبديل بنجاح' });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.swapsMy });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل تقديم الطلب', variant: 'destructive' });
    }
  });

  // Calculate next few Mondays for the date pickers
  const getNextMondays = () => {
    const dates = [];
    let d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7)); // Next Monday
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Adjust if today is Sunday
    
    for (let i = 0; i < 4; i++) {
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
      d.setDate(d.getDate() + 7);
    }
    return dates;
  };
  const weekOptions = getNextMondays();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="تبديل الورديات" 
        description="إدارة طلبات تبديل جدول العمل مع زملائك"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> طلب تبديل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-right">طلب تبديل وردية</DialogTitle>
                <DialogDescription className="text-right">
                  اختر الموظف البديل والأسابيع المراد تبديلها. يجب أن يوافق الموظف والمدير.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الموظف البديل</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger dir="rtl" className="bg-black/20 text-right">
                              <SelectValue placeholder="اختر زميلاً..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent dir="rtl">
                            {employees?.filter(e => e.id !== session?.employeeId).map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.firstNameAr} {emp.lastNameAr} ({emp.departmentNameAr})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="myWeekStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>أسبوعك (الذي تريد إعطاءه)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger dir="rtl" className="bg-black/20 font-mono text-sm">
                                <SelectValue placeholder="اختر أسبوعاً" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent dir="rtl">
                              {weekOptions.map(date => (
                                <SelectItem key={date} value={date}>{date}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="theirWeekStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>أسبوع البديل (الذي ستأخذه)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger dir="rtl" className="bg-black/20 font-mono text-sm">
                                <SelectValue placeholder="اختر أسبوعاً" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent dir="rtl">
                              {weekOptions.map(date => (
                                <SelectItem key={date} value={date}>{date}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>السبب (اختياري)</FormLabel>
                        <FormControl>
                          <Input className="bg-black/20" placeholder="سبب طلب التبديل..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                    <Button type="submit" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                      تقديم الطلب
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">سجل طلبات التبديل</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSwaps ? <LoadingSpinner /> : swaps && swaps.length > 0 ? (
            <div className="space-y-4">
              {swaps.map((swap) => {
                const isRequester = swap.requesterId === session?.employeeId;
                const otherPersonName = isRequester ? swap.targetName : swap.requesterName;
                const badgeLabel = isRequester ? 'أنت طلبت من' : 'طلب منك';
                
                return (
                  <div key={swap.id} className="p-4 rounded-xl border border-border/50 bg-black/10 flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={swap.status} />
                        <span className="text-xs bg-muted/30 text-muted-foreground px-2 py-1 rounded">
                          {badgeLabel} <span className="font-bold text-foreground">{otherPersonName}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between max-w-sm bg-black/20 rounded-lg p-3 border border-white/5 relative">
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase mb-1">أسبوع {isRequester ? 'المقدم' : 'الطالب'}</p>
                          <p className="font-mono text-sm font-semibold">{swap.requesterWeekStart}</p>
                        </div>
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-card rounded-full border border-border flex items-center justify-center text-primary">
                          <ArrowLeftRight className="h-3 w-3" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase mb-1">أسبوع {isRequester ? 'البديل' : 'المستلم'}</p>
                          <p className="font-mono text-sm font-semibold">{swap.targetWeekStart}</p>
                        </div>
                      </div>
                      
                      {swap.reason && <p className="text-sm text-muted-foreground mt-2">السبب: {swap.reason}</p>}
                      {swap.reviewNotes && (
                        <p className="text-xs text-[#C9963F] mt-2 bg-[#C9963F]/10 p-2 rounded inline-block">
                          ملاحظة المدير: {swap.reviewNotes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState 
              icon={Repeat} 
              title="لا توجد طلبات تبديل" 
              description="لم تقم بتقديم أو استلام أي طلبات لتبديل الورديات." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
