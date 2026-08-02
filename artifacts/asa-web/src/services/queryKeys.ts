export const queryKeys = {
  attendance: {
    today: ['attendance-today'],
    history: (page?: number) => ['attendance-history', page],
    todaySummary: (deptId?: string) => ['admin-attendance-today', deptId],
  },
  schedules: {
    my: ['schedules-my'],
    recent: ['schedules-recent'],
    swapsMy: ['schedules-swaps-my'],
    swapsPending: ['schedules-swaps-pending'],
  },
  vacations: {
    balance: ['vacations-balance'],
    my: ['vacations-my'],
    pending: ['vacations-pending'],
    all: ['vacations-all'],
  },
  messages: {
    list: ['messages-list'],
  },
  announcements: {
    list: ['announcements-list'],
    thread: (id: string) => ['announcement-thread', id],
  },
  departments: {
    active: ['departments-active'],
    all: ['departments-all'],
    detail: (id: string) => ['department-detail', id],
  },
  admin: {
    pendingRegistrations: (page?: number) => ['admin-pending-registrations', page],
    employeesAll: ['admin-employees-all'],
    employeesActive: ['admin-employees-active'],
  }
};
