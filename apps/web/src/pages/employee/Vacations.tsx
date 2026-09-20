import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { vacationApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plane, Plus, Loader2, Calendar, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const vacationSchema = z.object({
  startDate: z.string().min(1, 'تاريخ البداية مطلوب'),
  endDate: z.string().min(1, 'تاريخ النهاية مطلوب'),
  reason: z.string().optional()
});

export const Vacations: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: balance, isLoading: isLoadingBalance } = useQuery({
    queryKey: queryKeys.vacations.balance,
    queryFn: vacationApi.getBalance,
  });

  const { data: requests, isLoading: isLoadingRequests } = useQuery({
    queryKey: queryKeys.vacations.my,
    queryFn: vacationApi.getMyRequests,
  });

  const form = useForm<z.infer<typeof vacationSchema>>({
    resolver: zodResolver(vacationSchema),
    defaultValues: { startDate: '', endDate: '', reason: '' }
  });

  const submitMutation = useMutation({
    mutationFn: (data: z.infer<typeof vacationSchema>) => 
      vacationApi.submit(data.startDate, data.endDate, data.reason),
    onSuccess: () => {
      toast({ title: 'تم تقديم الطلب', description: 'تم إرسال طلب الإجازة بنجاح' });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.vacations.my });
      queryClient.invalidateQueries({ queryKey: queryKeys.vacations.balance });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل تقديم الطلب', variant: 'destructive' });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => vacationApi.cancel(id),
    onSuccess: () => {
      toast({ title: 'تم الإلغاء', description: 'تم إلغاء طلب الإجازة بنجاح' });
      setCancelId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.vacations.my });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل إلغاء الطلب', variant: 'destructive' });
      setCancelId(null);
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="الإجازات" 
        description="إدارة رصيد وطلبات الإجازة الخاصة بك"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> طلب إجازة جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-right">طلب إجازة جديد</DialogTitle>
                <DialogDescription className="text-right">
                  الرجاء تحديد تاريخ البداية والنهاية لطلب الإجازة
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاريخ البداية</FormLabel>
                          <FormControl>
                            <Input type="date" className="bg-black/20 text-left" dir="ltr" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاريخ النهاية</FormLabel>
                          <FormControl>
                            <Input type="date" className="bg-black/20 text-left" dir="ltr" {...field} />
                          </FormControl>
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
                          <Input className="bg-black/20" placeholder="سبب طلب الإجازة..." {...field} />
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-card/60 border-border shadow-sm h-fit">
          <CardHeader className="pb-4 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              رصيد الإجازات
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingBalance ? <LoadingSpinner /> : balance ? (
              <div className="space-y-6 text-center">
                <div className="relative inline-flex items-center justify-center">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                    <circle 
                      cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="8" 
                      className="text-primary" 
                      strokeDasharray="351.8" 
                      strokeDashoffset={351.8 - (351.8 * (balance.daysRemaining / balance.daysAllowed))}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold font-mono">{balance.daysRemaining}</span>
                    <span className="text-xs text-muted-foreground">يوم متبقي</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">المستحق السنوي</p>
                    <p className="font-semibold text-lg">{balance.daysAllowed} <span className="text-sm font-normal text-muted-foreground">يوم</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">المستخدم</p>
                    <p className="font-semibold text-lg">{balance.daysUsed} <span className="text-sm font-normal text-muted-foreground">يوم</span></p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-center text-muted-foreground py-8">لا يوجد بيانات رصيد</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2 bg-card border-border shadow-sm">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              الطلبات السابقة
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingRequests ? <LoadingSpinner /> : requests && requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/50 bg-black/10 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} />
                        <span className="font-mono text-sm font-semibold" dir="ltr">{req.startDate}</span>
                        <span className="text-muted-foreground text-xs">إلى</span>
                        <span className="font-mono text-sm font-semibold" dir="ltr">{req.endDate}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        المدة: <span className="font-medium text-foreground">{req.totalDays}</span> أيام
                        {req.reason && <span className="mr-3 border-r border-border pr-3 block sm:inline">السبب: {req.reason}</span>}
                      </p>
                      {req.reviewNotes && (
                        <p className="text-xs text-[#C9963F] mt-2 bg-[#C9963F]/10 p-2 rounded inline-block">
                          ملاحظة المدير: {req.reviewNotes}
                        </p>
                      )}
                    </div>
                    
                    {(req.status.startsWith('PENDING') || req.status === 'APPROVED' && new Date(req.startDate) > new Date()) && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={() => setCancelId(req.id)}
                      >
                        إلغاء الطلب
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-4">
                  <Plane className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">لم تقم بتقديم أي طلبات إجازة بعد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog 
        open={!!cancelId}
        onOpenChange={(o) => !o && setCancelId(null)}
        title="تأكيد الإلغاء"
        description="هل أنت متأكد من رغبتك في إلغاء طلب الإجازة هذا؟"
        isDestructive={true}
        onConfirm={() => cancelId && cancelMutation.mutate(cancelId)}
      />
    </div>
  );
};
