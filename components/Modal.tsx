
import React, { useEffect, useState, useRef } from 'react';
import CloseIcon from './icons/CloseIcon';
import MinimizeIcon from './icons/MinimizeIcon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  zIndex = 50,
  onMinimize,
  isMinimized = false
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const modalDialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      document.body.style.overflow = 'hidden';
      setShowDialog(true);
    } else {
      setShowDialog(false);
      document.body.style.overflow = '';
    }
  }, [isOpen, isMinimized]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl',
    '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl',
  };

  return (
    <div 
      className={`fixed inset-0 flex justify-center items-center p-4 transition-opacity duration-200 ${
        isMinimized ? 'opacity-0 pointer-events-none' : 'opacity-100 bg-black/60 backdrop-blur-[2px]'
      }`}
      style={{ 
        visibility: isMinimized ? 'hidden' : 'visible',
        zIndex: zIndex 
      }}
    >
      <div 
        ref={modalDialogRef}
        className={`bg-white rounded-[32px] shadow-2xl relative w-full flex flex-col transform transition-transform duration-200 ${
          showDialog ? 'scale-100' : 'scale-95'
        } ${sizeClasses[size]} max-h-[95vh] overflow-hidden border border-gray-100`}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider truncate pr-4">{title}</h2>
          <div className="flex items-center space-x-2">
            {onMinimize && (
              <button 
                onClick={onMinimize} 
                className="p-1.5 text-gray-400 hover:text-teal-600 transition-colors" 
                title="Minimize"
              >
                <MinimizeIcon className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" 
              title="Close"
            >
                <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 bg-white relative custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
