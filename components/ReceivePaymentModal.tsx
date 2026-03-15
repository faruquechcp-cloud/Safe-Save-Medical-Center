
import React, { useState, useEffect, useMemo } from 'react';
import { Customer } from '../types';
import Modal from './Modal';
import { useTranslations } from '../hooks/useTranslations';
import SearchableSelect from './SearchableSelect';
import { formatCurrency } from '../utils/formatUtils';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    customerId: string, 
    paymentAmount: number, 
    paymentDate: string, 
    notes: string
  ) => void;
  customers: Customer[];
  saleInvoices: any[]; 
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const ReceivePaymentModal: React.FC<ReceivePaymentModalProps> = ({ 
  isOpen, onClose, onSubmit, customers, onMinimize, isMinimized 
}) => {
  const { t } = useTranslations();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const customerOptions = useMemo(() => {
    return customers.map(c => ({
      id: c.id,
      label: c.name,
      subLabel: `${c.phone || ''} ${c.totalDueAmount !== 0 ? `| ${t('reports.customerTimeline.column.balance')}: ${formatCurrency(c.totalDueAmount)}` : ''}`
    })).sort((a, b) => a.label.localeCompare(b.label, 'bn'));
  }, [customers, t]);

  useEffect(() => {
    if (isOpen) {
      setSelectedCustomerId('');
      setPaymentAmount('');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!selectedCustomerId) newErrors.selectedCustomerId = "Required";
    
    const amountNum = Number(paymentAmount);
    if (amountNum <= 0 || paymentAmount === '' || isNaN(amountNum)) {
      newErrors.paymentAmount = "Invalid amount";
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
    
    onSubmit(selectedCustomerId, Number(paymentAmount), selectedDate.toISOString(), notes.trim());
    onClose();
  };

  const inputClass = "w-full px-6 py-4 border border-gray-100 bg-gray-50/50 rounded-3xl text-sm font-bold shadow-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all";
  const labelClass = "block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-2";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('accounting.receivePaymentTitle')} size="lg" onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white overflow-hidden">
        <div className="flex-1 p-8 sm:p-10 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Customer Searchable Selection */}
          <div className="space-y-1">
            <SearchableSelect 
              label={t('saleInvoiceForm.customerLabel')}
              options={customerOptions}
              selectedId={selectedCustomerId}
              onSelect={(id) => setSelectedCustomerId(id)}
              placeholder={t('saleInvoiceForm.selectCustomerPlaceholder')}
              required
            />
          </div>

          {/* Account Status Info */}
          {selectedCustomer && (
            <div className={`p-6 rounded-[28px] border transition-all animate-in fade-in zoom-in duration-300 ${selectedCustomer.totalDueAmount > 0 ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
              <div className="flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t('reports.customerTimeline.overallDue')}</p>
                    <p className="text-2xl font-black tracking-tighter">
                      {formatCurrency(selectedCustomer.totalDueAmount)}
                    </p>
                </div>
                <div className="text-right">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${selectedCustomer.totalDueAmount > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                        {selectedCustomer.totalDueAmount > 0 ? 'Pending Collection' : 'Advance Credit'}
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
                    disabled={!selectedCustomerId}
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
            disabled={!selectedCustomerId || paymentAmount === '' || Number(paymentAmount) <= 0}
            className="w-full sm:w-auto px-16 py-5 bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-[24px] shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
            {t('accounting.receiveCustomerPayment')}
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

export default ReceivePaymentModal;
