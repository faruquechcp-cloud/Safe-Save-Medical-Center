
import React, { useState, useEffect, useCallback } from 'react';
import { MedicationItem, PurchaseItem, PurchaseInvoice, Supplier, HeldInvoice, PurchaseInvoiceFormState, PurchaseItemFormData } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PauseCircleIcon from './icons/PauseCircleIcon';
import { useTranslations } from '../hooks/useTranslations';
import { formatCurrency } from '../utils/formatUtils';
import MedicationSelector from './MedicationSelector';
import SearchableSelect from './SearchableSelect';

interface PurchaseInvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: PurchaseInvoice) => void | Promise<void>;
  medications: MedicationItem[];
  suppliers: Supplier[];
  getNextInvoiceNumber: () => Promise<string>;
  onHold?: (heldInvoiceData: PurchaseInvoiceFormState) => void | Promise<void>;
  resumeData?: HeldInvoice | null;
  editData?: PurchaseInvoice | null;
  onCreateSupplier?: () => void;
  onCreateMedication?: () => void;
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
  lastCreatedSupplierId?: string | null;
  lastCreatedMedicationId?: string | null;
}

const PurchaseInvoiceFormModal: React.FC<PurchaseInvoiceFormModalProps> = ({ 
  isOpen, onClose, onSubmit, medications, suppliers, getNextInvoiceNumber, onHold, resumeData, editData,
  onCreateSupplier, onCreateMedication, zIndex, onMinimize, isMinimized,
  lastCreatedSupplierId, lastCreatedMedicationId
}) => {
  const { t } = useTranslations();

  // Refs to manage quantity and price input focusing
  const qtyRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const priceRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const itemRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const batchRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const expiryRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const supplierSelectRef = React.useRef<HTMLInputElement>(null);

  const initialFormState: PurchaseInvoiceFormState = {
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    selectedSupplierId: '',
    notes: '',
    items: [],
    discountPercentage: '',
    discountAmount: '',
    amountPaid: '',
  };
  
  const [formState, setFormState] = useState<PurchaseInvoiceFormState>(initialFormState);
  const [isInitialized, setIsInitialized] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  
  const [calculatedSubTotal, setCalculatedSubTotal] = useState<number>(0);
  const [netPayableAmount, setNetPayableAmount] = useState<number>(0);
  const [amountDue, setAmountDue] = useState<number>(0);

  useEffect(() => {
    if (isOpen && lastCreatedSupplierId) {
      setFormState(prev => ({ ...prev, selectedSupplierId: lastCreatedSupplierId }));
    }
  }, [isOpen, lastCreatedSupplierId]);

  useEffect(() => {
    if (isOpen && lastCreatedMedicationId) {
      const lastItemIdx = formState.items.length - 1;
      if (lastItemIdx >= 0 && !formState.items[lastItemIdx].medicationId) {
        handleItemChange(lastItemIdx, 'medicationId', lastCreatedMedicationId);
      } else {
        const newItem: PurchaseItemFormData = { 
          medicationId: lastCreatedMedicationId, 
          medicationName: medications.find(m => m.id === lastCreatedMedicationId)?.name || '', 
          quantity: 1, 
          unitCost: medications.find(m => m.id === lastCreatedMedicationId)?.batches[0]?.costPrice || 0, 
          totalCost: medications.find(m => m.id === lastCreatedMedicationId)?.batches[0]?.costPrice || 0, 
          batchNumber: formState.invoiceNumber,
          expiryDate: '' 
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

  const calculateSubTotal = useCallback(() => {
    /* FIX: Remove item.totalPrice as it does not exist on PurchaseItemFormData; use totalCost exclusively */
    return formState.items.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
  }, [formState.items]);

  useEffect(() => {
    const initializeForm = async () => {
      if (editData) {
        setFormState({
          invoiceNumber: editData.invoiceNumber,
          date: editData.date.split('T')[0],
          selectedSupplierId: editData.supplierId || '',
          notes: editData.notes || '',
          items: editData.items.map(item => ({
            ...item,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
          })) as PurchaseItemFormData[],
          discountPercentage: editData.discountPercentage?.toString() || '',
          discountAmount: editData.discountAmount?.toString() || '',
          amountPaid: editData.amountPaid.toString(),
        });
      } else if (resumeData && resumeData.type === 'purchase') {
        const resumedFormData = resumeData.formData as PurchaseInvoiceFormState;
        setFormState(resumedFormData);
      } else {
        const nextNo = await getNextInvoiceNumber();
        setFormState({
          ...initialFormState,
          invoiceNumber: nextNo,
        });
      }
      setErrors({});
      setIsInitialized(true);
      
      // Focus supplier selector on open
      setTimeout(() => {
        supplierSelectRef.current?.focus();
      }, 300);
    };

    if (isOpen && !isInitialized) {
      initializeForm();
    }
  }, [isOpen, isInitialized, resumeData, editData, getNextInvoiceNumber]);

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
    const currentDiscAmountNum = parseFloat(formState.discountAmount) || 0;
    const actualDiscountAmount = Math.min(subTotal, currentDiscAmountNum >= 0 ? currentDiscAmountNum : 0);
    const calcNetPayable = Math.max(0, subTotal - actualDiscountAmount);
    setNetPayableAmount(calcNetPayable);
    const finalAmountPaidForCalc = Number(formState.amountPaid) || 0;
    const calcDue = calcNetPayable - finalAmountPaidForCalc;
    setAmountDue(calcDue);
  }, [calculatedSubTotal, formState.discountAmount, formState.amountPaid]);

  const validateItem = (item: PurchaseItemFormData, index: number): boolean => { 
    let isValid = true;
    const currentErrors = {...errors};
    if (!item.medicationId) {
      currentErrors[`item_med_${index}`] = t('purchaseInvoiceForm.error.medicationRequired');
      isValid = false;
    } else delete currentErrors[`item_med_${index}`];
    
    if (!item.batchNumber?.trim()) { 
      currentErrors[`item_batch_${index}`] = t('purchaseInvoiceForm.error.batchRequired');
      isValid = false;
    } else delete currentErrors[`item_batch_${index}`];

    setErrors(currentErrors);
    return isValid;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!formState.date) newErrors.date = t('purchaseInvoiceForm.error.dateRequired');
    if (formState.items.length === 0) newErrors.items = t('purchaseInvoiceForm.error.atLeastOneItem');
    
    let itemsValid = true;
    formState.items.forEach((item, index) => {
      if (!validateItem(item as PurchaseItemFormData, index)) itemsValid = false;
    });
    
    setErrors(prev => ({...prev, ...newErrors}));
    return Object.keys(newErrors).filter(k => newErrors[k]).length === 0 && itemsValid;
  };

  const handleAddItem = () => {
    const newItem: PurchaseItemFormData = { 
      medicationId: '', 
      medicationName: '', 
      quantity: 1, 
      unitCost: 0, 
      totalCost: 0, 
      batchNumber: formState.invoiceNumber, // Auto set to current invoice number
      expiryDate: '' 
    };
    setFormState(prev => ({...prev, items: [...prev.items, newItem]}));
  };

  const handleRemoveItem = (index: number) => {
    setFormState(prev => ({...prev, items: prev.items.filter((_, i) => i !== index)}));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItemFormData, value: string | number) => {
    const newItems = [...formState.items];
    const itemToUpdate = { ...newItems[index] } as unknown as PurchaseItemFormData; 
    itemToUpdate[field] = value as any; 

    if (field === 'medicationId') {
      const selectedMed = medications.find(m => m.id === String(value));
      if (selectedMed) {
        itemToUpdate.medicationName = selectedMed.name;
        itemToUpdate.unitCost = selectedMed.batches[0]?.costPrice || 0;
        
        // FOCUS LOGIC: Automatically focus the batch input after product selection
        setTimeout(() => {
          if (batchRefs.current[index]) {
            batchRefs.current[index]?.focus();
            batchRefs.current[index]?.select();
          }
        }, 50);
      }
    }

    if (field === 'quantity' || field === 'unitCost' || field === 'medicationId') {
        const qty = Number(itemToUpdate.quantity);
        const cost = Number(itemToUpdate.unitCost);
        if (!isNaN(qty) && !isNaN(cost)) {
            itemToUpdate.totalCost = qty * cost; 
        }
    }
    
    newItems[index] = itemToUpdate; 
    setFormState(prev => ({...prev, items: newItems}));
  };
  
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
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
    if (!validateForm()) return;

    const paid = Number(formState.amountPaid) || 0;
    const selectedSupplier = suppliers.find(s => s.id === formState.selectedSupplierId);
    const previousOwed = selectedSupplier?.totalAmountOwed || 0;
    const maxPayable = netPayableAmount + previousOwed;

    if (paid > maxPayable + 0.01 && selectedSupplier) {
        if (!confirm(`পরিশোধ নীট পরিশোধযোগ্য + পূর্বের বকেয়া (${formatCurrency(maxPayable)}) এর চেয়ে বেশি। আপনি কি অতিরিক্ত পরিশোধ করতে চান?`)) {
            return;
        }
    } else if (paid > netPayableAmount + 0.01 && !selectedSupplier) {
        alert(`সাপ্লায়ার নির্বাচন করা না থাকলে নীট পরিশোধযোগ্য (${formatCurrency(netPayableAmount)}) এর বেশি পরিশোধ করা যাবে না।`);
        return;
    }

    const finalItems: PurchaseItem[] = formState.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        totalCost: Number(item.totalCost),
        batchNumber: item.batchNumber,
        expiryDate: item.expiryDate,
    }));

    const finalAmountPaidNum = Number(formState.amountPaid) || 0;
    const finalDiscountAmt = formState.discountAmount.trim() === '' ? undefined : parseFloat(formState.discountAmount);

    // Merge selected date with current time for new invoices
    let finalDate = formState.date;
    if (!editData) {
      const now = new Date();
      const selectedDate = new Date(formState.date);
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      finalDate = selectedDate.toISOString();
    }

    const newInvoice: PurchaseInvoice = {
      id: editData?.id || (resumeData?.type === 'purchase' ? resumeData.id : crypto.randomUUID()),
      invoiceNumber: formState.invoiceNumber,
      date: finalDate,
      items: finalItems, 
      subTotalAmount: calculatedSubTotal,
      discountAmount: finalDiscountAmt,
      totalAmount: netPayableAmount,
      supplierId: formState.selectedSupplierId || undefined,
      supplierName: suppliers.find(s => s.id === formState.selectedSupplierId)?.name || undefined,
      amountPaid: finalAmountPaidNum,
      amountDue: amountDue,
      notes: formState.notes.trim() || undefined,
    };
    onSubmit(newInvoice);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editData ? "ক্রয় রশিদ পরিবর্তন" : t('purchaseInvoiceForm.createTitle')} size="5xl" zIndex={zIndex} onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="flex flex-col h-full bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">{t('purchaseInvoiceForm.invoiceNumberLabel')}</label>
              <input type="text" value={formState.invoiceNumber} readOnly className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">{t('purchaseInvoiceForm.dateLabel')} *</label>
              <input type="date" name="date" value={formState.date} onChange={handleFormInputChange} className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-black uppercase text-gray-400 tracking-widest ml-1">{t('purchaseInvoiceForm.supplierLabel')} *</label>
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                    <SearchableSelect 
                        options={suppliers.map(s => ({ id: s.id, label: s.name, subLabel: s.contact }))}
                        selectedId={formState.selectedSupplierId}
                        onSelect={(id) => {
                          setFormState(prev => ({...prev, selectedSupplierId: id}));
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
                        placeholder={t('purchaseInvoiceForm.selectSupplierPlaceholder')}
                        ref={supplierSelectRef}
                    />
                </div>
                {onCreateSupplier && (
                    <button type="button" onClick={onCreateSupplier} className="p-3 bg-primary-50 text-primary-600 rounded-2xl hover:bg-primary-100 transition-colors shadow-sm h-[46px] flex items-center justify-center" title="নতুন কোম্পানি যোগ">
                        <PlusIcon className="w-6 h-6" />
                    </button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
             <div className="hidden lg:grid grid-cols-[4fr_1.5fr_1fr_1.5fr_1.5fr_1.5fr_0.5fr] gap-3 px-4 py-3 bg-gray-900 border border-transparent rounded-t-[24px] text-xs font-black text-gray-400 uppercase tracking-widest">
                <div className="pl-3">{t('purchaseInvoiceForm.item.medication')}</div>
                <div className="pl-3">{t('purchaseInvoiceForm.item.batch')}</div>
                <div className="text-center">{t('purchaseInvoiceForm.item.quantity')}</div>
                <div className="pl-3">{t('purchaseInvoiceForm.item.unitCost')}</div>
                <div className="pl-3">{t('purchaseInvoiceForm.item.expiry')}</div>
                <div className="text-right pr-4">{t('purchaseInvoiceForm.item.total')}</div>
                <div></div>
             </div>

             <div className="space-y-2">
                {formState.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 lg:grid-cols-[4fr_1.5fr_1fr_1.5fr_1.5fr_1.5fr_0.5fr] gap-3 items-center p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:border-primary-200 transition-all">
                        <div className="flex items-center space-x-2">
                            <div className="flex-1">
                                <MedicationSelector
                                    medications={medications}
                                    selectedId={item.medicationId}
                                    onSelect={(id) => handleItemChange(index, 'medicationId', id)}
                                    placeholder={t('purchaseInvoiceForm.item.selectMedication')}
                                    ref={el => { itemRefs.current[index] = el; }}
                                />
                            </div>
                            {onCreateMedication && (
                                <button type="button" onClick={onCreateMedication} className="p-2.5 bg-gray-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-colors border border-gray-100" title="নতুন পন্য যোগ">
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <input 
                          ref={el => { batchRefs.current[index] = el; }}
                          type="text" 
                          placeholder="Batch #" 
                          value={item.batchNumber} 
                          onChange={e => handleItemChange(index, 'batchNumber', e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              qtyRefs.current[index]?.focus();
                              qtyRefs.current[index]?.select();
                            }
                          }}
                          className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-xs font-bold outline-none bg-gray-100 focus:bg-white" 
                        />
                        
                        <input 
                          ref={el => { qtyRefs.current[index] = el; }}
                          type="number" 
                          placeholder="Qty" 
                          value={item.quantity} 
                          onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              priceRefs.current[index]?.focus();
                              priceRefs.current[index]?.select();
                            }
                          }}
                          className="w-full p-2.5 border border-gray-100 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-primary-500/20" 
                        />
                        
                         <input 
                          ref={el => { priceRefs.current[index] = el; }}
                          type="number" 
                          placeholder="Cost" 
                          value={item.unitCost} 
                          onChange={e => handleItemChange(index, 'unitCost', e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              expiryRefs.current[index]?.focus();
                            }
                          }}
                          className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-xs font-bold text-left focus:ring-2 focus:ring-primary-500/20" 
                        />
                        
                        <input 
                          ref={el => { expiryRefs.current[index] = el; }}
                          type="date" 
                          value={item.expiryDate} 
                          onChange={e => handleItemChange(index, 'expiryDate', e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              // If it's the last item, add a new one
                              if (index === formState.items.length - 1) {
                                handleAddItem();
                                setTimeout(() => {
                                  itemRefs.current[index + 1]?.focus();
                                }, 100);
                              } else {
                                itemRefs.current[index + 1]?.focus();
                              }
                            }
                          }}
                          className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-[10px] font-bold outline-none bg-gray-50 focus:bg-white" 
                        />

                        <div className="text-right">
                             <span className="text-xs font-black text-primary-700 truncate block">Tk. {Number(item.totalCost).toFixed(2)}</span>
                        </div>

                        <div className="flex justify-end">
                            <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}

                <div className="flex justify-center mt-6">
                    <button type="button" onClick={handleAddItem} className="flex items-center text-primary-600 font-black text-xs uppercase tracking-[0.2em] px-10 py-4 bg-primary-50/50 border-2 border-dashed border-primary-200 rounded-[24px] hover:bg-primary-50 transition-all active:scale-95 group">
                        <PlusIcon className="w-5 h-5 mr-3 group-hover:scale-125 transition-transform" />
                        {t('purchaseInvoiceForm.addItemButton')}
                    </button>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
              <div className="space-y-4">
                  <label className="block text-xs font-black uppercase text-gray-400 tracking-widest ml-1">{t('purchaseInvoiceForm.notesLabel')}</label>
                  <textarea rows={5} value={formState.notes} name="notes" onChange={handleFormInputChange} className="w-full p-6 border border-gray-100 bg-gray-50/30 rounded-[32px] text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner" placeholder="..." />
              </div>

              <div className="bg-slate-900 p-8 rounded-[48px] space-y-6 shadow-2xl text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-3xl -mr-24 -mt-24"></div>
                  
                  <div className="flex justify-between items-center text-xs font-black text-slate-500 uppercase tracking-widest px-1">
                      <span>{t('purchaseInvoiceForm.summary.subtotal')}</span>
                      <span className="text-white">{formatCurrency(calculatedSubTotal)}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="block text-xs font-black text-amber-400 uppercase tracking-widest ml-1">অতিরিক্ত মোট ছাড়</label>
                      <input 
                        type="number" 
                        value={formState.discountAmount} 
                        name="discountAmount"
                        onChange={handleFormInputChange} 
                        className="w-full px-5 py-3 bg-white/5 text-white border border-white/10 rounded-2xl text-xl font-black outline-none focus:border-amber-500 transition-all" 
                        placeholder="0.00"
                      />
                  </div>

                  <div className="flex justify-between items-end border-t border-white/10 pt-6 font-black">
                      <span className="text-xs uppercase tracking-widest text-primary-400 mb-2">{t('purchaseInvoiceForm.summary.netPayable')}</span>
                      <span className="text-6xl tracking-tighter">{formatCurrency(netPayableAmount)}</span>
                  </div>

                  <div className="space-y-2 pt-2">
                      <label className="block text-xs font-black text-green-400 uppercase tracking-widest ml-1">{t('purchaseInvoiceForm.summary.amountPaid')}</label>
                      <input 
                        type="number" 
                        name="amountPaid"
                        value={formState.amountPaid} 
                        onChange={handleFormInputChange} 
                        className="w-full px-8 py-6 bg-white/10 text-white border-2 border-white/10 rounded-[32px] text-4xl font-black outline-none focus:border-primary-500 focus:bg-white focus:text-gray-900 transition-all shadow-xl" 
                      />
                  </div>

                  <div className="flex justify-between items-center pt-6 border-t border-white/10">
                      <span className="text-xs font-black uppercase tracking-widest opacity-40">{t('purchaseInvoiceForm.summary.amountDue')}</span>
                      <span className="text-2xl font-black text-primary-400">{formatCurrency(Math.max(0, amountDue))}</span>
                  </div>
                  
                  {suppliers.find(s => s.id === formState.selectedSupplierId) && (
                      <div className="space-y-3 mt-2">
                         <div className="flex justify-between items-center text-slate-500">
                            <span className="text-xs uppercase tracking-widest font-bold">পূর্বের বকেয়া</span>
                            <span className="text-sm font-bold">{formatCurrency(suppliers.find(s => s.id === formState.selectedSupplierId)?.totalAmountOwed || 0)}</span>
                         </div>
                         <div className="flex justify-between items-center pt-2 border-t border-white/5 font-black text-primary-300">
                            <span className="text-xs uppercase tracking-widest opacity-60">সর্বমোট বকেয়া</span>
                            <span className="text-2xl tracking-tight">{formatCurrency(Math.max(0, (suppliers.find(s => s.id === formState.selectedSupplierId)?.totalAmountOwed || 0) + amountDue))}</span>
                         </div>
                      </div>
                  )}
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
             {editData ? t('common.save') : t('purchaseInvoiceForm.submitButtonCreate')} (Shift+Enter)
          </button>
          
          {onHold && !editData && (
             <button type="button" onClick={() => onHold(formState)} className="w-full sm:w-auto flex items-center justify-center text-amber-600 font-black uppercase text-xs tracking-widest px-8 py-5 hover:bg-amber-50 rounded-[28px] transition-all shadow-sm">
                <PauseCircleIcon className="w-5 h-5 mr-2"/> {t('purchaseInvoiceForm.holdButton')}
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

export default PurchaseInvoiceFormModal;
