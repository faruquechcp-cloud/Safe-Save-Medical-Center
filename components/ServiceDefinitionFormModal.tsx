
import React, { useState, useEffect } from 'react';
import { ServiceItemDefinition } from '../types'; 
import { SERVICE_ITEM_CATEGORIES } from '../constants';
import Modal from './Modal';
import { useTranslations } from '../hooks/useTranslations';

interface ServiceDefinitionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (serviceDefinition: ServiceItemDefinition) => void;
  initialData?: ServiceItemDefinition | null;
  // Added missing zIndex property to support layered modals
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const defaultFormData: Omit<ServiceItemDefinition, 'id' | 'dateAdded'> = {
  name: '',
  category: SERVICE_ITEM_CATEGORIES[0] || '',
  price: 0,
  notes: '',
};

const ServiceDefinitionFormModal: React.FC<ServiceDefinitionFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, zIndex, onMinimize, isMinimized }) => {
  const { t } = useTranslations();
  const [formData, setFormData] = useState<Omit<ServiceItemDefinition, 'id' | 'dateAdded'>>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<ServiceItemDefinition, 'id' | 'dateAdded'>, string>>>({});

  const title = initialData ? t('serviceDefinitionForm.editTitle') : t('serviceDefinitionForm.addTitle');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const { id, dateAdded, ...dataToEdit } = initialData;
        setFormData(dataToEdit);
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number = value;
    if (name === 'price') { 
      processedValue = value === '' ? '' : parseFloat(value);
    }
    const formFieldName = name as keyof Omit<ServiceItemDefinition, 'id' | 'dateAdded'>;
    setFormData(prev => ({ ...prev, [formFieldName]: processedValue }));
    if (errors[formFieldName]) {
      setErrors(prev => ({...prev, [formFieldName]: undefined}));
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<ServiceItemDefinition, 'id'|'dateAdded'>, string>> = {};
    if (!formData.name.trim()) newErrors.name = t('serviceDefinitionForm.error.nameRequired', "Name is required");
    if (!formData.category.trim()) newErrors.category = t('serviceDefinitionForm.error.categoryRequired', "Category is required");
    
    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      newErrors.price = t('serviceDefinitionForm.error.priceNonNegative', "Price cannot be negative");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submittedServiceDefinition: ServiceItemDefinition = {
      id: initialData?.id || crypto.randomUUID(),
      name: formData.name.trim(),
      category: formData.category,
      price: Number(formData.price), 
      notes: formData.notes?.trim() || undefined,
      dateAdded: initialData?.dateAdded || new Date().toISOString(),
    };
    onSubmit(submittedServiceDefinition);
    onClose(); 
  };
  
  const renderInput = (
    formElementName: keyof Omit<ServiceItemDefinition, 'id' | 'dateAdded'>, 
    labelKey: string,
    htmlInputType: string = "text", 
    required: boolean = false, 
    options?: string[]
  ) => {
    const currentValue = formData[formElementName];
    const elementIdName = formElementName as string;
    const label = t(labelKey);

    return (
      <div className="space-y-3">
        <label htmlFor={elementIdName} className="block text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {htmlInputType === 'textarea' ? (
          <textarea
            id={elementIdName}
            name={elementIdName}
            value={String(currentValue ?? '')}
            onChange={handleChange}
            rows={4}
            placeholder="..."
            className={`w-full px-6 py-4 border ${errors[formElementName] ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none transition-all`}
          />
        ) : htmlInputType === 'select' && options ? (
          <select
            id={elementIdName}
            name={elementIdName}
            value={String(currentValue ?? '')}
            onChange={handleChange}
            className={`w-full px-6 py-4 border ${errors[formElementName] ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none transition-all`}
          >
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input
            type={htmlInputType}
            id={elementIdName}
            name={elementIdName}
            value={htmlInputType === 'number' ? (currentValue ?? '') : String(currentValue ?? '')}
            onChange={handleChange}
            step={htmlInputType === 'number' ? '0.01' : undefined}
            placeholder="..."
            className={`w-full px-6 py-4 border ${errors[formElementName] ? 'border-red-500' : 'border-gray-200'} rounded-2xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-[var(--color-primary-500)] outline-none transition-all`}
          />
        )}
        {errors[formElementName] && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{errors[formElementName]}</p>}
      </div>
    );
  };

  return (
    // Fixed: Added zIndex prop to Modal component
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" zIndex={zIndex} onMinimize={onMinimize} isMinimized={isMinimized}>
      <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white overflow-hidden">
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-10 sm:p-12 space-y-10 custom-scrollbar">
          {renderInput('name', 'serviceDefinitionForm.nameLabel', 'text', true)}
          {renderInput('category', 'serviceDefinitionForm.categoryLabel', 'select', true, SERVICE_ITEM_CATEGORIES)}
          {renderInput('price', 'serviceDefinitionForm.priceLabel', 'number', true)}
          {renderInput('notes', 'serviceDefinitionForm.notesLabel', 'textarea')}
        </div>
        
        {/* Sticky Footer */}
        <div className="shrink-0 p-8 sm:p-10 border-t border-gray-100 flex flex-col sm:flex-row-reverse gap-4 bg-white z-10">
          <button
            type="submit"
            className="w-full sm:w-auto px-16 py-5 text-[11px] font-black text-white bg-[var(--color-primary-600)] uppercase tracking-[0.2em] rounded-[24px] shadow-xl hover:brightness-110 active:scale-95 transition-all"
          >
            {initialData ? t('common.save') : t('header.addServiceDefinition')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-5 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 rounded-[24px] transition-all"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ServiceDefinitionFormModal;
