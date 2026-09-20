import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusValue = 
  | 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | 'HOLIDAY' 
  | 'PENDING_DEPT_MANAGER' | 'PENDING_MAIN_MANAGER' 
  | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface StatusBadgeProps {
  status: StatusValue | string;
  className?: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary"; className: string }> = {
  PRESENT: { label: 'حاضر', variant: 'default', className: 'bg-primary text-primary-foreground' },
  LATE: { label: 'متأخر', variant: 'secondary', className: 'bg-[#C9963F] text-white hover:bg-[#C9963F]/80' },
  ABSENT: { label: 'غائب', variant: 'destructive', className: '' },
  EXCUSED: { label: 'مُعذَر', variant: 'secondary', className: 'bg-blue-600 text-white hover:bg-blue-700' },
  HOLIDAY: { label: 'عطلة', variant: 'outline', className: 'text-muted-foreground border-muted-foreground' },
  PENDING_DEPT_MANAGER: { label: 'بانتظار الموافقة', variant: 'secondary', className: 'bg-[#C9963F] text-white hover:bg-[#C9963F]/80' },
  PENDING_MAIN_MANAGER: { label: 'بانتظار الموافقة', variant: 'secondary', className: 'bg-[#C9963F] text-white hover:bg-[#C9963F]/80' },
  APPROVED: { label: 'مقبول', variant: 'default', className: 'bg-primary text-primary-foreground' },
  REJECTED: { label: 'مرفوض', variant: 'destructive', className: '' },
  CANCELLED: { label: 'ملغى', variant: 'outline', className: 'text-muted-foreground border-muted-foreground' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const mapped = statusMap[status] || { label: status, variant: 'outline', className: 'text-muted-foreground' };
  
  return (
    <Badge 
      variant={mapped.variant as any} 
      className={cn("whitespace-nowrap px-2 py-0.5 rounded-full font-medium text-xs border-0", mapped.className, className)}
    >
      {mapped.label}
    </Badge>
  );
};
