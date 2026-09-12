import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={cn('bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl p-6 shadow-xl', className)}>
    {children}
  </div>
);
