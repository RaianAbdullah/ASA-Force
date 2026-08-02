import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, attendanceApi, departmentApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Check, X, ShieldAlert, Activity, UserCheck } from 'lucide-react';
import { useState } from 'react';

export const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveDepartmentId, setApproveDepartmentId] = useState('');

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: queryKeys.attendance.todaySummary(),
    queryFn: () => attendanceApi.getTodaySummary(),
  });

  const { data: pendingRegs, isLoading: isLoadingPending } = useQuery({
    queryKey: queryKeys.admin.pendingRegistrations(0),
    queryFn: () => adminApi.listPending(0, 50),
  });

  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: queryKeys.departments.active,
    queryFn: () => departmentApi.listActive(),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, departmentId }: { id: string, departmentId: string }) =>
      adminApi.approve(id, departmentId),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم الموافقة على طلب التسجيل بنجاح' });
      setApproveId(null);
      setApproveDepartmentId('');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingRegistrations(0) });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل الموافقة', variant: 'destructive' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string, reason: string }) => adminApi.reject(id, reason),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم رفض طلب التسجيل' });
      setRejectId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingRegistrations(0) });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل الرفض', variant: 'destructive' });
    }
  });

  const handleApprove = () => {
    if (!approveId || !approveDepartmentId) return;
    approveMutation.mutate({ id: approveId, departmentId: approveDepartmentId });
  };

  const handleReject = () => {
    if (!rejectId || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: rejectId, reason: rejectReason });
  };

  const summary = stats || { totalActive: 0, checkedIn: 0, late: 0, absent: 0, excused: 0 };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="لوحة الإدارة" 
        description="نظرة عامة على حالة النظام وموافقات التسجيل المعلقة"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي الموظفين</p>
                <h3 className="text-3xl font-bold">{summary.totalActive}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">حاضر اليوم</p>
                <h3 className="text-3xl font-bold text-[#00E676]">{summary.checkedIn}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#00E676]/10 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-[#00E676]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">متأخر</p>
                <h3 className="text-3xl font-bold text-[#C9963F]">{summary.late}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#C9963F]/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-[#C9963F]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">غائب</p>
                <h3 className="text-3xl font-bold text-destructive">{summary.absent}</h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Registrations */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#C9963F]" />
            طلبات التسجيل المعلقة
            {pendingRegs?.totalElements ? (
              <Badge className="bg-[#C9963F] text-white ml-2 rounded-full">{pendingRegs.totalElements}</Badge>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingPending ? (
            <LoadingSpinner />
          ) : pendingRegs?.content && pendingRegs.content.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-muted-foreground bg-black/20 uppercase border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">الموظف</th>
                    <th className="px-6 py-4 font-medium text-center">رقم الهوية</th>
                    <th className="px-6 py-4 font-medium text-center">تاريخ الطلب</th>
                    <th className="px-6 py-4 font-medium text-left">الإجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingRegs.content.map((reg) => (
                    <tr key={reg.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{reg.firstNameAr} {reg.lastNameAr}</div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono" dir="ltr">{reg.nationalId}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground" dir="ltr">
                        {new Date(reg.registeredAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex justify-end gap-2">
                          <Dialog open={approveId === reg.id} onOpenChange={(open) => {
                            if (!open) { setApproveId(null); setApproveDepartmentId(''); }
                            else setApproveId(reg.id);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold h-8"
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                              >
                                <Check className="h-4 w-4 ml-1" /> موافقة
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-right">الموافقة وتحديد القسم</DialogTitle>
                                <DialogDescription className="text-right">
                                  اختر قسم الموظف ({reg.firstNameAr} {reg.lastNameAr}) قبل تفعيل الحساب.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Select
                                  value={approveDepartmentId}
                                  onValueChange={setApproveDepartmentId}
                                  disabled={isLoadingDepartments}
                                >
                                  <SelectTrigger dir="rtl" className="bg-black/20">
                                    <SelectValue placeholder={
                                      isLoadingDepartments ? 'جاري تحميل الأقسام...' : 'اختر القسم'
                                    } />
                                  </SelectTrigger>
                                  <SelectContent dir="rtl">
                                    {departments?.map((department) => (
                                      <SelectItem key={department.id} value={department.id}>
                                        {department.nameAr}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {!isLoadingDepartments && departments?.length === 0 ? (
                                  <p className="text-sm text-destructive text-right">
                                    لا توجد أقسام نشطة. أنشئ قسماً قبل الموافقة على الموظف.
                                  </p>
                                ) : null}
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setApproveId(null);
                                      setApproveDepartmentId('');
                                    }}
                                  >
                                    إلغاء
                                  </Button>
                                  <Button
                                    className="bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold"
                                    disabled={!approveDepartmentId || approveMutation.isPending}
                                    onClick={handleApprove}
                                  >
                                    تأكيد الموافقة
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={rejectId === reg.id} onOpenChange={(open) => {
                            if (!open) { setRejectId(null); setRejectReason(''); }
                            else setRejectId(reg.id);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/20 h-8">
                                <X className="h-4 w-4 ml-1" /> رفض
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-right text-destructive">رفض طلب تسجيل</DialogTitle>
                                <DialogDescription className="text-right">
                                  يرجى كتابة سبب رفض طلب الموظف ({reg.firstNameAr} {reg.lastNameAr})
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Input 
                                    placeholder="سبب الرفض (إلزامي)..." 
                                    className="bg-black/20"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setRejectId(null)}>إلغاء</Button>
                                  <Button 
                                    variant="destructive" 
                                    disabled={!rejectReason.trim() || rejectMutation.isPending}
                                    onClick={handleReject}
                                  >
                                    تأكيد الرفض
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState 
              icon={UserPlus} 
              title="لا توجد طلبات معلقة" 
              description="جميع طلبات التسجيل تمت معالجتها." 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
