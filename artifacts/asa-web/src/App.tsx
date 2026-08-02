import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { AuthProvider, useAuth, setSessionExpiredCallback } from '@/contexts/AuthContext';
import { Shell } from '@/components/shared/Shell';
import { FullPageLoader } from '@/components/shared/LoadingSpinner';
import React from 'react';

// Pages
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { VerifyOtp } from '@/pages/auth/VerifyOtp';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { ResetPassword } from '@/pages/auth/ResetPassword';
import { ChangePassword } from '@/pages/auth/ChangePassword';
import { WaitingApproval } from '@/pages/auth/WaitingApproval';

import { Dashboard } from '@/pages/employee/Dashboard';
import { Schedule } from '@/pages/employee/Schedule';
import { Attendance } from '@/pages/employee/Attendance';
import { Vacations } from '@/pages/employee/Vacations';
import { Messages } from '@/pages/employee/Messages';
import { Announcements } from '@/pages/employee/Announcements';
import { ShiftSwaps } from '@/pages/employee/ShiftSwaps';
import { Profile } from '@/pages/employee/Profile';

import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { Employees } from '@/pages/admin/Employees';
import { OnDuty } from '@/pages/admin/OnDuty';
import { AdminSchedules } from '@/pages/admin/AdminSchedules';
import { AdminVacations } from '@/pages/admin/AdminVacations';
import { AdminDepartments } from '@/pages/admin/AdminDepartments';
import { AdminAnnouncements } from '@/pages/admin/AdminAnnouncements';
import { AdminSwapRequests } from '@/pages/admin/AdminSwapRequests';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute = ({ component: Component, adminOnly = false, ...rest }: any) => {
  const { session, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && !session) {
      setLocation('/login');
    } else if (!isLoading && adminOnly && session) {
      const isAdmin = session.roles.some((r: string) => 
        ['SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER'].includes(r)
      );
      if (!isAdmin) setLocation('/');
    }
  }, [session, isLoading, location, setLocation, adminOnly]);

  if (isLoading) return <FullPageLoader />;
  if (!session) return null;
  if (adminOnly && !session.roles.some((r: string) => ['SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER'].includes(r))) return null;

  return (
    <Shell>
      <Component {...rest} />
    </Shell>
  );
};

const GuestRoute = ({ component: Component, ...rest }: any) => {
  const { session, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!isLoading && session) {
      setLocation('/');
    }
  }, [session, isLoading, setLocation]);

  if (isLoading) return <FullPageLoader />;
  if (session) return null;

  return <Component {...rest} />;
};

function Router() {
  const [, setLocation] = useLocation();
  
  React.useEffect(() => {
    setSessionExpiredCallback(() => {
      setLocation('/login');
    });
  }, [setLocation]);

  return (
    <Switch>
      {/* Guest */}
      <Route path="/login"><GuestRoute component={Login} /></Route>
      <Route path="/register"><GuestRoute component={Register} /></Route>
      <Route path="/verify-otp"><GuestRoute component={VerifyOtp} /></Route>
      <Route path="/forgot-password"><GuestRoute component={ForgotPassword} /></Route>
      <Route path="/reset-password"><GuestRoute component={ResetPassword} /></Route>
      <Route path="/waiting"><GuestRoute component={WaitingApproval} /></Route>
      
      {/* Semi-Protected */}
      <Route path="/change-password">
        {() => {
          const { session } = useAuth();
          if (!session) { setLocation('/login'); return null; }
          return <ChangePassword />;
        }}
      </Route>

      {/* Employee (Protected) */}
      <Route path="/"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/schedule"><ProtectedRoute component={Schedule} /></Route>
      <Route path="/attendance"><ProtectedRoute component={Attendance} /></Route>
      <Route path="/vacations"><ProtectedRoute component={Vacations} /></Route>
      <Route path="/messages"><ProtectedRoute component={Messages} /></Route>
      <Route path="/announcements"><ProtectedRoute component={Announcements} /></Route>
      <Route path="/shift-swap"><ProtectedRoute component={ShiftSwaps} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>

      {/* Admin (Protected) */}
      <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>
      <Route path="/admin/employees"><ProtectedRoute component={Employees} adminOnly /></Route>
      <Route path="/admin/on-duty"><ProtectedRoute component={OnDuty} adminOnly /></Route>
      <Route path="/admin/schedules"><ProtectedRoute component={AdminSchedules} adminOnly /></Route>
      <Route path="/admin/vacations"><ProtectedRoute component={AdminVacations} adminOnly /></Route>
      <Route path="/admin/departments"><ProtectedRoute component={AdminDepartments} adminOnly /></Route>
      <Route path="/admin/announcements"><ProtectedRoute component={AdminAnnouncements} adminOnly /></Route>
      <Route path="/admin/swap-requests"><ProtectedRoute component={AdminSwapRequests} adminOnly /></Route>

      {/* 404 */}
      <Route>
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background text-foreground text-center p-4">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <p className="text-xl text-muted-foreground mb-8">الصفحة غير موجودة</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium"
          >
            العودة للرئيسية
          </button>
        </div>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
