import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, CalendarDays, AlertCircle } from 'lucide-react';

export const Schedule: React.FC = () => {
  const { data: mySchedule, isLoading: isLoadingCurrent } = useQuery({
    queryKey: queryKeys.schedules.my,
    queryFn: scheduleApi.getMySchedule,
    retry: false
  });

  const { data: recentSchedules, isLoading: isLoadingRecent } = useQuery({
    queryKey: queryKeys.schedules.recent,
    queryFn: scheduleApi.getMyRecent,
  });

  return (
    <div className="space-y-8">
      <PageHeader 
        title="جدول العمل" 
        description="عرض جدول العمل الحالي والتاريخي الخاص بك"
      />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          الجدول الحالي
        </h2>
        
        {isLoadingCurrent ? (
          <Card className="bg-card/50"><CardContent className="p-8"><LoadingSpinner /></CardContent></Card>
        ) : mySchedule ? (
          <Card className="border-primary/20 bg-primary/5 shadow-md overflow-hidden relative">
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary" />
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">بداية الأسبوع</p>
                  <p className="text-xl font-bold font-mono tracking-tight">{mySchedule.weekStart}</p>
                  
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">أيام العمل</p>
                        <p className="font-medium font-mono" dir="ltr">{mySchedule.workDays}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-muted-foreground">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">أوقات الوردية</p>
                        <p className="font-medium font-mono" dir="ltr">{mySchedule.shiftStart} - {mySchedule.shiftEnd}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
                  {mySchedule.isWeekendDuty && (
                    <Badge variant="secondary" className="bg-[#C9963F] text-white w-fit mb-3">تكليف عطلة نهاية الأسبوع</Badge>
                  )}
                  {mySchedule.notes ? (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 border-b border-white/10 pb-1">ملاحظات الإدارة:</p>
                      <p className="text-sm mt-2">{mySchedule.notes}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center italic">لا توجد ملاحظات إضافية</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmptyState 
            icon={CalendarIcon} 
            title="لا يوجد جدول عمل" 
            description="لم يتم تعيين جدول عمل لك لهذا الأسبوع بعد. يرجى مراجعة مدير القسم." 
          />
        )}
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="text-xl font-semibold text-muted-foreground">السجل السابق</h2>
        
        {isLoadingRecent ? (
          <LoadingSpinner />
        ) : recentSchedules && recentSchedules.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSchedules.filter(s => mySchedule ? s.id !== mySchedule.id : true).map((schedule) => (
              <Card key={schedule.id} className="bg-card/30 border-border/50 hover:bg-card/50 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-border/50 pb-2">
                    <span className="font-mono text-sm font-semibold">{schedule.weekStart}</span>
                    {schedule.isWeekendDuty && <Badge variant="outline" className="text-xs border-[#C9963F] text-[#C9963F]">عطلة</Badge>}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>أيام العمل:</span>
                      <span className="font-mono text-foreground" dir="ltr">{schedule.workDays}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex justify-between">
                      <span>الوردية:</span>
                      <span className="font-mono text-foreground" dir="ltr">{schedule.shiftStart} - {schedule.shiftEnd}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic bg-card/20 p-4 rounded-lg text-center">لا توجد سجلات جداول سابقة</p>
        )}
      </div>
    </div>
  );
};
