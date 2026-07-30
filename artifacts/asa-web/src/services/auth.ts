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

export const saveSession = (session: Session) => {
  localStorage.setItem('asa_jwt', session.token);
  localStorage.setItem('asa_refresh', session.refreshToken);
  localStorage.setItem('asa_role', session.role);
  localStorage.setItem('asa_roles', JSON.stringify(session.roles));
  localStorage.setItem('asa_name', session.nameAr);
  localStorage.setItem('asa_eid', session.employeeId);
  if (session.departmentNameAr) {
    localStorage.setItem('asa_department_name_ar', session.departmentNameAr);
  } else {
    localStorage.removeItem('asa_department_name_ar');
  }
};

export const loadSession = (): Session | null => {
  const token = localStorage.getItem('asa_jwt');
  const refreshToken = localStorage.getItem('asa_refresh');
  const role = localStorage.getItem('asa_role') as EmployeeRole;
  const rolesStr = localStorage.getItem('asa_roles');
  const nameAr = localStorage.getItem('asa_name');
  const employeeId = localStorage.getItem('asa_eid');
  const departmentNameAr = localStorage.getItem('asa_department_name_ar') || undefined;

  if (!token || !refreshToken || !role || !rolesStr || !nameAr || !employeeId) {
    return null;
  }

  try {
    const roles = JSON.parse(rolesStr);
    return { token, refreshToken, role, roles, nameAr, employeeId, departmentNameAr };
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem('asa_jwt');
  localStorage.removeItem('asa_refresh');
  localStorage.removeItem('asa_role');
  localStorage.removeItem('asa_roles');
  localStorage.removeItem('asa_name');
  localStorage.removeItem('asa_eid');
  localStorage.removeItem('asa_department_name_ar');
};

export const updateTokens = (token: string, refreshToken: string) => {
  localStorage.setItem('asa_jwt', token);
  localStorage.setItem('asa_refresh', refreshToken);
};

export const hasAnyRole = (roles: EmployeeRole[], allowedRoles: string[]): boolean => {
  return roles.some(r => allowedRoles.includes(r));
};
