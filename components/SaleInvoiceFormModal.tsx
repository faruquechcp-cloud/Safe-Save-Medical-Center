
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MedicationItem, Customer, SaleInvoice, SaleInvoiceFormState, SaleItemFormData, HeldInvoice, SaleItem } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PauseCircleIcon from './icons/PauseCircleIcon';
import { useTranslations } from '../hooks/useTranslations';
import MedicationSelector from './MedicationSelector';
import SearchableSelect from './SearchableSelect';
import { formatCurrency, getTotalQuantityForMedication } from '../utils/formatUtils';

interface SaleInvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: SaleInvoice) => void;
  medications: MedicationItem[];
  customers: Customer[];
  getNextInvoiceNumber: () => Promise<string>;
  onHold?: (heldInvoiceData: SaleInvoiceFormState) => void;
  onCreateCustomer?: () => void;
  resumeData?: HeldInvoice | null;
  editData?: SaleInvoice | null;
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
  lastCreatedCustomerId?: string | null;
  lastCreatedMedicationId?: string | null;
}

const SaleInvoiceFormModal: React.FC<SaleInvoiceFormModalProps> = ({ 
  isOpen, onClose, onSubmit, medications, customers, getNextInvoiceNumber, onHold, onCreateCustomer, resumeData, editData, zIndex, onMinimize, isMinimized,
  lastCreatedCustomerId, lastCreatedMedicationId
}) => {
  const { t } = useTranslations();
  
  // Refs to manage quantity and price input focusing
  const qtyRefs = useRef<(HTMLInputElement | null)[]>([]);
  const priceRefs = useRef<(HTMLInputElement | null)[]>([]);
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);
  const customerSelectRef = useRef<HTMLInputElement>(null);

  const initialFormState: SaleInvoiceFormState = {
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    selectedCustomerId: '',
    notes: '',
    items: [],
    discountPercentage: '',
    discountAmount: '',
    amountPaid: '',
  };

  const [formState, setFormState] = useState<SaleInvoiceFormState>(initialFormState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && lastCreatedCustomerId) {
      setFormState(prev => ({ ...prev, selectedCustomerId: lastCreatedCustomerId }));
    }
  }, [isOpen, lastCreatedCustomerId]);

  useEffect(() => {
    if (isOpen && lastCreatedMedicationId) {
      const lastItemIdx = formState.items.length - 1;
      if (lastItemIdx >= 0 && !formState.items[lastItemIdx].medicationId) {
        handleItemChange(lastItemIdx, 'medicationId', lastCreatedMedicationId);
      } else {
        const selectedMed = medications.find(m => m.id === lastCreatedMedicationId);
        const availableBatches = (selectedMed?.batches || [])
          .filter(b => b.quantityInStock > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        
        const newItem: SaleItemFormData = { 
          medicationId: lastCreatedMedicationId, 
          medicationName: selectedMed?.name || '', 
          batchNumber: availableBatches.length > 0 ? availableBatches[0].batchNumber : 'FIFO-AUTO',
          quantity: 1, 
          unitPrice: selectedMed?.sellingPrice || 0, 
          discount: 0, 
          totalPrice: selectedMed?.sellingPrice || 0 
        };
        setFormState(prev => ({ ...prev, items: [...prev.items, newItem] }));
        
        setTimeout(() => {
          const newIdx = formState.items.length;
          if (qtyRefs.current[newIdx]) {
            qtyRefs.current[newIdx]?.focus();
            qtyRefs.current[newIdx]?.select();
          }
        }, 100);
      }
    }
  }, [isOpen, lastCreatedMedicationId]);

  useEffect(() => {
    const initializeForm = async () => {
      if (editData) {
        setFormState({
          invoiceNumber: editData.invoiceNumber,
          date: editData.date.split('T')[0],
          selectedCustomerId: editData.customerId || '',
          notes: editData.notes || '',
          items: editData.items.map(item => ({
            ...item,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            totalPrice: item.totalPrice,
          })) as SaleItemFormData[],
          discountPercentage: editData.discountPercentage?.toString() || '',
          discountAmount: editData.discountAmount?.toString() || '',
          amountPaid: editData.amountPaid.toString(),
        });
      } else if (resumeData && resumeData.type === 'sale') {
        const resumedFormData = resumeData.formData as SaleInvoiceFormState;
        setFormState(resumedFormData);
      } else {
        const nextNo = await getNextInvoiceNumber();
        const cashSaleCustomer = customers.find(c => 
          c.name.toLowerCase().includes('cash sale') || 
          c.name.toLowerCase().includes('cash sell') ||
          c.name.includes('নগদ')
        );
        setFormState({ 
          ...initialFormState, 
          invoiceNumber: nextNo,
          selectedCustomerId: cashSaleCustomer?.id || ''
        });
      }
      setIsInitialized(true);
      
      // Focus customer selector on open
      setTimeout(() => {
        customerSelectRef.current?.focus();
      }, 300);
    };

    if (isOpen && !isInitialized && customers.length > 0) {
      initializeForm();
    }
  }, [isOpen, isInitialized, resumeData, editData, getNextInvoiceNumber, customers]);

  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  const subTotalAmount = useMemo(() => {
    return formState.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [formState.items]);

  const totalAmount = useMemo(() => {
    const discAmt = parseFloat(formState.discountAmount) || 0;
    return Math.max(0, subTotalAmount - discAmt);
  }, [subTotalAmount, formState.discountAmount]);

  const amountDue = useMemo(() => {
    const paid = Number(formState.amountPaid) || 0;
    return totalAmount - paid;
  }, [totalAmount, formState.amountPaid]);

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === formState.selectedCustomerId),
    [customers, formState.selectedCustomerId]
  );
  
  const getAvailableStock = (medId: string, batchNo: string) => {
    const med = medications.find(m => m.id === medId);
    if (!med) return 0;
    
    let stock = 0;
    if (batchNo === 'FIFO-AUTO') {
      stock = getTotalQuantityForMedication(med);
    } else {
      const batch = med.batches.find(b => b.batchNumber === batchNo);
      stock = batch?.quantityInStock || 0;
    }
    
    // If editing, add back the quantity from the original invoice for this specific medication/batch
    if (editData) {
      const originalItem = editData.items.find(oi => oi.medicationId === medId);
      if (originalItem) {
        if (batchNo === 'FIFO-AUTO') {
          stock += originalItem.quantity;
        } else {
          const originalDeduction = originalItem.batchDeductions?.find(d => d.batchNumber === batchNo);
          if (originalDeduction) {
            stock += originalDeduction.quantity;
          } else if (originalItem.batchNumber === batchNo) {
            // Fallback for older data or simple batch selection
            stock += originalItem.quantity;
          }
        }
      }
    }
    
    return stock;
  };

  const handleAddItem = () => {
    const newItem: SaleItemFormData = { 
      medicationId: '', 
      medicationName: '', 
      batchNumber: 'FIFO-AUTO', // Default to Auto
      quantity: 1, 
      unitPrice: 0, 
      discount: 0, 
      totalPrice: 0 
    };
    setFormState(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    setFormState(prev => ({...prev, items: prev.items.filter((_, i) => i !== index)}));
  };

  const handleItemChange = (index: number, field: keyof SaleItemFormData, value: string | number) => {
    const newItems = [...formState.items];
    const item = { ...newItems[index] };
    (item as any)[field] = value;

    if (field === 'medicationId') {
      const selectedMed = medications.find(m => m.id === String(value));
      if (selectedMed) {
        item.medicationName = selectedMed.name;
        item.unitPrice = selectedMed.sellingPrice;
        
        // Auto-select the batch expiring soonest (FEFO)
        const availableBatches = (selectedMed.batches || [])
          .filter(b => b.quantityInStock > 0)
          .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
        
        if (availableBatches.length > 0) {
          item.batchNumber = availableBatches[0].batchNumber;
        } else {
          item.batchNumber = 'FIFO-AUTO';
        }
        
        // FOCUS LOGIC: Automatically focus the quantity input after product selection
        setTimeout(() => {
          if (qtyRefs.current[index]) {
            qtyRefs.current[index]?.focus();
            qtyRefs.current[index]?.select();
          }
        }, 100);
      }
    }

    const q = Number(item.quantity) || 0;
    const p = Number(item.unitPrice) || 0;
    const d = Number(item.discount) || 0;
    item.totalPrice = (q * p) - d;

    newItems[index] = item;
    setFormState(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      processSubmit();
    }
  };

  const processSubmit = () => {
    const validItems = formState.items.filter(i => i.medicationId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
        setErrorMessage("দয়া করে অন্তত একটি পন্য যোগ করুন। / Please add at least one item.");
        return;
    }

    const subTotal = formState.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
    const discAmt = parseFloat(formState.discountAmount) || 0;
    const netTotal = Math.max(0, subTotal - discAmt);
    const paid = Number(formState.amountPaid) || 0;
    const due = netTotal - paid;

    const isCashSale = !selectedCustomer || 
                       selectedCustomer.name.toLowerCase().includes('cash sale') || 
                       selectedCustomer.name.toLowerCase().includes('cash sell') ||
                       selectedCustomer.name.toLowerCase().includes('cash') ||
                       selectedCustomer.name.includes('নগদ');

    if (due > 0.01 && isCashSale) {
        setErrorMessage("বাঁকি বিক্রয়ের ক্ষেত্রে অনুগ্রহ করে একজন গ্রাহক নির্বাচন করুন। / Please select a customer for due sales.");
        return;
    }

    const previousDue = selectedCustomer?.totalDueAmount || 0;
    const maxPayable = netTotal + previousDue;

    if (paid > maxPayable + 0.01 && selectedCustomer) {
        if (!confirm(`জমা নীট পরিশোধযোগ্য + পূর্বের বকেয়া (${formatCurrency(maxPayable)}) এর চেয়ে বেশি। আপনি কি অতিরিক্ত জমা গ্রহণ করতে চান? / Received amount is more than Net Payable + Previous Due (${formatCurrency(maxPayable)}). Do you want to accept extra payment?`)) {
            return;
        }
    } else if (paid > netTotal + 0.01 && !selectedCustomer) {
        setErrorMessage(`কাস্টমার নির্বাচন করা না থাকলে নীট পরিশোধযোগ্য (${formatCurrency(netTotal)}) এর বেশি জমা গ্রহণ করা যাবে না। / Cannot accept more than net payable (${formatCurrency(netTotal)}) without selecting a customer.`);
        return;
    }

    // Check stock validation
    for (const item of validItems) {
        const med = medications.find(m => m.id === item.medicationId);
        if (med) {
            const availableStock = getAvailableStock(item.medicationId, item.batchNumber);

            if (availableStock < Number(item.quantity)) {
                setErrorMessage(`${med.name} (${item.batchNumber === 'FIFO-AUTO' ? 'Total' : 'Batch: ' + item.batchNumber}) এর পর্যাপ্ত মজুদ নেই (মজুদ: ${availableStock})। / ${med.name} (${item.batchNumber === 'FIFO-AUTO' ? 'Total' : 'Batch: ' + item.batchNumber}) does not have enough stock (Available: ${availableStock}).`);
                return;
            }
        }
    }

    // Merge selected date with current time for new invoices
    let finalDate = formState.date;
    if (!editData) {
      const now = new Date();
      const selectedDate = new Date(formState.date);
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      finalDate = selectedDate.toISOString();
    } else {
      // If editing, preserve the original time if the date part hasn't changed
      const originalDatePart = editData.date.split('T')[0];
      if (formState.date === originalDatePart) {
        finalDate = editData.date;
      } else {
        // If date changed, try to keep the original time component
        try {
          const newDate = new Date(formState.date);
          if (editData.date.includes('T')) {
            const originalFullDate = new Date(editData.date);
            newDate.setHours(originalFullDate.getHours(), originalFullDate.getMinutes(), originalFullDate.getSeconds(), originalFullDate.getMilliseconds());
          } else {
            // Original didn't have time, just use the new date
          }
          finalDate = newDate.toISOString();
        } catch (e) {
          finalDate = formState.date;
        }
      }
    }

    const finalInvoice: SaleInvoice = {
      id: editData?.id || (resumeData?.type === 'sale' ? resumeData.id : crypto.randomUUID()),
      invoiceNumber: formState.invoiceNumber,
      date: finalDate,
      items: validItems.map(i => ({
        ...i,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        discount: Number(i.discount),
        totalPrice: Number(i.totalPrice),
        costPriceAtSale: 0 // Handled in App.tsx
      } as SaleItem)),
      subTotalAmount: subTotalAmount,
      discountAmount: Number(formState.discountAmount) || 0,
      totalAmount: totalAmount,
      amountPaid: Number(formState.amountPaid) || 0,
      amountDue: amountDue,
      customerId: formState.selectedCustomerId || undefined,
      customerName: selectedCustomer?.name,
      notes: formState.notes,
    };
    onSubmit(finalInvoice);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editData ? t('common.save') : t('saleInvoiceForm.createTitle')} 
      size="5xl" 
      zIndex={zIndex} 
      onMinimize={onMinimize} 
      isMinimized={isMinimized}
    >
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="flex flex-col h-full bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar">
          {errorMessage && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl font-bold flex items-center animate-pulse">
              <span className="mr-2">⚠️</span>
              {errorMessage}
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">{t('saleInvoiceForm.invoiceNumberLabel')}</label>
              <input type="text" value={formState.invoiceNumber} readOnly className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">{t('saleInvoiceForm.dateLabel')}</label>
              <input type="date" value={formState.date} onChange={e => setFormState({ ...formState, date: e.target.value })} className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">{t('saleInvoiceForm.customerLabel')}</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                    <SearchableSelect 
                        options={customers.map(c => ({ id: c.id, label: c.name, subLabel: c.phone }))}
                        selectedId={formState.selectedCustomerId}
                        onSelect={(id) => {
                          setFormState({ ...formState, selectedCustomerId: id });
                          // Auto add first item if empty
                          if (formState.items.length === 0 || (formState.items.length === 1 && !formState.items[0].medicationId)) {
                            if (formState.items.length === 0) {
                              handleAddItem();
                            }
                            setTimeout(() => {
                              itemRefs.current[0]?.focus();
                            }, 100);
                          }
                        }}
                        placeholder={t('saleInvoiceForm.selectCustomerPlaceholder')}
                        ref={customerSelectRef}
                    />
                </div>
                {onCreateCustomer && (
                    <button type="button" onClick={onCreateCustomer} className="p-3 bg-primary-50 text-primary-600 rounded-2xl hover:bg-primary-100 transition-colors shadow-sm h-[46px] flex items-center justify-center" title="Add Customer">
                        <PlusIcon className="w-6 h-6" />
                    </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <div className="hidden lg:grid grid-cols-[3.5fr_2.5fr_1fr_1.5fr_1fr_1.5fr_0.5fr] gap-3 px-4 py-3 bg-gray-900 border border-transparent rounded-t-[24px] text-xs font-black text-gray-400 uppercase tracking-widest">
                <div className="pl-3">{t('saleInvoiceForm.item.medication')}</div>
                <div className="pl-3">{t('saleInvoiceForm.item.batch')}</div>
                <div className="text-center">{t('saleInvoiceForm.item.qty')}</div>
                <div className="pl-3">{t('saleInvoiceForm.item.unitPrice')}</div>
                <div className="pl-3">ছাড়</div>
                <div className="text-right pr-4">{t('saleInvoiceForm.item.total')}</div>
                <div></div>
             </div>

             <div className="space-y-2">
                  {formState.items.map((item, idx) => {
                    const selectedMed = medications.find(m => m.id === item.medicationId);
                    const availableBatches = selectedMed?.batches.filter(b => b.quantityInStock > 0) || [];
                    const availableStock = getAvailableStock(item.medicationId, item.batchNumber);
                    const isStockInsufficient = item.medicationId && Number(item.quantity) > availableStock;

                    return (
                        <div key={idx} className={`grid grid-cols-1 lg:grid-cols-[3.5fr_2.5fr_1fr_1.5fr_1fr_1.5fr_0.5fr] gap-3 items-center p-4 border rounded-2xl bg-white shadow-sm transition-all ${isStockInsufficient ? 'border-red-500 bg-red-50/30' : 'border-gray-100 hover:border-primary-200'}`}>
                            <div className="space-y-1">
                                <MedicationSelector 
                                    medications={medications}
                                    selectedId={item.medicationId}
                                    onSelect={(id) => handleItemChange(idx, 'medicationId', id)}
                                    onlyWithStock={!editData}
                                    ref={el => { itemRefs.current[idx] = el; }}
                                />
                            </div>

                            <div>
                                <select 
                                    value={item.batchNumber} 
                                    onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                                    className={`w-full px-3 py-2.5 border rounded-xl text-xs font-bold outline-none transition-all ${isStockInsufficient ? 'border-red-300 bg-white' : 'border-gray-100 bg-gray-50 focus:bg-white'}`}
                                    disabled={!item.medicationId}
                                >
                                    <option value="FIFO-AUTO">Auto (FIFO)</option>
                                    {availableBatches.map(b => (
                                        <option key={b.batchNumber} value={b.batchNumber}>
                                            {b.batchNumber} (Stock: {b.quantityInStock} - Exp: {b.expiryDate})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="relative group">
                                <input 
                                  /* FIX: Use block body in ref callback to avoid implicit return type issues with React Ref expectations */
                                  ref={el => { qtyRefs.current[idx] = el; }}
                                  type="number" 
                                  value={item.quantity} 
                                  onChange={e => handleItemChange(idx, 'quantity', e.target.value)} 
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      priceRefs.current[idx]?.focus();
                                      priceRefs.current[idx]?.select();
                                    }
                                  }}
                                  className={`w-full p-2.5 border rounded-xl text-xs font-black text-center transition-all ${isStockInsufficient ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20' : 'border-gray-100 focus:ring-2 focus:ring-primary-500/20'}`} 
                                />
                                {isStockInsufficient && (
                                    <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-red-600 text-white text-[10px] font-bold rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-1">
                                        {item.medicationName} ({item.batchNumber === 'FIFO-AUTO' ? 'Total' : 'Batch: ' + item.batchNumber}) এর পর্যাপ্ত মজুদ নেই (মজুদ: {availableStock})।
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-red-600"></div>
                                    </div>
                                )}
                            </div>

                            <input 
                              ref={el => { priceRefs.current[idx] = el; }}
                              type="number" 
                              value={item.unitPrice} 
                              onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} 
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  // If it's the last item, add a new one
                                  if (idx === formState.items.length - 1) {
                                    handleAddItem();
                                    setTimeout(() => {
                                      itemRefs.current[idx + 1]?.focus();
                                    }, 100);
                                  } else {
                                    itemRefs.current[idx + 1]?.focus();
                                  }
                                }
                              }}
                              className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-xs font-bold text-left focus:ring-2 focus:ring-primary-500/20" 
                            />

                            <input type="number" value={item.discount} onChange={e => handleItemChange(idx, 'discount', e.target.value)} className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-xs font-bold text-left focus:ring-2 focus:ring-red-500/20" />

                            <div className="text-right">
                                <span className="text-sm font-black text-primary-700 truncate block">Tk. {Number(item.totalPrice).toFixed(2)}</span>
                            </div>

                            <div className="flex justify-end">
                                <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                 })}
                 
                 <div className="flex justify-center mt-6">
                    <button type="button" onClick={handleAddItem} className="flex items-center text-primary-600 font-black text-xs uppercase tracking-[0.2em] px-10 py-4 bg-primary-50/50 border-2 border-dashed border-primary-200 rounded-[24px] hover:bg-primary-50 transition-all active:scale-95 group">
                        <PlusIcon className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                        {t('saleInvoiceForm.addItemButton')}
                    </button>
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
              <div className="space-y-4">
                  <label className="block text-xs font-black uppercase text-gray-400 tracking-widest ml-1">{t('saleInvoiceForm.notesLabel')}</label>
                  <textarea rows={5} value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full p-6 border border-gray-100 bg-gray-50/30 rounded-[32px] text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner" placeholder="..." />
              </div>

              <div className="bg-gray-900 p-8 rounded-[48px] space-y-6 shadow-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                  
                  <div className="flex justify-between items-center text-xs font-black text-gray-500 uppercase tracking-widest px-1">
                      <span>{t('saleInvoiceForm.summary.subtotal')}</span>
                      <span className="text-white">{formatCurrency(subTotalAmount)}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="block text-xs font-black text-amber-400 uppercase tracking-widest ml-1">অতিরিক্ত মোট ছাড়</label>
                      <input 
                        type="number" 
                        value={formState.discountAmount} 
                        onChange={e => setFormState({...formState, discountAmount: e.target.value})} 
                        className="w-full px-5 py-3 bg-white/5 text-white border border-white/10 rounded-2xl text-xl font-black outline-none focus:border-amber-500 transition-all" 
                        placeholder="0.00"
                      />
                  </div>

                  <div className="flex justify-between items-end border-t border-white/10 pt-6 font-black">
                      <span className="text-xs uppercase tracking-widest text-primary-400 mb-2">{t('saleInvoiceForm.summary.netPayable')}</span>
                      <span className="text-6xl tracking-tighter">{formatCurrency(totalAmount)}</span>
                  </div>

                  <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black text-green-400 uppercase tracking-widest ml-1">{t('saleInvoiceForm.summary.amountPaid')}</label>
                      <input 
                        type="number" 
                        value={formState.amountPaid} 
                        onChange={e => setFormState({...formState, amountPaid: e.target.value})} 
                        className="w-full px-8 py-6 bg-white/10 text-white border-2 border-white/10 rounded-[32px] text-4xl font-black outline-none focus:border-primary-500 focus:bg-white focus:text-gray-900 transition-all shadow-xl" 
                      />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/10">
                      <div className="flex justify-between items-center">
                          <span className="text-xs uppercase tracking-widest opacity-40">{t('saleInvoiceForm.summary.amountDue')}</span>
                          <span className={`text-2xl font-black ${amountDue > 0 ? 'text-red-400' : 'text-gray-500'}`}>{formatCurrency(Math.max(0, amountDue))}</span>
                      </div>
                      
                      {selectedCustomer && (
                          <div className="space-y-3 mt-2">
                             <div className="flex justify-between items-center text-gray-500">
                                <span className="text-xs uppercase tracking-widest font-bold">পূর্বের বকেয়া</span>
                                <span className={`text-sm font-black ${selectedCustomer.totalDueAmount > 0 ? 'text-red-300' : 'text-green-300'}`}>
                                    {formatCurrency(selectedCustomer.totalDueAmount)}
                                </span>
                             </div>
                             <div className="flex justify-between items-center pt-2 border-t border-white/5 font-black text-primary-300">
                                <span className="text-xs uppercase tracking-widest opacity-60">সর্বমোট বকেয়া</span>
                                <span className={`text-3xl tracking-tight ${selectedCustomer.totalDueAmount + amountDue > 0 ? 'text-red-500' : 'text-green-400'}`}>
                                    {formatCurrency(Math.max(0, selectedCustomer.totalDueAmount + amountDue))}
                                </span>
                             </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
        </div>

        <div className="shrink-0 p-8 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-4 bg-white z-10">
          <button 
            type="button" 
            onClick={processSubmit}
            className="w-full sm:w-auto px-20 py-5 bg-primary-600 text-white font-black uppercase text-xs tracking-[0.3em] rounded-[28px] shadow-xl hover:brightness-110 active:scale-95 transition-all"
            title="Press Shift+Enter to complete"
          >
             {editData ? t('common.save') : t('saleInvoiceForm.submitButtonCreate')} (Shift+Enter)
          </button>
          
          {onHold && !editData && (
             <button type="button" onClick={() => onHold(formState)} className="w-full sm:w-auto flex items-center justify-center text-amber-600 font-black uppercase text-xs tracking-widest px-8 py-5 hover:bg-amber-50 rounded-[28px] transition-all shadow-sm">
                <PauseCircleIcon className="w-5 h-5 mr-2"/> {t('saleInvoiceForm.holdButton')}
            </button>
          )}

          <button type="button" onClick={onClose} className="w-full sm:w-auto px-10 py-5 text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-[28px] transition-all">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SaleInvoiceFormModal;
