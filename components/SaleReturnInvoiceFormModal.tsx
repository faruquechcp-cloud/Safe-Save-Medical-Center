
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MedicationItem, Customer, HeldInvoice, 
  SaleReturnInvoice, SaleReturnItem, SaleReturnInvoiceFormState, SaleReturnItemFormData,
  SaleInvoice
} from '../types';
import Modal from './Modal';
import TrashIcon from './icons/TrashIcon';
import PauseCircleIcon from './icons/PauseCircleIcon';
import { useTranslations } from '../hooks/useTranslations';
import { formatCurrency } from '../utils/formatUtils';

interface SaleReturnInvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: SaleReturnInvoice) => void;
  medications: MedicationItem[]; 
  customers: Customer[];
  saleInvoices: SaleInvoice[];
  getNextInvoiceNumber: () => Promise<string>;
  onHold?: (heldInvoiceData: SaleReturnInvoiceFormState) => void;
  resumeData?: HeldInvoice | null; 
  editData?: SaleReturnInvoice | null;
  // Added missing zIndex property to support layered modals
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const SaleReturnInvoiceFormModal: React.FC<SaleReturnInvoiceFormModalProps> = ({ 
  isOpen, onClose, onSubmit, medications, customers, saleInvoices, getNextInvoiceNumber, onHold, resumeData, editData, zIndex, onMinimize, isMinimized 
}) => {
  const { t } = useTranslations();
  const initialFormState: SaleReturnInvoiceFormState = {
    returnInvoiceNumber: '',
    originalSaleInvoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    selectedCustomerId: '',
    notes: '',
    items: [],
    restockingFee: '',
    refundIssued: '',
  };

  const [formState, setFormState] = useState<SaleReturnInvoiceFormState>(initialFormState);
  const [calculatedSubTotal, setCalculatedSubTotal] = useState<number>(0);
  const [totalRefundAmount, setTotalRefundAmount] = useState<number>(0);

  const filteredInvoices = useMemo(() => {
    if (!formState.selectedCustomerId) return [];
    return saleInvoices.filter(inv => inv.customerId === formState.selectedCustomerId);
  }, [formState.selectedCustomerId, saleInvoices]);

  const calculateSubTotal = useCallback(() => {
    return formState.items.reduce((sum, item) => {
        const amt = Number(item.totalAmount);
        return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [formState.items]);

  useEffect(() => {
    const initializeForm = async () => {
      if (editData) {
        setFormState({
          returnInvoiceNumber: editData.returnInvoiceNumber,
          originalSaleInvoiceNumber: editData.originalSaleInvoiceNumber || '',
          date: editData.date.split('T')[0],
          selectedCustomerId: editData.customerId || '',
          notes: editData.notes || '',
          items: editData.items.map(item => ({
            ...item,
            quantityReturned: item.quantityReturned,
            unitPriceAtReturn: item.unitPriceAtReturn,
            totalAmount: item.totalAmount,
          })) as SaleReturnItemFormData[],
          restockingFee: editData.restockingFee?.toString() || '',
          refundIssued: editData.refundIssued.toString(),
        });
      } else if (resumeData && resumeData.type === 'saleReturn') {
        const resumedFormData = resumeData.formData as SaleReturnInvoiceFormState;
        setFormState({
          ...resumedFormData,
          items: resumedFormData.items.map(item => ({
            ...item,
            quantityReturned: item.quantityReturned === '' ? '' : Number(item.quantityReturned),
            unitPriceAtReturn: item.unitPriceAtReturn === '' ? '' : Number(item.unitPriceAtReturn),
            totalAmount: item.totalAmount === '' ? '' : Number(item.totalAmount),
          })) as SaleReturnItemFormData[],
        });
      } else {
        const nextNo = await getNextInvoiceNumber();
        setFormState({ ...initialFormState, returnInvoiceNumber: nextNo });
      }
    };

    if (isOpen) initializeForm();
  }, [isOpen, resumeData, editData, getNextInvoiceNumber]);
  
  useEffect(() => {
    const sub = calculateSubTotal();
    setCalculatedSubTotal(sub);
    const fee = parseFloat(formState.restockingFee) || 0;
    setTotalRefundAmount(Math.max(0, sub - fee));
  }, [formState.items, formState.restockingFee, calculateSubTotal]);

  const handleInvoiceChange = (invoiceNumber: string) => {
    const originalInvoice = saleInvoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (originalInvoice) {
      const itemsToReturn: SaleReturnItemFormData[] = originalInvoice.items.map(item => ({
        medicationId: item.medicationId,
        medicationName: item.medicationName,
        batchNumber: item.batchNumber,
        quantityReturned: 0,
        unitPriceAtReturn: item.unitPrice,
        totalAmount: 0,
        reason: '',
        soldQty: item.quantity 
      })) as any[];

      setFormState(prev => ({
        ...prev,
        originalSaleInvoiceNumber: invoiceNumber,
        items: itemsToReturn
      }));
    } else {
      setFormState(prev => ({
        ...prev,
        originalSaleInvoiceNumber: invoiceNumber,
        items: []
      }));
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormState(prev => ({...prev, items: prev.items.filter((_, i) => i !== index)}));
  };

  const handleItemChange = (index: number, field: keyof SaleReturnItemFormData, value: string | number) => {
    const newItems = [...formState.items];
    const item = { ...newItems[index] };
    (item as any)[field] = value;

    if (field === 'quantityReturned' && (item as any).soldQty !== undefined) {
      const val = Number(value);
      if (val > (item as any).soldQty) {
        item.quantityReturned = (item as any).soldQty;
      }
    }

    if (field === 'medicationId') {
      const med = medications.find(m => m.id === String(value));
      if (med) {
        item.medicationName = med.name;
        item.unitPriceAtReturn = med.sellingPrice;
      }
    }
    
    if (field === 'quantityReturned' || field === 'unitPriceAtReturn' || field === 'medicationId' || field === 'batchNumber') {
        const qty = Number(item.quantityReturned);
        const price = Number(item.unitPriceAtReturn);
        item.totalAmount = (!isNaN(qty) && !isNaN(price)) ? (qty * price) : '';
    }
    
    newItems[index] = item; 
    setFormState(prev => ({...prev, items: newItems}));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToSubmit = formState.items.filter(i => Number(i.quantityReturned) > 0);
    if (itemsToSubmit.length === 0) return;

    const finalItems: SaleReturnItem[] = itemsToSubmit.map(item => ({
      ...item,
      quantityReturned: Number(item.quantityReturned),
      unitPriceAtReturn: Number(item.unitPriceAtReturn),
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

    const newInvoice: SaleReturnInvoice = {
      id: editData?.id || (resumeData?.type === 'saleReturn' ? resumeData.id : crypto.randomUUID()),
      returnInvoiceNumber: formState.returnInvoiceNumber,
      originalSaleInvoiceNumber: formState.originalSaleInvoiceNumber || undefined,
      date: finalDate,
      items: finalItems,
      subTotalAmount: calculatedSubTotal,
      restockingFee: parseFloat(formState.restockingFee) || undefined,
      totalRefundAmount: totalRefundAmount,
      customerId: formState.selectedCustomerId || undefined,
      customerName: customers.find(c => c.id === formState.selectedCustomerId)?.name || undefined,
      refundIssued: Number(formState.refundIssued) || 0,
      notes: formState.notes.trim() || undefined,
    };
    onSubmit(newInvoice);
    onClose();
  };

  const title = editData ? t('saleReturnInvoiceForm.editTitle') : t('saleReturnInvoiceForm.createTitle');

  return (
    // Fixed: Added zIndex prop to Modal component
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="5xl" zIndex={zIndex} onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar">
          
          <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shadow-sm">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('saleReturnInvoiceForm.returnInvoiceNumberLabel')}</label>
              <input type="text" value={formState.returnInvoiceNumber} readOnly className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm font-bold outline-none shadow-sm"/>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('saleInvoiceForm.customerLabel')} <span className="text-red-500">*</span></label>
              <select 
                value={formState.selectedCustomerId} 
                onChange={e => setFormState({...formState, selectedCustomerId: e.target.value, originalSaleInvoiceNumber: '', items: []})} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm transition-all"
                required
              >
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('saleReturnInvoiceForm.originalSaleInvoiceLabel')}</label>
              <select 
                value={formState.originalSaleInvoiceNumber} 
                onChange={e => handleInvoiceChange(e.target.value)} 
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm transition-all disabled:opacity-50"
                disabled={!formState.selectedCustomerId}
              >
                <option value="">{t('saleReturnInvoiceForm.selectInvoicePlaceholder')}</option>
                {filteredInvoices.map(inv => (
                  <option key={inv.id} value={inv.invoiceNumber}>{inv.invoiceNumber} ({formatCurrency(inv.totalAmount)})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('saleInvoiceForm.dateLabel')}</label>
              <input type="date" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm transition-all"/>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{t('saleInvoiceForm.itemsTitle')}</h3>
            
            {formState.items.length === 0 && (
              <div className="py-16 text-center bg-gray-50/30 border-2 border-dashed border-gray-200 rounded-[32px]">
                 <PauseCircleIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                 <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('saleReturnInvoiceForm.loadInstruction')}</p>
              </div>
            )}

            <div className="space-y-3">
              {formState.items.map((item, index) => (
                <div key={index} className={`grid grid-cols-12 gap-4 p-4 border rounded-2xl items-center transition-all ${Number(item.quantityReturned) > 0 ? 'bg-primary-50 border-primary-200 ring-2 ring-primary-500/10' : 'bg-white border-gray-50 shadow-sm'}`}>
                  <div className="col-span-12 lg:col-span-4"> 
                    <label className="block text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('saleReturnInvoiceForm.item.product')}</label>
                    <div className="text-xs font-black uppercase text-gray-800 truncate">{item.medicationName}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase">Batch: {item.batchNumber}</div>
                  </div>

                  <div className="col-span-4 lg:col-span-2"> 
                    <label className="block text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('saleInvoiceForm.item.unitPrice')}</label>
                    <div className="text-xs font-bold text-gray-700">{formatCurrency(item.unitPriceAtReturn)}</div>
                  </div>

                  <div className="col-span-4 lg:col-span-1"> 
                    <label className="block text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('saleReturnInvoiceForm.item.soldQty')}</label>
                    <div className="text-xs font-bold text-gray-400">{(item as any).soldQty || '-'}</div>
                  </div>

                  <div className="col-span-4 lg:col-span-2"> 
                    <label className="block text-[8px] font-black uppercase text-primary-600 tracking-widest mb-1">{t('saleReturnInvoiceForm.item.returnQty')}</label>
                    <input 
                      type="number" 
                      value={item.quantityReturned} 
                      onChange={e => handleItemChange(index, 'quantityReturned', e.target.value)} 
                      className="w-full px-3 py-2 border border-primary-200 rounded-lg text-xs font-black focus:ring-4 focus:ring-primary-500/20 outline-none"
                      min="0"
                    />
                  </div>

                  <div className="col-span-10 lg:col-span-2 text-right"> 
                    <label className="block text-[8px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('saleInvoiceForm.item.total')}</label>
                    <div className="text-xs font-black text-primary-700">
                      {item.totalAmount ? formatCurrency(item.totalAmount) : 'Tk. 0.00'}
                    </div>
                  </div>

                  {!formState.originalSaleInvoiceNumber && (
                    <div className="col-span-2 lg:col-span-1 flex justify-end">
                      <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-all"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
            <div className="space-y-6">
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('saleReturnInvoiceForm.summary.restockingFee')}</label>
                    <input 
                      type="number" 
                      value={formState.restockingFee} 
                      onChange={e => setFormState({...formState, restockingFee: e.target.value})} 
                      placeholder="0.00"
                      className="w-full px-5 py-3 border border-gray-200 rounded-xl text-sm font-black focus:ring-4 focus:ring-red-500/10 outline-none"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-[10px] font-black uppercase text-green-600 tracking-widest">{t('saleReturnInvoiceForm.summary.refundIssued')}</label>
                    <input 
                      type="number" 
                      value={formState.refundIssued} 
                      onChange={e => setFormState({...formState, refundIssued: e.target.value})} 
                      placeholder="0.00"
                      className="w-full px-5 py-3 border border-green-200 bg-green-50/30 rounded-xl text-sm font-black text-green-700 focus:ring-4 focus:ring-green-500/10 outline-none"
                    />
                </div>
            </div>

            <div className="bg-gray-900 p-8 rounded-[40px] text-white flex flex-col justify-between shadow-xl min-h-[180px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <span className="shrink-0">{t('saleReturnInvoiceForm.summary.itemValue')}</span>
                      <span className="text-right text-white font-black">{formatCurrency(calculatedSubTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black text-red-400 uppercase tracking-widest">
                      <span className="shrink-0">{t('saleReturnInvoiceForm.summary.deductions')}</span>
                      <span className="text-right font-black">- {formatCurrency(formState.restockingFee || 0)}</span>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/10 flex flex-col items-end">
                    <span className="text-[11px] font-black uppercase tracking-widest text-primary-400 mb-1">{t('saleReturnInvoiceForm.summary.totalRefund')}</span>
                    <span className="text-4xl sm:text-5xl font-black tracking-tighter text-right">{formatCurrency(totalRefundAmount)}</span>
                </div>
            </div>
          </div>
        </div>
        
        <div className="shrink-0 p-6 border-t border-gray-100 flex flex-wrap gap-4 justify-end bg-white">
          <button type="button" onClick={onClose} className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 rounded-2xl transition-all">
            {t('common.cancel')}
          </button>
          {!editData && onHold && (
             <button type="button" onClick={() => onHold(formState)} className="px-8 py-3.5 text-[10px] font-black text-amber-600 bg-amber-50 uppercase tracking-widest rounded-2xl hover:bg-amber-100 flex items-center justify-center transition-all active:scale-95 shadow-sm">
                <PauseCircleIcon className="w-5 h-5 mr-2"/> {t('saleInvoiceForm.holdButton')}
            </button>
          )}
          <button 
            type="submit" 
            className="flex-1 sm:flex-none px-12 py-3.5 text-[10px] font-black text-white bg-primary-600 uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all"
          >
            {editData ? t('common.save') : t('saleReturnInvoiceForm.submitButtonCreate')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SaleReturnInvoiceFormModal;
