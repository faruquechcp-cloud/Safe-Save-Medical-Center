
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MedicationItem, BatchDetail } from '../types'; 
import { MEDICATION_FORMS, UNIT_OF_MEASURES } from '../constants';
import Modal from './Modal';
import PlusIcon from './icons/PlusIcon'; 
import TrashIcon from './icons/TrashIcon'; 
import { useTranslations } from '../hooks/useTranslations';
import ProductAutocomplete from './ProductAutocomplete';

interface MedicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (medication: MedicationItem) => void;
  initialData?: MedicationItem | null;
  existingMedications?: MedicationItem[];
  title: string;
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const defaultFormData: Omit<MedicationItem, 'id' | 'dateAdded' | 'batches'> = {
  name: '',
  genericName: '',
  strength: '',
  form: MEDICATION_FORMS[0] || '',
  manufacturer: '',
  unitOfMeasure: UNIT_OF_MEASURES[0] || '',
  sellingPrice: '' as any,
  location: '',
  lowStockThreshold: '10' as any,
  notes: '',
  isActive: true,
};

const MedicationFormModal: React.FC<MedicationFormModalProps> = ({ 
  isOpen, onClose, onSubmit, initialData, title, existingMedications = [], zIndex, onMinimize, isMinimized 
}) => {
  const { t } = useTranslations();
  const [formData, setFormData] = useState<Omit<MedicationItem, 'id' | 'dateAdded' | 'batches'>>(defaultFormData);
  const [currentBatches, setCurrentBatches] = useState<BatchDetail[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Extract unique values for autocomplete suggestions
  const suggestions = useMemo(() => {
    const generics = new Set<string>();
    const manufacturers = new Set<string>();
    const strengths = new Set<string>();
    const forms = new Set<string>(MEDICATION_FORMS);
    const uoms = new Set<string>(UNIT_OF_MEASURES);

    existingMedications.forEach(med => {
      if (med.genericName) generics.add(med.genericName);
      if (med.manufacturer) manufacturers.add(med.manufacturer);
      if (med.strength) strengths.add(med.strength);
      if (med.form) forms.add(med.form);
      if (med.unitOfMeasure) uoms.add(med.unitOfMeasure);
    });

    return {
      genericNames: Array.from(generics).sort(),
      manufacturers: Array.from(manufacturers).sort(),
      strengths: Array.from(strengths).sort(),
      forms: Array.from(forms).sort(),
      uoms: Array.from(uoms).sort(),
    };
  }, [existingMedications]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const { id, dateAdded, batches, ...productDataToEdit } = initialData;
        setFormData({
            ...productDataToEdit,
            isActive: productDataToEdit.isActive !== undefined ? productDataToEdit.isActive : true
        });
        setCurrentBatches(batches ? [...batches.map(b => ({...b}))] : []); 
      } else {
        setFormData(defaultFormData);
        setCurrentBatches([]);
      }
      
      const timer = setTimeout(() => {
        nameInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target; 
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
        return;
    }
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleAutocompleteChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBatch = () => {
    const newBatch: BatchDetail = {
      id: crypto.randomUUID(),
      batchNumber: '',
      expiryDate: '',
      quantityInStock: 0,
      costPrice: 0,
      dateAdded: new Date().toISOString()
    };
    setCurrentBatches([...currentBatches, newBatch]);
  };

  const handleRemoveBatch = (id: string) => {
    setCurrentBatches(currentBatches.filter(b => b.id !== id));
  };

  const handleBatchChange = (index: number, field: keyof BatchDetail, value: string) => {
    const updatedBatches = [...currentBatches];
    updatedBatches[index] = { ...updatedBatches[index], [field]: value as any };
    setCurrentBatches(updatedBatches);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submittedMedication: MedicationItem = {
      id: initialData?.id || crypto.randomUUID(),
      ...formData,
      sellingPrice: Number(formData.sellingPrice), 
      lowStockThreshold: Number(formData.lowStockThreshold), 
      dateAdded: initialData?.dateAdded || new Date().toISOString(),
      batches: currentBatches.map(b => ({ 
          ...b,
          quantityInStock: Number(b.quantityInStock), 
          costPrice: Number(b.costPrice)             
      })),
    };
    onSubmit(submittedMedication);
    onClose(); 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
        return;
      }
      if ((e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
        const form = formRef.current;
        if (!form) return;
        const focusableElements = Array.from(
          form.querySelectorAll('input, select, textarea, button[type="button"]')
        ) as HTMLElement[];
        const activeElement = document.activeElement as HTMLElement;
        const currentIndex = focusableElements.indexOf(activeElement);
        if (currentIndex > -1 && currentIndex < focusableElements.length - 1) {
          focusableElements[currentIndex + 1].focus();
        }
      }
    }
  };

  const inputClass = "w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-[24px] font-bold focus:bg-white focus:ring-4 focus:ring-primary-500/10 outline-none transition-all shadow-sm";
  const labelClass = "text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block ml-1";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="5xl" zIndex={zIndex} onMinimize={onMinimize} isMinimized={isMinimized}>
      <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="bg-white flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 sm:p-12 space-y-10 custom-scrollbar">
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-6">
             <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Basic Information</h3>
             <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" name="isActive" className="sr-only" checked={formData.isActive} onChange={handleChange} />
                  <div className={`block w-12 h-7 rounded-full transition-colors ${formData.isActive ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${formData.isActive ? 'translate-x-full' : ''}`}></div>
                </div>
                <div className="ml-3 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  {formData.isActive ? 'Active Product' : 'Inactive Product'}
                </div>
             </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>{t('productForm.nameLabel')} *</label>
              <input ref={nameInputRef} type="text" name="name" value={formData.name} onChange={handleChange} autoComplete="off" required className={inputClass} />
            </div>
            
            <ProductAutocomplete 
              name="genericName"
              label={t('productForm.genericLabel')}
              value={formData.genericName}
              onChange={(val) => handleAutocompleteChange('genericName', val)}
              suggestions={suggestions.genericNames}
              required
            />

            <ProductAutocomplete 
              name="strength"
              label={t('productForm.strengthLabel')}
              value={formData.strength}
              onChange={(val) => handleAutocompleteChange('strength', val)}
              suggestions={suggestions.strengths}
              placeholder="e.g. 500mg"
            />

            <ProductAutocomplete 
              name="form"
              label={t('productForm.formLabel')}
              value={formData.form}
              onChange={(val) => handleAutocompleteChange('form', val)}
              suggestions={suggestions.forms}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <ProductAutocomplete 
              name="manufacturer"
              label={t('productForm.manufacturerLabel')}
              value={formData.manufacturer}
              onChange={(val) => handleAutocompleteChange('manufacturer', val)}
              suggestions={suggestions.manufacturers}
            />

            <ProductAutocomplete 
              name="unitOfMeasure"
              label={t('productForm.uomLabel')}
              value={formData.unitOfMeasure}
              onChange={(val) => handleAutocompleteChange('unitOfMeasure', val)}
              suggestions={suggestions.uoms}
            />

            <div className="space-y-1">
              <label className={labelClass}>{t('productForm.priceLabel')} (MRP)</label>
              <input type="number" name="sellingPrice" value={formData.sellingPrice} onChange={handleChange} className={inputClass} step="0.01" />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>{t('productForm.thresholdLabel')}</label>
              <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>{t('productForm.locationLabel')}</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Shelf A-1" className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>{t('productForm.notesLabel')}</label>
              <input type="text" name="notes" value={formData.notes} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="pt-10 border-t border-gray-100">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t('productForm.batchesTitle')}</h3>
                <button type="button" onClick={handleAddBatch} className="flex items-center px-6 py-3 bg-primary-50 text-primary-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-primary-100 transition-all shadow-sm active:scale-95">
                    <PlusIcon className="w-5 h-5 mr-2" /> {t('productForm.addBatch')}
                </button>
            </div>

            {currentBatches.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No inventory batches detected. Add a batch to begin tracking stock levels.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {currentBatches.map((batch, index) => (
                        <div key={batch.id} className="grid grid-cols-1 sm:grid-cols-12 gap-5 p-6 bg-gray-50/50 rounded-[32px] border border-gray-100 items-end shadow-sm">
                            <div className="sm:col-span-3 space-y-1">
                                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">{t('productForm.batchNo')}</label>
                                <input type="text" value={batch.batchNumber} onChange={e => handleBatchChange(index, 'batchNumber', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/10" />
                            </div>
                            <div className="sm:col-span-3 space-y-1">
                                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">{t('productForm.expiry')}</label>
                                <input type="date" value={batch.expiryDate} onChange={e => handleBatchChange(index, 'expiryDate', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/10" />
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">{t('productForm.qty')}</label>
                                <input type="number" value={batch.quantityInStock} onChange={e => handleBatchChange(index, 'quantityInStock', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/10" />
                            </div>
                            <div className="sm:col-span-3 space-y-1">
                                <label className="text-[9px] font-black uppercase text-gray-400 ml-1">{t('productForm.cost')}</label>
                                <input type="number" value={batch.costPrice} onChange={e => handleBatchChange(index, 'costPrice', e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary-500/10" step="0.01" />
                            </div>
                            <div className="sm:col-span-1 flex justify-end">
                                <button type="button" onClick={() => handleRemoveBatch(batch.id)} className="p-3 text-red-400 hover:bg-white hover:text-red-600 rounded-2xl transition-all shadow-sm active:scale-95">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 sm:px-12 py-8 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-5 bg-white shadow-[0_-10px_40px_-20px_rgba(0,0,0,0.1)]">
          <button type="submit" className="w-full sm:w-auto px-20 py-5 bg-primary-600 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-[24px] shadow-2xl hover:brightness-110 active:scale-95 transition-all">
            {initialData ? t('common.save') : t('common.add')} (Shift+Enter)
          </button>
          <button type="button" onClick={onClose} className="w-full sm:w-auto px-12 py-5 text-gray-400 font-black uppercase text-[11px] tracking-widest hover:bg-gray-50 rounded-[24px] transition-all">
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default MedicationFormModal;
