
import React from 'react';
import WarningIcon from './icons/WarningIcon';

interface AlertBadgeProps {
  message: string;
  type: 'warning' | 'critical' | 'info';
  className?: string;
}

const AlertBadge: React.FC<AlertBadgeProps> = ({ message, type, className = '' }) => {
  const baseClasses = "text-xs font-semibold inline-flex items-center px-2.5 py-0.5 rounded-full";
  let typeClasses = "";

  switch (type) {
    case 'warning':
      typeClasses = "bg-yellow-100 text-yellow-800";
      break;
    case 'critical':
      typeClasses = "bg-red-100 text-red-800";
      break;
    case 'info':
      typeClasses = "bg-blue-100 text-blue-800";
      break;
  }

  return (
    <span className={`${baseClasses} ${typeClasses} ${className}`}>
      <WarningIcon className="w-3 h-3 mr-1.5" />
      {message}
    </span>
  );
};

export default AlertBadge;
