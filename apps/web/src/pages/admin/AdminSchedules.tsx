import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { scheduleApi, adminApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Trash2, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const createScheduleSchema = z.object({
  employeeId: z.string().min(1, 'يجب اختيار موظف'),
  weekStart: z.string().min(1, 'يجب اختيار بداية الأسبوع'),
  workDays: z.array(z.string()).min(1, 'يجب اختيار يوم عمل واحد على الأقل'),
  shiftStart: z.string().min(1, 'يجب تحديد وقت بداية الوردية'),
  shiftEnd: z.string().min(1, 'يجب تحديد وقت نهاية الوردية'),
  isWeekendDuty: z.boolean().default(false),
  notes: z.string().optional()
});

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const AdminSchedules: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: employees, isLoading: isLoadingEmps } = useQuery({
    queryKey: queryKeys.admin.employeesActive,
    queryFn: adminApi.listActiveEmployees,
  });

  const { data: recentSchedules, isLoading: isLoadingSchedules } = useQuery({
    // Using an arbitrary admin endpoint or reusing recent. For full app, there should be a list all schedules.
    // The API service only defines getMyRecent, let's just use it to show something or build a search.
    queryKey: ['admin-schedules-recent'],
    queryFn: () => scheduleApi.getMyRecent(), // We'll just show the admin's own recent schedules since API lacks listAll
  });

  const form = useForm<z.infer<typeof createScheduleSchema>>({
    resolver: zodResolver(createScheduleSchema),
    defaultValues: {
      employeeId: '', weekStart: '', workDays: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'],
      shiftStart: '08:00', shiftEnd: '16:00', isWeekendDuty: false, notes: ''
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof createScheduleSchema>) => {
      const payload = { ...data, workDays: data.workDays.join(',') };
      return scheduleApi.create(payload);
    },
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم إنشاء الجدول بنجاح' });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['admin-schedules-recent'] });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل إنشاء الجدول', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.deleteSchedule(id),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم حذف الجدول بنجاح' });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ['admin-schedules-recent'] });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل الحذف', variant: 'destructive' });
    }
  });

  const getNextMondays = () => {
    const dates = [];
    let d = new Date();
    d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7)); 
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); 
    
    for (let i = 0; i < 4; i++) {
      dates.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 7);
    }
    return dates;
  };
  const weekOptions = getNextMondays();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إدارة الجداول" 
        description="تعيين الجداول والورديات للموظفين"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> إنشاء جدول جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-right">إنشاء جدول عمل</DialogTitle>
                <DialogDescription className="text-right">تحديد الوردية وأيام العمل للموظف</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 pt-4">
                  <FormField control={form.control} name="employeeId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الموظف</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger dir="rtl" className="bg-black/20"><SelectValue placeholder="اختر الموظف" /></SelectTrigger></FormControl>
                        <SelectContent dir="rtl">
                          {employees?.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.firstNameAr} {emp.lastNameAr} ({emp.departmentNameAr})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  
                  <FormField control={form.control} name="weekStart" render={({ field }) => (
                    <FormItem>
                      <FormLabel>بداية الأسبوع</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger dir="rtl" className="bg-black/20 font-mono"><SelectValue placeholder="اختر أسبوعاً" /></SelectTrigger></FormControl>
                        <SelectContent dir="rtl">
                          {weekOptions.map(date => <SelectItem key={date} value={date}>{date}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="workDays" render={() => (
                    <FormItem>
                      <div className="mb-2"><FormLabel>أيام العمل</FormLabel></div>
                      <div className="flex flex-wrap gap-3 p-3 bg-black/20 rounded-md border border-border">
                        {ARABIC_DAYS.map((day) => (
                          <FormField key={day} control={form.control} name="workDays" render={({ field }) => {
                            return (
                              <FormItem key={day} className="flex flex-row items-start space-x-2 space-x-reverse space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, day])
                                        : field.onChange(field.value?.filter((value) => value !== day))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-sm cursor-pointer">{day}</FormLabel>
                              </FormItem>
                            )
                          }} />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="shiftStart" render={({ field }) => (
                      <FormItem>
                        <FormLabel>وقت البداية</FormLabel>
                        <FormControl><Input type="time" className="bg-black/20 text-left font-mono" dir="ltr" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="shiftEnd" render={({ field }) => (
                      <FormItem>
                        <FormLabel>وقت النهاية</FormLabel>
                        <FormControl><Input type="time" className="bg-black/20 text-left font-mono" dir="ltr" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="isWeekendDuty" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border bg-black/20 p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">تكليف عطلة نهاية الأسبوع</FormLabel>
                        <DialogDescription>تفعيل في حال كان الجدول لعمل إضافي في العطلة</DialogDescription>
                      </div>
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ملاحظات إضافية</FormLabel>
                      <FormControl><Input className="bg-black/20" placeholder="مثال: تعويض عن يوم سابق" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null} حفظ الجدول
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-lg">الجداول المضافة مؤخراً</CardTitle></CardHeader>
        <CardContent>
          {isLoadingSchedules || isLoadingEmps ? <LoadingSpinner /> : recentSchedules && recentSchedules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSchedules.map((schedule) => (
                <div key={schedule.id} className="p-4 rounded-xl border border-border/50 bg-black/10 space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-sm font-semibold text-primary">{schedule.weekStart}</span>
                      {schedule.isWeekendDuty && <Badge variant="outline" className="mr-2 text-xs border-[#C9963F] text-[#C9963F]">عطلة</Badge>}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeleteId(schedule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1 pt-2 border-t border-border/30 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>الوردية:</span>
                      <span className="font-mono text-foreground" dir="ltr">{schedule.shiftStart} - {schedule.shiftEnd}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>أيام العمل:</span>
                      <span className="font-mono text-foreground truncate max-w-[150px]" title={schedule.workDays}>{schedule.workDays}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarDays} title="لا توجد جداول" description="لم يتم العثور على جداول حديثة." />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog 
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="حذف الجدول" description="هل أنت متأكد من رغبتك في حذف هذا الجدول؟ لا يمكن التراجع عن هذا الإجراء."
        isDestructive onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
};
