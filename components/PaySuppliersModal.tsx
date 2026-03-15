
import React, { useState, useEffect, useMemo } from 'react';
import { Supplier, PurchaseInvoice } from '../types';
import Modal from './Modal';
import { useTranslations } from '../hooks/useTranslations';
import SearchableSelect from './SearchableSelect';
import { formatCurrency } from '../utils/formatUtils';

interface PaySuppliersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    supplierId: string, 
    paymentAmount: number, 
    paymentDate: string, 
    notes: string
  ) => void;
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[];
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const PaySuppliersModal: React.FC<PaySuppliersModalProps> = ({ 
  isOpen, onClose, onSubmit, suppliers, onMinimize, isMinimized 
}) => {
  const { t } = useTranslations();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const selectedSupplier = useMemo(() => 
    suppliers.find(s => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  );

  const supplierOptions = useMemo(() => {
    return suppliers
      .filter(s => s.totalAmountOwed > 0)
      .map(s => ({
        id: s.id,
        label: s.name,
        subLabel: `${s.contact || ''} | ${t('reports.supplierDues')}: ${formatCurrency(s.totalAmountOwed)}`
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'bn'));
  }, [suppliers, t]);

  useEffect(() => {
    if (isOpen) {
      setSelectedSupplierId('');
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!selectedSupplierId) newErrors.selectedSupplierId = "Required";
    
    const amountNum = Number(paymentAmount);
    if (amountNum <= 0 || paymentAmount === '' || isNaN(amountNum)) {
      newErrors.paymentAmount = "Invalid amount";
    } else if (selectedSupplier && amountNum > selectedSupplier.totalAmountOwed + 0.01) {
      newErrors.paymentAmount = "Exceeds balance";
    }

    if (!paymentDate) newErrors.paymentDate = "Required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const now = new Date();
    const selectedDate = new Date(paymentDate);
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    
    onSubmit(selectedSupplierId, Number(paymentAmount), selectedDate.toISOString(), notes.trim());
    onClose();
  };

  const inputClass = "w-full px-6 py-4 border border-gray-100 bg-gray-50/50 rounded-3xl text-sm font-bold shadow-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all";
  const labelClass = "block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('accounting.paySupplierTitle')} size="lg" onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white overflow-hidden">
        <div className="flex-1 p-8 sm:p-10 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Supplier Searchable Selection */}
          <div className="space-y-1">
            <SearchableSelect 
              label={t('purchaseInvoiceForm.supplierLabel')}
              options={supplierOptions}
              selectedId={selectedSupplierId}
              onSelect={(id) => setSelectedSupplierId(id)}
              placeholder={t('purchaseInvoiceForm.selectSupplierPlaceholder')}
              required
            />
          </div>

          {/* Account Status Info */}
          {selectedSupplier && (
            <div className="p-6 rounded-[28px] border border-primary-100 bg-primary-50/50 text-primary-700 transition-all animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t('reports.supplierDues')}</p>
                    <p className="text-2xl font-black tracking-tighter">
                      {formatCurrency(selectedSupplier.totalAmountOwed)}
                    </p>
                </div>
                <div className="text-right">
                    <span className="px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary-100">
                        {t('purchaseInvoiceForm.summary.amountDue')}
                    </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-1">
                <label className={labelClass}>{t('accounting.amountLabel')} *</label>
                <input 
                    type="number" 
                    value={paymentAmount} 
                    onChange={e => setPaymentAmount(e.target.value)}
                    disabled={!selectedSupplierId}
                    step="0.01" min="0.01"
                    placeholder="0.00"
                    className={`${inputClass} ${errors.paymentAmount ? 'border-red-300' : ''} text-lg font-black text-primary-700`}
                />
            </div>

            <div className="space-y-1">
                <label className={labelClass}>{t('saleInvoiceForm.dateLabel')} *</label>
                <input 
                    type="date" 
                    value={paymentDate} 
                    onChange={e => setPaymentDate(e.target.value)}
                    className={inputClass}
                />
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClass}>{t('productForm.notesLabel')}</label>
            <textarea 
              rows={3} 
              value={notes} 
              onChange={e => setNotes(e.target.value)}
              className={inputClass}
              placeholder={t('accounting.notesPlaceholder')}
            />
          </div>
        </div>

        <div className="shrink-0 px-8 py-8 border-t border-gray-50 flex flex-col sm:flex-row-reverse gap-4 bg-white z-10">
          <button type="submit"
            disabled={!selectedSupplierId || paymentAmount === '' || Number(paymentAmount) <= 0}
            className="w-full sm:w-auto px-16 py-5 bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-[24px] shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
            {t('accounting.paySupplierDue')}
          </button>
          <button type="button" onClick={onClose}
            className="w-full sm:w-auto px-10 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-[24px] transition-all">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PaySuppliersModal;
