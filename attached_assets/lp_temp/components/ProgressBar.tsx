import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
  subLabel: string;
  isActive?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label, subLabel, isActive = false }) => {
  const percentage = Math.min((current / total) * 100, 100);
  
  return (
    <div className={`p-4 rounded-xl border ${isActive ? 'border-brand-200 bg-brand-50/50' : 'border-slate-100 bg-white'} transition-all`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-semibold text-sm ${isActive ? 'text-brand-900' : 'text-slate-700'}`}>
          {label}
        </span>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {subLabel}
        </span>
      </div>
      
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div 
          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${isActive ? 'bg-gradient-to-r from-brand-500 to-brand-600' : 'bg-slate-400'}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between items-center mt-2 text-xs">
        <span className="text-slate-500 font-medium">
          {isActive ? '🔥 Vagas preenchendo rápido' : 'Aguardando abertura'}
        </span>
        <span className={`font-bold ${isActive ? 'text-brand-600' : 'text-slate-400'}`}>
          {current}/{total} Vagas
        </span>
      </div>
    </div>
  );
};