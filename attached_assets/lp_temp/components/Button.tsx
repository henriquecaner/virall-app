import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'urgency';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  fullWidth = false, 
  children, 
  className = '',
  ...props 
}) => {
  // Enhanced interactions:
  // - hover:-translate-y-1: Lifts button up for affordance
  // - hover:shadow-2xl: Increases depth
  // - active:translate-y-[2px]: Pushes button down physically
  // - active:scale-[0.98]: Subtle compression
  // - active:shadow-sm: Collapses shadow on press
  // - active:duration-75: Instant feedback response
  const baseStyles = "inline-flex items-center justify-center px-8 py-4 text-lg font-bold transition-all duration-200 ease-out rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:shadow-2xl active:translate-y-[1px] active:shadow-sm active:scale-[0.98] active:duration-75 shadow-xl";
  
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30 ring-brand-500",
    urgency: "bg-urgency-500 hover:bg-urgency-400 text-white shadow-urgency-500/30 ring-urgency-500",
    secondary: "bg-dark-900 hover:bg-dark-800 text-white shadow-dark-900/30 ring-dark-900",
    outline: "border-2 border-slate-200 hover:border-brand-600 hover:text-brand-600 text-slate-600 bg-transparent shadow-none hover:shadow-lg active:shadow-none active:bg-slate-50 ring-slate-200"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};