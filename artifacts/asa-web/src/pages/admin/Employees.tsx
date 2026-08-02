import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, departmentApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus, UserCog, Loader2, Copy, Check } from 'lucide-react';

const employeeSchema = z.object({
  nationalId: z.string().min(10, 'رقم الهوية يجب أن يكون 10 أرقام على الأقل'),
  firstNameAr: z.string().min(2, 'الاسم الأول مطلوب'),
  middleNameAr: z.string().optional(),
  lastNameAr: z.string().min(2, 'الاسم الأخير مطلوب'),
  phoneNumber: z.string().min(9, 'رقم الجوال غير صحيح'),
  departmentId: z.string().optional(),
  role: z.enum(['SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER', 'RESPONSIBLE_OFFICER', 'EMPLOYEE']),
});

export const Employees: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees, isLoading: isLoadingEmps } = useQuery({
    queryKey: queryKeys.admin.employeesAll,
    queryFn: adminApi.listAllEmployees,
  });

  const { data: departments } = useQuery({
    queryKey: queryKeys.departments.active,
    queryFn: departmentApi.listActive,
  });

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      nationalId: '', firstNameAr: '', middleNameAr: '', lastNameAr: '', phoneNumber: '', role: 'EMPLOYEE'
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof employeeSchema>) => adminApi.createEmployee(data),
    onSuccess: (res) => {
      setTempPassword(res.tempPassword);
      toast({ title: 'تمت الإضافة', description: 'تمت إضافة الموظف بنجاح' });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.employeesAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.employeesActive });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل إضافة الموظف', variant: 'destructive' });
    }
  });

  const filteredEmployees = employees?.filter(emp => {
    const matchesSearch = 
      (emp.firstNameAr + ' ' + emp.lastNameAr).includes(searchTerm) || 
      emp.nationalId.includes(searchTerm);
    const matchesDept = deptFilter === 'all' || emp.departmentId === deptFilter;
    return matchesSearch && matchesDept;
  });

  const roleMap: Record<string, string> = {
    SYSTEM_ADMIN: 'مدير نظام',
    MAIN_MANAGER: 'مدير عام',
    DEPARTMENT_MANAGER: 'مدير قسم',
    WEEKEND_MANAGER: 'مدير عطلة',
    RESPONSIBLE_OFFICER: 'ضابط مسؤول',
    EMPLOYEE: 'موظف',
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="إدارة الموظفين" 
        description="عرض وإدارة بيانات موظفي النظام"
        action={
          <Button onClick={() => { form.reset(); setTempPassword(null); setIsAddOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> إضافة موظف
          </Button>
        }
      />

      <Card className="bg-card border-border shadow-sm">
        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 items-center justify-between bg-black/10">
          <div className="relative w-full md:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث بالاسم أو رقم الهوية..." 
              className="pl-4 pr-10 bg-card border-border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger dir="rtl" className="bg-card">
                <SelectValue placeholder="تصفية حسب القسم" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">جميع الأقسام</SelectItem>
                {departments?.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.nameAr}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingEmps ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-muted-foreground bg-black/20 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">الاسم</th>
                  <th className="px-6 py-4 font-medium text-center">رقم الهوية</th>
                  <th className="px-6 py-4 font-medium text-center">القسم</th>
                  <th className="px-6 py-4 font-medium text-center">الصلاحية</th>
                  <th className="px-6 py-4 font-medium text-center">الحالة</th>
                  <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEmployees?.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-foreground">
                      {emp.firstNameAr} {emp.lastNameAr}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-muted-foreground" dir="ltr">{emp.nationalId}</td>
                    <td className="px-6 py-4 text-center">{emp.departmentNameAr || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="font-normal text-xs bg-black/20">
                        {roleMap[emp.role] || emp.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {emp.status === 'ACTIVE' ? (
                        <span className="text-[#00E676] text-xs px-2 py-1 bg-[#00E676]/10 rounded-full">نشط</span>
                      ) : (
                        <span className="text-muted-foreground text-xs px-2 py-1 bg-black/20 rounded-full">غير نشط</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-left">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground italic">
                      لا يوجد موظفين يطابقون معايير البحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-right">إضافة موظف جديد</DialogTitle>
            <DialogDescription className="text-right">
              إضافة موظف مباشرة إلى النظام دون الحاجة لانتظار طلب تسجيل.
            </DialogDescription>
          </DialogHeader>

          {tempPassword ? (
            <div className="space-y-6 pt-4 text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">تم الإنشاء بنجاح</h3>
              <p className="text-sm text-muted-foreground">
                يرجى تزويد الموظف برقم الهوية وكلمة المرور المؤقتة أدناه. سيُطلب منه تغييرها عند أول تسجيل دخول.
              </p>
              <div className="bg-black/40 border border-border p-4 rounded-xl flex items-center justify-between">
                <span className="font-mono text-2xl tracking-widest text-primary font-bold">{tempPassword}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    toast({ description: 'تم نسخ كلمة المرور' });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button className="w-full" onClick={() => setIsAddOpen(false)}>إغلاق</Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((d) => {
                  const payload = {
                    ...d,
                    middleNameAr: d.middleNameAr?.trim() || undefined,
                    departmentId: d.departmentId === 'none' || !d.departmentId ? undefined : d.departmentId,
                  };
                  createMutation.mutate(payload);
                })}
                className="space-y-4 pt-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="firstNameAr" render={({ field }) => (
                    <FormItem><FormLabel>الاسم الأول</FormLabel><FormControl><Input className="bg-black/20" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lastNameAr" render={({ field }) => (
                    <FormItem><FormLabel>الاسم الأخير</FormLabel><FormControl><Input className="bg-black/20" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="middleNameAr" render={({ field }) => (
                  <FormItem>
                    <FormLabel>الاسم الأوسط <span className="text-muted-foreground text-xs">(اختياري)</span></FormLabel>
                    <FormControl><Input className="bg-black/20" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="nationalId" render={({ field }) => (
                    <FormItem><FormLabel>رقم الهوية</FormLabel><FormControl><Input className="bg-black/20 text-left" dir="ltr" placeholder="1234567890" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                    <FormItem><FormLabel>رقم الجوال</FormLabel><FormControl><Input className="bg-black/20 text-left" dir="ltr" placeholder="05XXXXXXXX" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                      <FormLabel>الصلاحية</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger dir="rtl" className="bg-black/20"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent dir="rtl">
                          {Object.entries(roleMap).map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="departmentId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>القسم (اختياري)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || 'none'}>
                        <FormControl><SelectTrigger dir="rtl" className="bg-black/20"><SelectValue placeholder="بدون قسم" /></SelectTrigger></FormControl>
                        <SelectContent dir="rtl">
                          <SelectItem value="none">بدون قسم</SelectItem>
                          {departments?.map(d => <SelectItem key={d.id} value={d.id}>{d.nameAr}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null} إضافة
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
