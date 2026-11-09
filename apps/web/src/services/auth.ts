export type EmployeeRole = 
  | 'SYSTEM_ADMIN' 
  | 'MAIN_MANAGER' 
  | 'DEPARTMENT_MANAGER' 
  | 'WEEKEND_MANAGER' 
  | 'RESPONSIBLE_OFFICER' 
  | 'EMPLOYEE';

export interface Session {
  token: string;
  refreshToken: string;
  role: EmployeeRole;
  roles: EmployeeRole[];
  nameAr: string;
  employeeId: string;
  departmentNameAr?: string;
  mustChangePassword?: boolean;
}

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

// Tokens live in memory only. The refresh credential is an HttpOnly cookie.
let currentSession: Session | null = null;
for (const key of ['asa_jwt', 'asa_refresh', 'asa_role', 'asa_roles', 'asa_name', 'asa_eid', 'asa_department_name_ar']) {
  localStorage.removeItem(key);
}
export const saveSession = (session: Session) => { currentSession = { ...session, refreshToken: '' }; };
export const loadSession = (): Session | null => currentSession;
export const clearSession = () => { currentSession = null; };
export const updateTokens = (token: string, _refreshToken?: string) => {
  if (currentSession) currentSession = { ...currentSession, token, refreshToken: '' };
};

export const hasAnyRole = (roles: EmployeeRole[], allowedRoles: string[]): boolean => {
  return roles.some(r => allowedRoles.includes(r));
};
