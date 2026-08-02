import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

export const Attendance: React.FC = () => {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.attendance.history(page),
    queryFn: () => attendanceApi.getHistory(page, 20),
  });

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        day: d.toLocaleDateString('ar-SA', { weekday: 'long' }),
        date: d.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
      };
    } catch {
      return { day: '', date: dateStr };
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    // Ensure it displays exactly as returned (often HH:mm)
    return timeStr.substring(0, 5);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="سجل الحضور" 
        description="تتبع تاريخ حضورك وانصرافك اليومي"
      />

      <Card className="bg-card border-border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : data?.content && data.content.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="text-xs text-muted-foreground bg-black/20 uppercase border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium">التاريخ</th>
                    <th className="px-6 py-4 font-medium text-center">الحالة</th>
                    <th className="px-6 py-4 font-medium text-center">وقت الدخول</th>
                    <th className="px-6 py-4 font-medium text-center">وقت الانصراف</th>
                    <th className="px-6 py-4 font-medium text-center">الوردية</th>
                    <th className="px-6 py-4 font-medium text-left">التأخير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.content.map((record, i) => {
                    const { day, date } = formatDate(record.attendanceDate);
                    return (
                      <tr key={record.id || i} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-foreground">{day}</div>
                          <div className="text-xs text-muted-foreground font-mono">{date}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-medium" dir="ltr">
                          {formatTime(record.checkInTime)}
                        </td>
                        <td className="px-6 py-4 text-center font-mono font-medium" dir="ltr">
                          {formatTime(record.checkOutTime)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {record.shiftStart && record.shiftEnd ? (
                            <span className="text-xs font-mono text-muted-foreground bg-black/20 px-2 py-1 rounded" dir="ltr">
                              {formatTime(record.shiftStart)}-{formatTime(record.shiftEnd)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-left">
                          {record.minutesLate > 0 ? (
                            <span className="text-[#EF4444] font-medium bg-[#EF4444]/10 px-2 py-1 rounded text-xs inline-flex items-center gap-1">
                              {record.minutesLate} دقيقة
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-black/10">
                <span className="text-sm text-muted-foreground">
                  صفحة {data.number + 1} من {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={data.number === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
                    disabled={data.last}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <EmptyState 
            icon={Clock} 
            title="لا يوجد سجل حضور" 
            description="لم يتم العثور على أي سجلات حضور في النظام." 
          />
        )}
      </Card>
    </div>
  );
};
