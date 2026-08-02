import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '@/services/api';
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
import { Repeat, Check, X, ArrowLeftRight, Loader2 } from 'lucide-react';

export const AdminSwapRequests: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');

  const { data: pendingSwaps, isLoading } = useQuery({
    queryKey: queryKeys.schedules.swapsPending,
    queryFn: scheduleApi.getPendingSwaps,
  });

  const approveMutation = useMutation({
    mutationFn: () => scheduleApi.approveSwap(actionId!, notes),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تمت الموافقة على طلب التبديل' });
      resetAction();
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.swapsPending });
    },
    onError: (error: any) => {
      toast({ title: 'خطأ', description: error.message || 'فشل الموافقة', variant: 'destructive' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: () => scheduleApi.rejectSwap(actionId!, notes),
    onSuccess: () => {
      toast({ title: 'تم', description: 'تم رفض طلب التبديل' });
      resetAction();
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules.swapsPending });
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
        title="طلبات التبديل المعلقة" 
        description="مراجعة طلبات تبديل الورديات بين الموظفين"
      />

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12"><LoadingSpinner /></div>
          ) : pendingSwaps && pendingSwaps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-muted-foreground bg-black/20 uppercase border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">الطرف الأول (الطالب)</th>
                    <th className="px-6 py-4 font-medium text-center">التفاصيل</th>
                    <th className="px-6 py-4 font-medium">الطرف الثاني (البديل)</th>
                    <th className="px-6 py-4 font-medium text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingSwaps.map((swap) => (
                    <tr key={swap.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{swap.requesterName}</div>
                        <div className="font-mono text-xs text-muted-foreground mt-1 bg-black/20 px-2 py-0.5 rounded w-fit" dir="ltr">أسبوع: {swap.requesterWeekStart}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ArrowLeftRight className="h-5 w-5 text-primary mx-auto mb-1" />
                        {swap.reason && <p className="text-[10px] text-muted-foreground max-w-[120px] mx-auto truncate" title={swap.reason}>{swap.reason}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{swap.targetName}</div>
                        <div className="font-mono text-xs text-muted-foreground mt-1 bg-black/20 px-2 py-0.5 rounded w-fit" dir="ltr">أسبوع: {swap.targetWeekStart}</div>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="flex justify-end gap-2">
                          <Dialog open={actionId === swap.id && actionType === 'approve'} onOpenChange={(o) => o ? (setActionId(swap.id), setActionType('approve')) : resetAction()}>
                            <DialogTrigger asChild>
                              <Button size="sm" className="bg-[#00E676] hover:bg-[#00E676]/90 text-black font-bold h-8 w-8 p-0">
                                <Check className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-right text-[#00E676]">اعتماد التبديل</DialogTitle>
                                <DialogDescription className="text-right">سيتم تبديل الجداول بشكل رسمي. يمكنك إضافة ملاحظة إدارية.</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <Input placeholder="ملاحظات (اختياري)..." value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-black/20" />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={resetAction}>إلغاء</Button>
                                  <Button onClick={handleActionConfirm} className="bg-[#00E676] text-black hover:bg-[#00E676]/90" disabled={approveMutation.isPending}>
                                    {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'اعتماد الطلب'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog open={actionId === swap.id && actionType === 'reject'} onOpenChange={(o) => o ? (setActionId(swap.id), setActionType('reject')) : resetAction()}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-destructive/20 h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-right text-destructive">رفض التبديل</DialogTitle>
                                <DialogDescription className="text-right">يرجى توضيح سبب رفض طلب التبديل.</DialogDescription>
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
                icon={Repeat} 
                title="لا توجد طلبات معلقة" 
                description="جميع طلبات التبديل تمت مراجعتها." 
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
