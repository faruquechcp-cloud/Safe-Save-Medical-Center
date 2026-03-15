
import React, { useEffect, useState } from 'react';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import WarningIcon from './icons/WarningIcon';
import CloseIcon from './icons/CloseIcon';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  let bgClass = '';
  let icon = null;

  switch (type) {
    case 'success':
      bgClass = 'bg-green-600';
      icon = <ShieldCheckIcon className="w-5 h-5 text-white" />;
      break;
    case 'error':
      bgClass = 'bg-red-600';
      icon = <WarningIcon className="w-5 h-5 text-white" />;
      break;
    default:
      bgClass = 'bg-blue-600';
      icon = <div className="w-5 h-5 text-white flex items-center justify-center font-bold">i</div>;
  }

  return (
    <div className={`fixed bottom-5 right-5 z-[9999] flex items-center p-4 mb-4 rounded-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in ${bgClass} max-w-sm`}>
      <div className="flex-shrink-0 mr-3">
        {icon}
      </div>
      <div className="text-xs font-bold text-white uppercase tracking-wider">{message}</div>
      <button 
        type="button" 
        onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
        className="ml-4 -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 text-white hover:bg-white/20 focus:ring-2 focus:ring-white/50"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
