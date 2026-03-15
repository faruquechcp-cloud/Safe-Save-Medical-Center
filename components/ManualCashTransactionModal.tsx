import React, { useState, useEffect, useMemo } from 'react';
import { CashTransaction, CashTransactionType, CustomTransactionCategorySetting } from '../types';
import Modal from './Modal';
import { useTranslations } from '../hooks/useTranslations';

interface ManualCashTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<CashTransaction, 'id' | 'timestamp' | 'relatedInvoiceId' | 'relatedCustomerId' | 'relatedSupplierId'>) => void;
  title: string;
  customCategories: CustomTransactionCategorySetting[]; 
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const MANUAL_SYSTEM_INCOME_CATEGORIES: string[] = ['Initial Balance', 'Other Income'];
const MANUAL_SYSTEM_EXPENSE_CATEGORIES: string[] = ['Other Expense'];

interface ManualTransactionFormState {
  date: string;
  type: CashTransactionType;
  category: string; 
  description: string;
  amount: string; 
}

const ManualCashTransactionModal: React.FC<ManualCashTransactionModalProps> = ({ 
    isOpen, onClose, onSubmit, customCategories, onMinimize, isMinimized 
}) => {
  const { t } = useTranslations();
  
  const getDefaultCategory = (type: CashTransactionType): string => {
    const relevantCustomCategories = customCategories.filter(cat => cat.type === type);
    if (type === 'income') {
      return relevantCustomCategories.length > 0 ? relevantCustomCategories[0].name : MANUAL_SYSTEM_INCOME_CATEGORIES[0];
    } else {
      return relevantCustomCategories.length > 0 ? relevantCustomCategories[0].name : MANUAL_SYSTEM_EXPENSE_CATEGORIES[0];
    }
  };
  
  const initialFormData: ManualTransactionFormState = {
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as CashTransactionType,
    category: getDefaultCategory('expense'),
    description: '',
    amount: '',
  };

  const [formData, setFormData] = useState<ManualTransactionFormState>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ManualTransactionFormState, string>>>({});

  useEffect(() => {
    if (isOpen) {
      const defaultType: CashTransactionType = 'expense';
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: defaultType,
        category: getDefaultCategory(defaultType),
        description: '',
        amount: '',
      });
      setErrors({});
    }
  }, [isOpen, customCategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
        const newState = { ...prev, [name]: value } as ManualTransactionFormState;
        if (name === 'type') {
            const newType = value as CashTransactionType;
            newState.category = getDefaultCategory(newType);
        }
        return newState;
    });

    if (errors[name as keyof ManualTransactionFormState]) {
      setErrors(prev => ({ ...prev, [name as keyof ManualTransactionFormState]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ManualTransactionFormState, string>> = {};
    if (!formData.date) newErrors.date = "Required";
    if (!formData.description.trim()) newErrors.description = "Required";
    
    const amountNum = Number(formData.amount);
    if (formData.amount === '' || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = "Invalid amount";
    }
    if (!formData.category) newErrors.category = "Required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const now = new Date();
    const selectedDate = new Date(formData.date);
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

    onSubmit({
      date: selectedDate.toISOString(),
      type: formData.type,
      category: formData.category, 
      description: formData.description,
      amount: Number(formData.amount),
    });
    onClose();
  };
  
  const availableCategories = useMemo(() => {
    const systemCats = formData.type === 'income' ? MANUAL_SYSTEM_INCOME_CATEGORIES : MANUAL_SYSTEM_EXPENSE_CATEGORIES;
    const customFiltered = customCategories.filter(cat => cat.type === formData.type).map(cat => cat.name);
    return [...systemCats, ...customFiltered].filter((value, index, self) => self.indexOf(value) === index).sort();
  }, [formData.type, customCategories]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('accounting.manualEntryTitle')} size="lg" onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('saleInvoiceForm.dateLabel')} *</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange}
                        className="w-full px-6 py-4 border border-gray-100 bg-gray-50/50 rounded-3xl text-sm font-bold shadow-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>
                <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('accounting.typeLabel')} *</label>
                    <select name="type" value={formData.type} onChange={handleChange}
                        className="w-full px-6 py-4 border border-gray-100 bg-gray-50/50 rounded-3xl text-sm font-bold shadow-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all">
                        <option value="income">{t('accounting.income')}</option>
                        <option value="expense">{t('accounting.expense')}</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('accounting.categoryLabel')} *</label>
                    <select name="category" value={formData.category} onChange={handleChange}
                        className="w-full px-6 py-4 border border-gray-100 bg-gray-50/50 rounded-3xl text-sm font-bold shadow-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all">
                        {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
                <div className="space-y-2">
                    <label className="block text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('accounting.amountLabel')} *</label>
                    <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" min="0.01" placeholder="0.00"
                        className="w-full px-6 py-4 border border-gray-100 bg-gray-50/50 rounded-3xl text-sm font-bold shadow-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all" />
                    {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-[11px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('productForm.notesLabel')} *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder={t('accounting.notesPlaceholder')}
                    className="w-full px-6 py-4 border border-gray-100 bg-gray-50/50 rounded-3xl text-sm font-bold shadow-sm outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all" />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>
        </div>

        <div className="shrink-0 px-8 py-8 border-t border-gray-50 flex flex-col sm:flex-row-reverse gap-5 bg-white">
          <button type="submit" className="w-full sm:w-auto px-16 py-6 bg-primary-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-[28px] shadow-2xl hover:brightness-110 active:scale-95 transition-all">
            {t('common.add')}
          </button>
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-10 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-[28px] transition-all">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ManualCashTransactionModal;