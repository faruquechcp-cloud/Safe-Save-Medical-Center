
import React from 'react';
import Modal from './Modal';
import WarningIcon from './icons/WarningIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode; 
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string; 
  confirmButtonHoverColor?: string;
  focusRingColor?: string;
  zIndex?: number;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor = "bg-red-600",
  confirmButtonHoverColor = "hover:bg-red-700",
  // focusRingColor is unused in the implementation below, removed from destructuring to fix lint error
  zIndex = 100 // High default for alerts
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" zIndex={zIndex}>
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <WarningIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-sm text-gray-600 mb-6 font-bold uppercase tracking-tight">
            {message}
          </div>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
          >
            {cancelButtonText}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-8 py-2.5 text-[10px] font-black uppercase tracking-widest text-white ${confirmButtonColor} ${confirmButtonHoverColor} rounded-xl shadow-lg transition-all active:scale-95`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
