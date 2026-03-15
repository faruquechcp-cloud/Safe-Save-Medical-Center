
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import Modal from './Modal'; 
import { useTranslations } from '../hooks/useTranslations';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Customer) => void;
  initialData?: Customer | null;
  title: string;
  zIndex?: number; // Added zIndex prop for layering
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const defaultFormData: Omit<Customer, 'id' | 'totalDueAmount' | 'dateAdded'> = {
  name: '',
  phone: '',
  email: '',
  address: '',
  openingBalance: '' as any,
};

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, title, zIndex, onMinimize, isMinimized }) => {
  const { t } = useTranslations();
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'totalDueAmount'| 'dateAdded'>>(defaultFormData);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const { id, totalDueAmount, dateAdded, ...dataToEdit } = initialData;
        setFormData(dataToEdit);
      } else {
        setFormData(defaultFormData);
      }
      setFormError(null);
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
    if (formError) setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
        setFormError(t('common.error') + ": Name is required");
        return;
    }

    const openingBal = Number(formData.openingBalance) || 0;
    const submittedCustomer: Customer = {
      id: initialData?.id || crypto.randomUUID(),
      ...formData,
      openingBalance: openingBal,
      totalDueAmount: initialData ? (initialData.totalDueAmount - initialData.openingBalance + openingBal) : openingBal, 
      dateAdded: initialData?.dateAdded || new Date().toISOString(),
    };
    onSubmit(submittedCustomer);
    onClose(); 
  };

  const inputClass = "w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold shadow-sm focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all";
  const labelClass = "block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl" zIndex={zIndex} onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden bg-white">
        {formError && (
            <div className="mx-6 mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-wide border border-red-100">
                {formError}
            </div>
        )}
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 custom-scrollbar">
          <div className="space-y-1">
            <label className={labelClass}>{t('customerForm.nameLabel')} <span className="text-red-500">*</span></label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>{t('customerForm.phoneLabel')}</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>{t('customerForm.emailLabel')}</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>{t('customerForm.openingBalanceLabel')}</label>
              <input type="number" name="openingBalance" value={formData.openingBalance} onChange={handleChange} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>{t('customerForm.addressLabel')}</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 px-6 sm:px-10 py-6 sm:py-8 border-t border-gray-50 flex flex-col sm:flex-row-reverse gap-4 bg-white z-10">
          <button type="submit" className="w-full sm:w-auto px-16 py-5 text-[10px] sm:text-[11px] font-black text-white bg-primary-600 uppercase tracking-[0.2em] rounded-[24px] shadow-xl hover:brightness-110 active:scale-95 transition-all">
            {initialData ? t('common.save') : t('common.add')}
          </button>
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-10 py-5 text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-[24px] transition-all">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
