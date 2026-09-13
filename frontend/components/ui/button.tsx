import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyle =
    'inline-flex items-center justify-center font-display uppercase tracking-wider font-semibold transition-all duration-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#f84525]/50 focus:ring-offset-2 focus:ring-offset-[#0d0d0d] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'bg-[#f84525] hover:bg-[#e03819] text-white shadow-lg shadow-[#f84525]/20 hover:shadow-[#f84525]/40 border border-[#f84525]',
    secondary:
      'bg-[#161616] text-white hover:bg-[#202020] border border-[#262626] hover:border-[#f84525]/50',
    outline:
      'border border-[#262626] text-white bg-transparent hover:border-[#f84525] hover:text-[#f84525]',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 shadow-sm',
    ghost:
      'text-[#9c9c9c] hover:text-white hover:bg-[#161616] bg-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[11px]',
    md: 'px-4 py-2 text.xs',
    lg: 'px-6 py-3 text-xs tracking-widest',
  };

  return (
    <button
      className={cn(baseStyle, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-3.5 w-3.5 text-current" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
