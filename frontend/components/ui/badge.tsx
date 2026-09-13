import React from 'react';
import { cn } from '@/lib/utils';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'flame';
  className?: string;
}> = ({ children, variant = 'flame', className }) => {
  const styles = {
    flame: 'bg-[#f84525]/10 text-[#f84525] border-[#f84525]/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-[#161616] text-[#9c9c9c] border-[#262626]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-semibold border',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
