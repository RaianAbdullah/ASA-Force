import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, size = 24 }) => {
  return (
    <div className={cn('flex items-center justify-center p-4', className)}>
      <Loader2 className="animate-spin text-primary" size={size} />
    </div>
  );
};

export const FullPageLoader = () => (
  <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);
