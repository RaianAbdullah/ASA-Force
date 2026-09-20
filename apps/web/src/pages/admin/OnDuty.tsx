import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { PageHeader } from '@/components/shared/PageHeader';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock } from 'lucide-react';

export const OnDuty: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.attendance.todaySummary(),
    queryFn: () => attendanceApi.getTodaySummary(),
    refetchInterval: 30000, // Refresh every 30s
  });

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    return timeStr.substring(0, 5);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="الحضور اليوم" 
        description="مراقبة حية للموظفين المتواجدين حالياً"
      />

      {isLoading ? (
        <Card className="p-12"><LoadingSpinner /></Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border p-4 rounded-xl text-center space-y-1 shadow-sm">
              <p className="text-xs text-muted-foreground uppercase tracking-widest">إجمالي الموظفين</p>
              <p className="text-2xl font-bold font-mono">{data.totalActive}</p>
            </div>
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-center space-y-1 shadow-sm">
              <p className="text-xs text-primary uppercase tracking-widest">حاضر الآن</p>
              <p className="text-2xl font-bold font-mono text-primary">{data.checkedIn}</p>
            </div>
            <div className="bg-[#C9963F]/5 border border-[#C9963F]/20 p-4 rounded-xl text-center space-y-1 shadow-sm">
              <p className="text-xs text-[#C9963F] uppercase tracking-widest">متأخر</p>
              <p className="text-2xl font-bold font-mono text-[#C9963F]">{data.late}</p>
            </div>
            <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-xl text-center space-y-1 shadow-sm">
              <p className="text-xs text-destructive uppercase tracking-widest">غائب / لم يحضر</p>
              <p className="text-2xl font-bold font-mono text-destructive">{data.absent}</p>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                سجل الدخول المباشر
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="text-xs text-muted-foreground bg-black/10 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-medium">الموظف</th>
                      <th className="px-6 py-4 font-medium text-center">القسم</th>
                      <th className="px-6 py-4 font-medium text-center">الحالة</th>
                      <th className="px-6 py-4 font-medium text-center">وقت الدخول</th>
                      <th className="px-6 py-4 font-medium text-center">وقت الانصراف</th>
                      <th className="px-6 py-4 font-medium text-left">التأخير</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.records.map((record) => (
                      <tr key={record.id || record.employeeId} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">
                          {record.firstNameAr} {record.lastNameAr}
                        </td>
                        <td className="px-6 py-4 text-center text-muted-foreground">
                          {record.departmentNameAr || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="px-6 py-4 text-center font-mono" dir="ltr">
                          {formatTime(record.checkInTime)}
                        </td>
                        <td className="px-6 py-4 text-center font-mono" dir="ltr">
                          {formatTime(record.checkOutTime)}
                        </td>
                        <td className="px-6 py-4 text-left">
                          {record.minutesLate > 0 ? (
                            <span className="text-[#C9963F] font-medium text-xs">
                              {record.minutesLate} دقيقة
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {data.records.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-3 opacity-20" />
                          لا توجد سجلات حضور لليوم
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
};
