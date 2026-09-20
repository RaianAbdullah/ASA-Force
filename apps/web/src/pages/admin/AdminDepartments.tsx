import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { departmentApi, adminApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Building, Plus, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

const deptSchema = z.object({
  nameAr: z.string().min(2, 'الاسم بالعربية مطلوب'),
  nameEn: z.string().min(2, 'الاسم بالإنجليزية مطلوب'),
  code: z.string().min(1, 'الرمز مطلوب'),
  managerId: z.string().optional()
});

export const AdminDepartments: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: departments, isLoading: isLoadingDepts } = useQuery({
    queryKey: queryKeys.departments.all,
    queryFn: departmentApi.listAll,
  });

  const { data: employees } = useQuery({
    queryKey: queryKeys.admin.employeesActive,
    queryFn: adminApi.listActiveEmployees,
  });

  const form = useForm<z.infer<typeof deptSchema>>({
    resolver: zodResolver(deptSchema),
    defaultValues: { nameAr: '', nameEn: '', code: '', managerId: 'none' }
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof deptSchema>) => 
      departmentApi.create({ ...data, managerId: data.managerId === 'none' ? undefined : data.managerId }),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم إنشاء القسم بنجاح' });
      setIsAddOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.active });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل إنشاء القسم', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => departmentApi.deactivate(id),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم إيقاف القسم بنجاح' });
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.active });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل إيقاف القسم', variant: 'destructive' });
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="الأقسام" 
        description="إدارة أقسام المؤسسة والمدراء المسؤولين"
        action={
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> إضافة قسم
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-right">إضافة قسم جديد</DialogTitle>
                <DialogDescription className="text-right">أدخل بيانات القسم الجديد</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 pt-4">
                  <FormField control={form.control} name="nameAr" render={({ field }) => (
                    <FormItem><FormLabel>الاسم (عربي)</FormLabel><FormControl><Input className="bg-black/20" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="nameEn" render={({ field }) => (
                    <FormItem><FormLabel>الاسم (إنجليزي)</FormLabel><FormControl><Input className="bg-black/20 text-left" dir="ltr" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="code" render={({ field }) => (
                    <FormItem><FormLabel>رمز القسم</FormLabel><FormControl><Input className="bg-black/20 font-mono text-left" dir="ltr" placeholder="HR, IT, ..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="managerId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>المدير</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger dir="rtl" className="bg-black/20"><SelectValue placeholder="اختر المدير" /></SelectTrigger></FormControl>
                        <SelectContent dir="rtl">
                          <SelectItem value="none">بدون مدير</SelectItem>
                          {employees?.filter(e => e.role === 'DEPARTMENT_MANAGER').map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>{emp.firstNameAr} {emp.lastNameAr}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>إلغاء</Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null} حفظ القسم
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingDepts ? (
          <div className="col-span-full py-12"><LoadingSpinner /></div>
        ) : departments && departments.length > 0 ? (
          departments.map((dept) => (
            <Card key={dept.id} className="bg-card/50 border-border hover:bg-card/80 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none" />
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-bold mb-1 text-foreground">{dept.nameAr}</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">{dept.nameEn} ({dept.code})</p>
                </div>
                {!dept.isActive ? (
                  <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-1 rounded">معطل</span>
                ) : (
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded">نشط</span>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">المدير:</span>
                  <span className="font-medium">{dept.managerName || '-'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">عدد الموظفين:</span>
                  <span className="font-mono bg-black/20 px-2 py-0.5 rounded">{dept.employeeCount}</span>
                </div>
                
                {dept.isActive && (
                  <div className="pt-4 border-t border-border/50 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                      onClick={() => setDeleteId(dept.id)}
                    >
                      <Trash2 className="h-4 w-4 ml-2" /> إيقاف القسم
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12">
            <EmptyState icon={Building} title="لا توجد أقسام" description="لم يتم إضافة أي أقسام للمؤسسة بعد." />
          </div>
        )}
      </div>

      <ConfirmDialog 
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="إيقاف القسم" description="إيقاف القسم سيمنع تعيين موظفين جدد إليه. هل أنت متأكد؟"
        isDestructive onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        confirmText="نعم، أوقف القسم"
      />
    </div>
  );
};
