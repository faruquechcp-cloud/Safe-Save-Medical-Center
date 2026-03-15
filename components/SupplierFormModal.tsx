
import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';
import Modal from './Modal';
import { useTranslations } from '../hooks/useTranslations';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (supplier: Supplier) => void;
  initialData?: Supplier | null;
  title: string;
  zIndex?: number; // Added zIndex prop
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const defaultFormData: Omit<Supplier, 'id' | 'totalAmountOwed' | 'dateAdded'> = {
  name: '',
  contact: '',
  email: '',
};

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, zIndex, onMinimize, isMinimized }) => {
  const { t } = useTranslations();
  const [formData, setFormData] = useState<Omit<Supplier, 'id' | 'totalAmountOwed'| 'dateAdded'>>(defaultFormData);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const { id, totalAmountOwed, dateAdded, ...dataToEdit } = initialData;
        setFormData(dataToEdit);
      } else {
        setFormData(defaultFormData);
      }
      setFormError(null);
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        setFormError(t('supplierForm.error.nameRequired', 'Supplier name is required.'));
        return;
    }

    const submittedSupplier: Supplier = {
      id: initialData?.id || crypto.randomUUID(),
      ...formData,
      totalAmountOwed: initialData?.totalAmountOwed || 0,
      dateAdded: initialData?.dateAdded || new Date().toISOString(),
    };
    onSubmit(submittedSupplier);
    onClose();
  };

  const inputClass = "w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all";
  const labelClass = "block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1.5";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? t('supplierForm.editTitle') : t('supplierForm.addTitle')} size="md" zIndex={zIndex} onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden bg-white">
        {formError && (
            <div className="mx-8 mt-6 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wide border border-red-100">
                {formError}
            </div>
        )}
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            <div className="space-y-1">
              <label className={labelClass}>
                  {t('supplierForm.nameLabel')} <span className="text-red-500">*</span>
              </label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>{t('supplierForm.contactLabel')}</label>
              <input type="text" name="contact" value={formData.contact || ''} onChange={handleChange} className={inputClass} />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>{t('customerForm.emailLabel')}</label>
              <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={inputClass} />
            </div>
        </div>

        {/* Sticky Footer */}
        <div className="shrink-0 px-8 py-6 border-t border-gray-50 flex flex-col sm:flex-row-reverse gap-4 bg-white z-10">
          <button type="submit" className="w-full sm:w-auto px-12 py-3.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg hover:brightness-110 active:scale-95 transition-all">
            {initialData ? t('common.save') : t('common.add')}
          </button>
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-8 py-3.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierFormModal;
