import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vacationApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FileText, Check, X, Plane, Loader2 } from 'lucide-react';

export const AdminVacations: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const { data: pendingReqs, isLoading } = useQuery({
    queryKey: queryKeys.vacations.pending,
    queryFn: vacationApi.getPending,
  });

  const approveMutation = useMutation({
    mutationFn: () => vacationApi.approve(actionId!, notes),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تمت الموافقة على طلب الإجازة' });
      resetAction();
      queryClient.invalidateQueries({ queryKey: queryKeys.vacations.pending });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل الموافقة', variant: 'destructive' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => vacationApi.reject(actionId!, notes),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم رفض طلب الإجازة' });
      resetAction();
      queryClient.invalidateQueries({ queryKey: queryKeys.vacations.pending });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل الرفض', variant: 'destructive' });
    }
  });

  const resetAction = () => {
    setActionId(null);
    setActionType(null);
    setNotes('');
  };

  const handleActionConfirm = () => {
    if (actionType === 'approve') approveMutation.mutate();
    if (actionType === 'reject') rejectMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="طلبات الإجازة" 
        description="مراجعة واعتماد طلبات الإجازة المعلقة للموظفين"
      />

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8"><LoadingSpinner /></div>
          ) : pendingReqs && pendingReqs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-muted-foreground bg-black/20 uppercase border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">الموظف</th>
                    <th className="px-6 py-4 font-medium text-center">المدة</th>
                    <th className="px-6 py-4 font-medium text-center">التاريخ</th>
                    <th className="px-6 py-4 font-medium text-center">الحالة الحالية</th>
                    <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingReqs.map((req) => (
                    <tr key={req.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{req.employeeNameAr}</div>
                        <div className="text-xs text-muted-foreground">{req.departmentNameAr || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-foreground">{req.totalDays}</span> أيام
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-mono text-xs" dir="ltr">{req.startDate}</div>
                        <div className="text-[10px] text-muted-foreground">إلى</div>
                        <div className="font-mono text-xs" dir="ltr">{req.endDate}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex justify-end gap-2">
                          <Dialog open={actionId === req.id && actionType === 'approve'} onOpenChange={(o) => o ? (setActionId(req.id), setActionType('approve')) : resetAction()}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold h-8 w-8 p-0">
                                <Check className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-right text-[#00E676]">اعتماد الإجازة</DialogTitle>
                                <DialogDescription className="text-right">
                                  هل أنت متأكد من الموافقة على طلب إجازة {req.employeeNameAr}؟
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Input placeholder="ملاحظات (اختياري)..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-black/20" />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={resetAction}>إلغاء</Button>
                                  <Button onClick={handleActionConfirm} className="bg-[#00E676] text-black hover:bg-[#00E676]/90" disabled={approveMutation.isPending}>
                                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد الموافقة'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog open={actionId === req.id && actionType === 'reject'} onOpenChange={(o) => o ? (setActionId(req.id), setActionType('reject')) : resetAction()}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/20 h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-right text-destructive">رفض الإجازة</DialogTitle>
                                <DialogDescription className="text-right">
                                  يرجى توضيح سبب رفض طلب إجازة {req.employeeNameAr}.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Input placeholder="سبب الرفض..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-black/20" />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={resetAction}>إلغاء</Button>
                                  <Button variant="destructive" onClick={handleActionConfirm} disabled={!notes.trim() || rejectMutation.isPending}>
                                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد الرفض'}
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
            <div className="py-12">
              <EmptyState 
                icon={Plane} 
                title="لا توجد طلبات معلقة" 
                description="جميع طلبات الإجازة تمت مراجعتها." 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
