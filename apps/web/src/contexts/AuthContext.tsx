import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session, loadSession, clearSession, saveSession } from '@/services/auth';

// ── Session-expired callback ─────────────────────────────────────────────────
// api.ts cannot call the router directly, so it calls this callback which
// is wired up by App.tsx on mount.
let _onSessionExpired: (() => void) | null = null;
export function setSessionExpiredCallback(cb: () => void) {
  _onSessionExpired = cb;
}
export function triggerSessionExpired() {
  _onSessionExpired?.();
}

interface AuthContextType {
  session: Session | null;
  login: (session: Session) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const s = loadSession();
    if (s) setSession(s);
    setIsLoading(false);
  }, []);

  const login = useCallback((s: Session) => {
    saveSession(s);
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

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
