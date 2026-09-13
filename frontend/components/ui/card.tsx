import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div
    className={cn(
      'bg-[#161616] border border-[#262626] rounded-xl p-6 transition-all duration-300 hover:border-[#f84525]/40 shadow-xl relative overflow-hidden',
      className
    )}
  >
    {children}
  </div>
);
