import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, scheduleApi, authApi } from '@/services/api';
import { queryKeys } from '@/services/queryKeys';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Clock, MapPin, Calendar as CalendarIcon, Loader2, PlayCircle, Building2 } from 'lucide-react';
import { Link } from 'wouter';

export const Dashboard: React.FC = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: todayAttendance, isLoading: isLoadingAtt } = useQuery({
    queryKey: queryKeys.attendance.today,
    queryFn: attendanceApi.getToday,
  });

  const { data: mySchedule, isLoading: isLoadingSched } = useQuery({
    queryKey: queryKeys.schedules.my,
    queryFn: scheduleApi.getMySchedule,
  });

  const checkInMutation = useMutation({
    mutationFn: (coords: { lat: number, lng: number }) => attendanceApi.checkIn(coords.lat, coords.lng),
    onSuccess: () => {
      toast({ title: 'تم تسجيل الدخول', description: 'تم تسجيل الحضور بنجاح' });
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance.today });
    },
    onError: (error: any) => {
      toast({ 
        title: 'خطأ في تسجيل الدخول', 
        description: error.message || 'حدث خطأ أثناء محاولة تسجيل الحضور', 
        variant: 'destructive' 
      });
    }
  });

  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      toast({ title: 'خطأ', description: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        checkInMutation.mutate({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        let msg = 'تعذر الحصول على الموقع';
        if (error.code === 1) msg = 'يرجى السماح بالوصول إلى موقعك لتسجيل الحضور';
        toast({ title: 'خطأ في الموقع', description: msg, variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const isPending = checkInMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row-reverse justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-foreground">مرحباً، {session?.nameAr}</h1>
          <p className="text-muted-foreground mt-1">يوم سعيد وعمل مثمر!</p>
          <p className="inline-flex items-center gap-1.5 text-sm text-primary/80 mt-2">
            <Building2 className="h-4 w-4" />
            {session?.departmentNameAr || 'القسم غير محدد'}
          </p>
        </div>
        <div className="text-left">
          <div className="text-3xl font-mono tracking-tight font-bold text-primary" dir="ltr">
            {currentTime.toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <div className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir="ltr">
        <Card className="md:col-span-2 md:order-2 shadow-sm border-border bg-card/50 overflow-hidden relative" dir="rtl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              حالة الحضور اليوم
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAtt || isLoadingSched ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-8">
                {mySchedule?.todayIsWorkDay ? (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">الوردية المجدولة</p>
                      <p className="font-semibold text-lg flex items-center gap-2" dir="ltr">
                        {mySchedule.shiftStart} <ArrowRight className="h-4 w-4 text-muted-foreground" /> {mySchedule.shiftEnd}
                      </p>
                    </div>
                    {todayAttendance?.status && (
                      <div className="text-left">
                        <p className="text-sm text-muted-foreground mb-1">الحالة</p>
                        <StatusBadge status={todayAttendance.status} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-black/20 border border-white/5 text-center">
                    <p className="text-muted-foreground">ليس لديك وردية عمل مجدولة اليوم</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <p className="text-sm text-muted-foreground mb-2">وقت الدخول</p>
                    <p className="text-xl font-bold font-mono" dir="ltr">
                      {todayAttendance?.checkInTime || '--:--'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border bg-card">
                    <p className="text-sm text-muted-foreground mb-2">نهاية الوردية</p>
                    <p className="text-xl font-bold font-mono" dir="ltr">
                      {mySchedule?.shiftEnd || '--:--'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center pt-4 border-t border-border">
                  {mySchedule?.todayIsWorkDay ? (
                    <>
                      {todayAttendance?.canCheckIn && (
                        <Button 
                          size="lg" 
                          className="w-full sm:w-auto min-w-[200px] h-14 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(0,230,118,0.2)]"
                          onClick={handleCheckIn}
                          disabled={isPending}
                        >
                          {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                            <><PlayCircle className="h-6 w-6 ml-2" /> تسجيل الدخول</>
                          )}
                        </Button>
                      )}
                      {!todayAttendance?.canCheckIn && todayAttendance?.checkInTime && (
                        <p className="text-[#00E676] font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" /> تم تسجيل الحضور بنجاح
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> سيتم استخدام موقعك الحالي
                      </p>
                    </>
                  ) : (
                     <p className="text-muted-foreground">لا يمكن تسجيل الحضور في يوم العطلة</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 md:order-1" dir="rtl">
          <Card className="shadow-sm border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-[#C9963F]" />
                جدول هذا الأسبوع
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSched ? <LoadingSpinner size={20} /> : mySchedule ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                    <span className="text-muted-foreground">بداية الأسبوع</span>
                    <span className="font-mono">{mySchedule.weekStart}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                    <span className="text-muted-foreground">أيام العمل</span>
                    <span className="font-mono" dir="ltr">{mySchedule.workDays}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-border pb-2">
                    <span className="text-muted-foreground">الوردية</span>
                    <span className="font-mono" dir="ltr">{mySchedule.shiftStart} - {mySchedule.shiftEnd}</span>
                  </div>
                  <div className="pt-2">
                    <Link href="/schedule">
                      <Button variant="outline" className="w-full text-xs" size="sm">عرض التفاصيل</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">لا يوجد جدول متاح</p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">وصول سريع</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              <Link href="/vacations">
                <Button variant="secondary" className="w-full justify-start text-xs h-10 bg-white/5 hover:bg-white/10">طلب إجازة</Button>
              </Link>
              <Link href="/shift-swap">
                <Button variant="secondary" className="w-full justify-start text-xs h-10 bg-white/5 hover:bg-white/10">تبديل وردية</Button>
              </Link>
              <Link href="/messages">
                <Button variant="secondary" className="w-full justify-start text-xs h-10 bg-white/5 hover:bg-white/10">مراسلة</Button>
              </Link>
              <Link href="/attendance">
                <Button variant="secondary" className="w-full justify-start text-xs h-10 bg-white/5 hover:bg-white/10">السجل</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

function ArrowRight(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
}

function CheckCircle2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
}
