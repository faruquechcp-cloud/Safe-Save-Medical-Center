
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ServiceItemDefinition, ServiceInvoice, Customer, ServiceInvoiceFormState, ServiceInvoiceItemFormData, HeldInvoice } from '../types';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PauseCircleIcon from './icons/PauseCircleIcon';
import { useTranslations } from '../hooks/useTranslations';
import { formatCurrency } from '../utils/formatUtils';
import SearchableSelect from './SearchableSelect';

interface ServiceInvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoice: ServiceInvoice) => void;
  serviceDefinitions: ServiceItemDefinition[]; 
  customers: Customer[];
  getNextInvoiceNumber: () => Promise<string>;
  onHold?: (heldInvoiceData: ServiceInvoiceFormState) => void;
  onCreateCustomer?: () => void;
  resumeData?: HeldInvoice | null;
  editData?: ServiceInvoice | null;
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const ServiceInvoiceFormModal: React.FC<ServiceInvoiceFormModalProps> = ({ 
  isOpen, onClose, onSubmit, serviceDefinitions, customers, getNextInvoiceNumber, onHold, onCreateCustomer, resumeData, editData, zIndex, onMinimize, isMinimized
}) => {
  const { t } = useTranslations();
  
  const initialFormState: ServiceInvoiceFormState = {
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    selectedCustomerId: '',
    notes: '',
    items: [],
    discountPercentage: '',
    discountAmount: '',
    amountPaid: '',
  };

  const [formState, setFormState] = useState<ServiceInvoiceFormState>(initialFormState);
  const [calculatedSubTotal, setCalculatedSubTotal] = useState<number>(0);
  const [netPayableAmount, setNetPayableAmount] = useState<number>(0);
  const [amountDue, setAmountDue] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const qtyRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const priceRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const itemRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const customerSelectRef = React.useRef<HTMLInputElement>(null);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => a.name.localeCompare(b.name, 'bn'));
  }, [customers]);

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === formState.selectedCustomerId),
    [customers, formState.selectedCustomerId]
  );

  const calculateSubTotal = useCallback(() => {
    return formState.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [formState.items]);

  useEffect(() => {
    const initializeForm = async () => {
      if (isInitialized) return;

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
            totalPrice: item.totalPrice,
          })) as ServiceInvoiceItemFormData[],
          discountPercentage: editData.discountPercentage?.toString() || '',
          discountAmount: editData.discountAmount?.toString() || '',
          amountPaid: editData.amountPaid.toString(),
        });
      } else if (resumeData && resumeData.type === 'service') {
        setFormState(resumeData.formData as ServiceInvoiceFormState);
      } else {
        const nextNo = await getNextInvoiceNumber();
        setFormState({ ...initialFormState, invoiceNumber: nextNo });
      }
      setIsInitialized(true);
      
      // Focus customer selector on open
      setTimeout(() => {
        customerSelectRef.current?.focus();
      }, 300);
    };

    if (isOpen) initializeForm();
  }, [isOpen, resumeData, editData, getNextInvoiceNumber, isInitialized]); 
  
  useEffect(() => {
    if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const sub = calculateSubTotal();
    setCalculatedSubTotal(sub);
    const headerDisc = parseFloat(formState.discountAmount) || 0;
    const net = Math.max(0, sub - headerDisc);
    setNetPayableAmount(net);
    const paid = Number(formState.amountPaid) || 0;
    setAmountDue(net - paid);
  }, [formState.items, formState.discountAmount, formState.amountPaid, calculateSubTotal]);

  const handleAddItem = () => {
    setFormState(prev => ({
      ...prev,
      items: [...prev.items, { serviceItemDefinitionId: '', serviceItemName: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormState(prev => ({...prev, items: prev.items.filter((_, i) => i !== index)}));
  };
  
  const handleItemChange = (index: number, field: keyof ServiceInvoiceItemFormData, value: string | number) => {
    const newItems = [...formState.items];
    const item = { ...newItems[index] };
    (item as any)[field] = value;

    if (field === 'serviceItemDefinitionId') {
      const selectedServiceDef = serviceDefinitions.find(sd => sd.id === String(value));
      if (selectedServiceDef) {
        item.serviceItemName = selectedServiceDef.name;
        item.unitPrice = Number(selectedServiceDef.price); 
        
        // FOCUS LOGIC: Automatically focus the quantity input after service selection
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
    item.totalPrice = q * p;
    
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
    const validItems = formState.items.filter(i => i.serviceItemDefinitionId && Number(i.quantity) > 0);
    if (validItems.length === 0) return;

    const paid = Number(formState.amountPaid) || 0;
    const previousDue = selectedCustomer?.totalDueAmount || 0;
    const maxPayable = netPayableAmount + previousDue;

    if (paid > maxPayable && selectedCustomer) {
        if (!confirm(`জমা নীট পরিশোধযোগ্য + পূর্বের বকেয়া (${formatCurrency(maxPayable)}) এর চেয়ে বেশি। আপনি কি অতিরিক্ত জমা গ্রহণ করতে চান?`)) {
            return;
        }
    } else if (paid > netPayableAmount && !selectedCustomer) {
        alert(`কাস্টমার নির্বাচন করা না থাকলে নীট পরিশোধযোগ্য (${formatCurrency(netPayableAmount)}) এর বেশি জমা গ্রহণ করা যাবে না।`);
        return;
    }

    // Merge selected date with current time for new invoices
    let finalDate = formState.date;
    if (!editData) {
      const now = new Date();
      const selectedDate = new Date(formState.date);
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      finalDate = selectedDate.toISOString();
    }

    const finalInvoice: ServiceInvoice = {
      id: editData?.id || crypto.randomUUID(),
      invoiceNumber: formState.invoiceNumber,
      date: finalDate,
      items: validItems.map(i => ({
        ...i,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
      subTotalAmount: calculatedSubTotal,
      discountAmount: Number(formState.discountAmount) || 0,
      totalAmount: netPayableAmount,
      amountPaid: Number(formState.amountPaid) || 0,
      amountDue: amountDue,
      customerId: formState.selectedCustomerId || undefined,
      customerName: selectedCustomer?.name,
      notes: formState.notes,
    };
    onSubmit(finalInvoice);
  };

  const handleHoldInvoiceLocal = () => {
    if (onHold) {
      onHold(formState);
    }
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={editData ? t('common.save') : t('serviceInvoiceForm.createTitle')} 
        size="5xl" 
        zIndex={zIndex}
        onMinimize={onMinimize}
        isMinimized={isMinimized}
    >
      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="flex flex-col h-full bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('saleInvoiceForm.invoiceNumberLabel')}</label>
                    <input type="text" value={formState.invoiceNumber} readOnly className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none shadow-sm"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('saleInvoiceForm.dateLabel')}</label>
                    <input type="date" value={formState.date} onChange={e => setFormState({...formState, date: e.target.value})} className="w-full px-5 py-3.5 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm"/>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('saleInvoiceForm.customerLabel')}</label>
                    <div className="flex items-center space-x-2">
                        <div className="flex-1">
                            <SearchableSelect 
                                options={sortedCustomers.map(c => ({ id: c.id, label: c.name, subLabel: c.phone }))}
                                selectedId={formState.selectedCustomerId}
                                onSelect={(id) => {
                                    setFormState({...formState, selectedCustomerId: id});
                                    // Auto add first item if empty
                                    if (formState.items.length === 0 || (formState.items.length === 1 && !formState.items[0].serviceItemDefinitionId)) {
                                        if (formState.items.length === 0) {
                                            handleAddItem();
                                        }
                                        setTimeout(() => {
                                            itemRefs.current[0]?.focus();
                                        }, 100);
                                    }
                                }}
                                placeholder={t('saleInvoiceForm.selectCustomerPlaceholder')}
                                inputRef={customerSelectRef}
                            />
                        </div>
                        {onCreateCustomer && (
                            <button type="button" onClick={onCreateCustomer} className="p-3 bg-primary-50 text-primary-600 rounded-2xl hover:bg-primary-100 transition-colors shadow-sm h-[46px] flex items-center justify-center">
                                <PlusIcon className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="hidden lg:grid grid-cols-[4fr_1fr_1.5fr_1.5fr_0.5fr] gap-3 px-4 py-3 bg-gray-900 border border-transparent rounded-t-[24px] text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div className="pl-3">সেবা নির্বাচন</div>
                    <div className="text-center">পরিমাণ</div>
                    <div className="pl-3">সেবা চার্জ</div>
                    <div className="text-right pr-4">মোট টাকা</div>
                    <div></div>
                </div>
                
                <div className="space-y-2">
                    {formState.items.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 lg:grid-cols-[4fr_1fr_1.5fr_1.5fr_0.5fr] gap-3 items-center p-4 border border-gray-100 rounded-2xl bg-white shadow-sm hover:border-primary-200 transition-all">
                            <div>
                                <SearchableSelect 
                                    options={serviceDefinitions.map(sd => ({ id: sd.id, label: sd.name, subLabel: `Tk. ${sd.price.toFixed(2)}` }))}
                                    selectedId={item.serviceItemDefinitionId}
                                    onSelect={(id) => handleItemChange(idx, 'serviceItemDefinitionId', id)}
                                    placeholder={t('serviceInvoiceForm.item.selectService')}
                                    inputRef={{ current: itemRefs.current[idx] } as any}
                                />
                            </div>
                            <div>
                                <input 
                                    ref={el => { qtyRefs.current[idx] = el; }}
                                    type="number" 
                                    placeholder="Qty" 
                                    value={item.quantity} 
                                    onChange={e => handleItemChange(idx, 'quantity', e.target.value)} 
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            priceRefs.current[idx]?.focus();
                                            priceRefs.current[idx]?.select();
                                        }
                                    }}
                                    className="w-full p-2.5 border border-gray-100 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-primary-500/20" 
                                />
                            </div>
                            <div>
                                <input 
                                    ref={el => { priceRefs.current[idx] = el; }}
                                    type="number" 
                                    placeholder="Rate" 
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
                            </div>
                            <div className="text-right font-black text-primary-700 text-xs truncate">
                                {formatCurrency(item.totalPrice)}
                            </div>
                            <div className="flex justify-end">
                                <button type="button" onClick={() => handleRemoveItem(idx)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><TrashIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                    
                    <div className="flex justify-center mt-4">
                        <button type="button" onClick={handleAddItem} className="flex items-center text-primary-600 font-black text-[10px] uppercase tracking-[0.2em] px-8 py-3 bg-primary-50/50 border-2 border-dashed border-primary-200 rounded-xl hover:bg-primary-50 transition-all group">
                            <PlusIcon className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform"/> {t('saleInvoiceForm.addItemButton')}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t border-gray-100">
                <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('saleInvoiceForm.notesLabel')}</label>
                    <textarea placeholder="..." value={formState.notes} onChange={e => setFormState({...formState, notes: e.target.value})} className="w-full min-h-[160px] p-6 border border-gray-100 bg-gray-50/30 rounded-[32px] text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all shadow-inner" />
                </div>
                
                <div className="bg-gray-900 p-8 rounded-[40px] space-y-6 shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    
                    <div className="flex justify-between items-center text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">
                        <span>{t('saleInvoiceForm.summary.subtotal')}</span>
                        <span>{formatCurrency(calculatedSubTotal)}</span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                        <label className="block text-[10px] font-black text-amber-400 uppercase tracking-widest ml-1">{t('saleInvoiceForm.summary.discountAmount')}</label>
                        <input 
                            type="number" 
                            value={formState.discountAmount} 
                            onChange={e => setFormState({...formState, discountAmount: e.target.value})} 
                            className="w-full px-4 py-2 bg-white/5 text-white border border-white/10 rounded-xl text-lg font-black outline-none focus:border-amber-500 transition-all" 
                            placeholder="0.00"
                        />
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-white/10 pt-4 font-black">
                        <span className="text-[10px] uppercase tracking-widest text-primary-400 mb-1">{t('saleInvoiceForm.summary.netPayable')}</span>
                        <span className="text-5xl tracking-tighter">{formatCurrency(netPayableAmount)}</span>
                    </div>
                    
                    <div className="space-y-1.5 pt-2">
                        <label className="block text-[10px] font-black text-green-400 uppercase tracking-widest ml-1">{t('saleInvoiceForm.summary.amountPaid')}</label>
                        <input type="number" value={formState.amountPaid} onChange={e => setFormState({...formState, amountPaid: e.target.value})} className="w-full px-6 py-4 bg-white/10 text-white border-2 border-white/10 rounded-2xl text-3xl font-black outline-none focus:border-primary-500 focus:bg-white focus:text-gray-900 transition-all" />
                    </div>
                    
                    <div className="space-y-3 pt-4 border-t border-white/10">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] uppercase tracking-widest opacity-40">{t('saleInvoiceForm.summary.amountDue')}</span>
                            <span className={`text-xl font-black ${amountDue > 0 ? 'text-red-400' : 'text-gray-400'}`}>{formatCurrency(Math.max(0, amountDue))}</span>
                        </div>
                        {selectedCustomer && (
                            <>
                                <div className="flex justify-between items-center opacity-40">
                                    <span className="text-[10px] uppercase tracking-widest">পূর্বের বকেয়া</span>
                                    <span className="text-sm font-bold">{formatCurrency(selectedCustomer.totalDueAmount)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-white/5 font-black text-primary-300">
                                    <span className="text-[10px] uppercase tracking-widest opacity-60">সর্বমোট বকেয়া</span>
                                    <span className="text-2xl tracking-tight">{formatCurrency(Math.max(0, selectedCustomer.totalDueAmount + amountDue))}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="shrink-0 p-8 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-4 bg-white z-10">
            <button 
                type="button" 
                onClick={processSubmit}
                className="w-full sm:w-auto px-16 py-5 bg-primary-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:brightness-110 active:scale-95 transition-all"
                title="Press Shift+Enter to complete"
            >
                {editData ? t('common.save') : t('serviceInvoiceForm.submitButtonCreate')} (Shift+Enter)
            </button>
            {onHold && (
                <button type="button" onClick={handleHoldInvoiceLocal} className="w-full sm:w-auto flex items-center justify-center text-amber-600 font-black uppercase text-[10px] tracking-widest px-8 py-5 hover:bg-amber-50 rounded-2xl transition-all shadow-sm">
                    <PauseCircleIcon className="w-5 h-5 mr-2"/> {t('serviceInvoiceForm.holdButton')}
                </button>
            )}
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-10 py-5 rounded-2xl text-gray-400 font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">{t('saleInvoiceForm.cancelButton')}</button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceInvoiceFormModal;
