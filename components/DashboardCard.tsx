
import React from 'react';

interface DashboardCardProps {
  title: string;
  value?: string | number;
  description?: string;
  children?: React.ReactNode;
  icon?: React.ReactElement<{ className?: string }>; 
  className?: string;
  valueClassName?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  description, 
  children, 
  icon, 
  className = '',
  valueClassName = ''
}) => {
  return (
    <div className={`premium-card p-6 md:p-8 relative overflow-hidden group ${className}`}>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
        {icon && (
          <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-500 shadow-inner">
            {React.cloneElement(icon, { className: 'w-6 h-6' })}
          </div>
        )}
      </div>
      
      {value !== undefined && (
        <p className={`text-4xl font-black tracking-tighter mb-1 text-slate-800 relative z-10 ${valueClassName}`}>
          {value}
        </p>
      )}
      
      {description && (
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide relative z-10 mb-2">{description}</p>
      )}
      
      {children && <div className="mt-4 relative z-10">{children}</div>}
      
      {/* Decorative background shape */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-slate-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
    </div>
  );
};

export default DashboardCard;
