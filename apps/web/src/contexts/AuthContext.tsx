import { useQueryClient } from '@tanstack/react-query';
import { restoreBrowserSession } from '@/services/api';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, loadSession, clearSession, saveSession } from '@/services/auth';

export { setSessionExpiredCallback } from '@/services/api';

interface AuthContextType {
  session: Session | null;
  login: (session: Session) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    restoreBrowserSession().then(s => { if (mounted) setSession(s); })
      .catch(() => { if (mounted) setSession(null); })
      .finally(() => { if (mounted) setIsLoading(false); });
    return () => { mounted = false; };
  }, []);

  const login = useCallback((s: Session) => {
    saveSession(s);
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear();
    setSession(null);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
