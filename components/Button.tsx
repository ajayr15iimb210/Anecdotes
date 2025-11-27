import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "relative flex items-center justify-center px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-600 text-white shadow-lg shadow-primary-200 hover:bg-primary-700 hover:shadow-primary-300",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    ghost: "bg-transparent text-primary-600 hover:bg-primary-50",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
      {children}
    </button>
  );
};