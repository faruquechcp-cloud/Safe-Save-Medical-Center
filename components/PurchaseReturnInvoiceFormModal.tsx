
import React, { useState, useEffect, useCallback } from 'react';
import { 
  MedicationItem, Supplier, HeldInvoice,
  PurchaseReturnInvoice, PurchaseReturnItem, PurchaseReturnInvoiceFormState, PurchaseReturnItemFormData,
  PurchaseInvoice
} from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import { useTranslations } from '../hooks/useTranslations';
import MedicationSelector from './MedicationSelector';
import { formatCurrency } from '../utils/formatUtils';

interface PurchaseReturnInvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: PurchaseReturnInvoice) => void;
  medications: MedicationItem[]; 
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[]; 
  getNextInvoiceNumber: () => Promise<string>;
  onHold?: (heldInvoiceData: PurchaseReturnInvoiceFormState) => void;
  resumeData?: HeldInvoice | null; 
  editData?: PurchaseReturnInvoice | null;
  // Added missing zIndex property to support layered modals
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const PurchaseReturnInvoiceFormModal: React.FC<PurchaseReturnInvoiceFormModalProps> = ({ 
  isOpen, onClose, onSubmit, medications, suppliers, getNextInvoiceNumber, resumeData, editData, zIndex, onMinimize, isMinimized 
}) => {
  const { t } = useTranslations();
  const initialFormState: PurchaseReturnInvoiceFormState = {
    returnInvoiceNumber: '',
    originalPurchaseInvoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    selectedSupplierId: '',
    notes: '',
    items: [],
    shippingFee: '',
    refundReceived: '',
  };

  const [formState, setFormState] = useState<PurchaseReturnInvoiceFormState>(initialFormState);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [calculatedSubTotal, setCalculatedSubTotal] = useState<number>(0);
  const [totalCreditAmount, setTotalCreditAmount] = useState<number>(0);

  const calculateSubTotal = useCallback(() => {
    return formState.items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  }, [formState.items]);

  useEffect(() => {
    const initializeForm = async () => {
      if (isInitialized) return;

      if (editData) {
        setFormState({
          returnInvoiceNumber: editData.returnInvoiceNumber,
          originalPurchaseInvoiceNumber: editData.originalPurchaseInvoiceNumber || '',
          date: editData.date.split('T')[0],
          selectedSupplierId: editData.supplierId || '',
          notes: editData.notes || '',
          items: editData.items.map(item => ({
            ...item,
            quantityReturned: item.quantityReturned,
            unitCostAtReturn: item.unitCostAtReturn,
            totalAmount: item.totalAmount,
          })) as PurchaseReturnItemFormData[],
          shippingFee: editData.shippingFee?.toString() || '',
          refundReceived: editData.refundReceived.toString(),
        });
      } else if (resumeData && resumeData.type === 'purchaseReturn') {
        const resumedFormData = resumeData.formData as PurchaseReturnInvoiceFormState;
        setFormState({
          ...resumedFormData,
          items: resumedFormData.items.map(item => ({
            ...item,
            quantityReturned: item.quantityReturned === '' ? '' : Number(item.quantityReturned),
            unitCostAtReturn: item.unitCostAtReturn === '' ? '' : Number(item.unitCostAtReturn),
            totalAmount: item.totalAmount === '' ? '' : Number(item.totalAmount),
          })) as PurchaseReturnItemFormData[],
        });
      } else {
        setFormState({
          ...initialFormState,
          returnInvoiceNumber: await getNextInvoiceNumber(),
        });
      }
      setIsInitialized(true);
    };

    if (isOpen) {
      initializeForm();
    }
  }, [isOpen, resumeData, editData, getNextInvoiceNumber, isInitialized]); 

  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setCalculatedSubTotal(calculateSubTotal());
  }, [formState.items, calculateSubTotal]);

  useEffect(() => {
    const subTotal = calculatedSubTotal;
    const shippingFeeNum = parseFloat(formState.shippingFee) || 0;
    const calcTotalCredit = Math.max(0, subTotal - shippingFeeNum); 
    setTotalCreditAmount(calcTotalCredit);
  }, [calculatedSubTotal, formState.shippingFee]);

  const handleAddItem = () => {
    const newItem: PurchaseReturnItemFormData = { medicationId: '', medicationName: '', batchNumber: '', quantityReturned: 1, unitCostAtReturn: 0, totalAmount: 0, reason: '' };
    setFormState(prev => ({...prev, items: [...prev.items, newItem]}));
  };

  const handleRemoveItem = (index: number) => {
    setFormState(prev => ({...prev, items: prev.items.filter((_, i) => i !== index)}));
  };
  
  const handleItemChange = (index: number, field: keyof PurchaseReturnItemFormData, value: string | number) => {
    const newItems = [...formState.items];
    const itemToUpdate = { ...newItems[index] } as unknown as PurchaseReturnItemFormData; 
    itemToUpdate[field] = value as any; 

    if (field === 'medicationId') {
      const selectedMed = medications.find(m => m.id === String(value));
      if (selectedMed) {
        itemToUpdate.medicationName = selectedMed.name;
        itemToUpdate.unitCostAtReturn = selectedMed.batches[0]?.costPrice || 0;
      }
    }
    
    const qty = Number(itemToUpdate.quantityReturned);
    const cost = Number(itemToUpdate.unitCostAtReturn);
    itemToUpdate.totalAmount = (qty * cost);
    
    newItems[index] = itemToUpdate; 
    setFormState(prev => ({...prev, items: newItems}));
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalItems: PurchaseReturnItem[] = formState.items.map(item => ({
      ...item,
      quantityReturned: Number(item.quantityReturned),
      unitCostAtReturn: Number(item.unitCostAtReturn),
      totalAmount: Number(item.totalAmount),
    }));

    // Merge selected date with current time for new invoices
    let finalDate = formState.date;
    if (!editData) {
      const now = new Date();
      const selectedDate = new Date(formState.date);
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      finalDate = selectedDate.toISOString();
    }

    const newInvoice: PurchaseReturnInvoice = {
      id: editData?.id || crypto.randomUUID(),
      returnInvoiceNumber: formState.returnInvoiceNumber,
      date: finalDate,
      items: finalItems,
      subTotalAmount: calculatedSubTotal,
      totalCreditAmount: totalCreditAmount,
      supplierId: formState.selectedSupplierId || undefined,
      supplierName: suppliers.find(c => c.id === formState.selectedSupplierId)?.name || undefined,
      refundReceived: Number(formState.refundReceived) || 0,
      notes: formState.notes.trim() || undefined,
    };
    onSubmit(newInvoice);
    onClose();
  };

  return (
    // Fixed: Added zIndex prop to Modal component
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? "ক্রয় ফেরত পরিবর্তন" : t('purchaseReturnInvoiceForm.createTitle', "Create Purchase Return")} size="4xl" zIndex={zIndex} onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('purchaseReturnInvoiceForm.returnInvoiceNumberLabel', 'Return Invoice #')}</label>
              <input type="text" value={formState.returnInvoiceNumber} readOnly className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 sm:text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('saleInvoiceForm.dateLabel', 'Date')}</label>
              <input type="date" name="date" value={formState.date} onChange={handleFormInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('purchaseInvoiceForm.supplierLabel', 'Supplier')}</label>
              <select name="selectedSupplierId" value={formState.selectedSupplierId} onChange={handleFormInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md sm:text-sm">
                <option value="">{t('purchaseInvoiceForm.selectSupplierPlaceholder', 'Select Supplier')}</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{t('saleInvoiceForm.itemsTitle', 'Items')}</h3>
            <div className="space-y-3">
              {formState.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/50 items-start">
                <div className="col-span-12 sm:col-span-6"> 
                  <MedicationSelector
                      medications={medications}
                      selectedId={item.medicationId}
                      onSelect={(id) => handleItemChange(index, 'medicationId', id)}
                      placeholder={t('purchaseReturnInvoiceForm.item.selectProduct', 'Select Product')}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2"> 
                  <input type="number" value={item.quantityReturned} onChange={e => handleItemChange(index, 'quantityReturned', e.target.value)} className="block w-full px-3 py-2 border border-gray-200 rounded-lg sm:text-xs" placeholder="Qty"/>
                </div>
                <div className="col-span-4 sm:col-span-2"> 
                  <input type="number" value={item.unitCostAtReturn} onChange={e => handleItemChange(index, 'unitCostAtReturn', e.target.value)} className="block w-full px-3 py-2 border border-gray-200 rounded-lg sm:text-xs" placeholder="Price"/>
                </div>
                <div className="col-span-4 sm:col-span-2 flex justify-end"> 
                  <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
                <button type="button" onClick={handleAddItem} className="px-8 py-2.5 border-2 border-dashed border-gray-200 text-gray-400 hover:text-[var(--color-primary-600)] hover:border-[var(--color-primary-300)] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center">
                    <PlusIcon className="w-4 h-4 mr-2" /> {t('saleInvoiceForm.addItemButton', 'Add Item')}
                </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
            <div className="space-y-6">
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">শিপিং ফি</label>
                    <input 
                      type="number" 
                      name="shippingFee"
                      value={formState.shippingFee} 
                      onChange={handleFormInputChange} 
                      placeholder="0.00"
                      className="w-full px-5 py-3 border border-gray-200 rounded-xl text-sm font-black focus:ring-4 focus:ring-red-500/10 outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-green-600 tracking-widest">প্রাপ্ত রিফান্ড</label>
                    <input 
                      type="number" 
                      name="refundReceived"
                      value={formState.refundReceived} 
                      onChange={handleFormInputChange} 
                      placeholder="0.00"
                      className="w-full px-5 py-3 border border-green-200 bg-green-50/30 rounded-xl text-sm font-black text-green-700 focus:ring-4 focus:ring-green-500/10 outline-none"
                    />
                </div>
            </div>

            <div className="bg-gray-900 p-8 rounded-[40px] text-white flex flex-col justify-between shadow-xl min-h-[180px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span className="shrink-0">আইটেম ভ্যালু</span>
                      <span className="text-right text-white font-black">{formatCurrency(calculatedSubTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-red-400 uppercase tracking-widest">
                      <span className="shrink-0">শিপিং ফি</span>
                      <span className="text-right font-black">- {formatCurrency(formState.shippingFee || 0)}</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/10 flex flex-col items-end">
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary-400 mb-1">সর্বমোট ক্রেডিট</span>
                    <span className="text-4xl sm:text-5xl font-black tracking-tighter text-right">{formatCurrency(totalCreditAmount)}</span>
                </div>
            </div>
          </div>
        </div>
        
        <div className="sticky bottom-0 left-0 right-0 flex flex-wrap justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-white/95 backdrop-blur z-30 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
          <button type="button" onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:bg-gray-50 rounded-2xl transition-all active:scale-95 border border-gray-100">
            {t('saleInvoiceForm.cancelButton', 'Cancel')}
          </button>
          <button type="submit" className="flex-1 sm:flex-none px-12 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-2xl shadow-xl transition-all active:scale-95">
            {t('purchaseReturnInvoiceForm.submitButtonCreate', 'Finalize Return')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseReturnInvoiceFormModal;
