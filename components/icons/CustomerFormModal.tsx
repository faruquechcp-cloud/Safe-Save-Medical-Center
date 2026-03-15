
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import Modal from '../Modal'; // Corrected path

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Customer) => void;
  initialData?: Customer | null;
  title: string;
}

// Fix: Added missing openingBalance and address to match Omit<Customer, 'id' | 'totalDueAmount' | 'dateAdded'>
const defaultFormData: Omit<Customer, 'id' | 'totalDueAmount' | 'dateAdded'> = {
  name: '',
  phone: '',
  email: '',
  address: '',
  openingBalance: 0,
};

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, title }) => {
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'totalDueAmount'| 'dateAdded'>>(defaultFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<Customer, 'id' | 'totalDueAmount'| 'dateAdded'>, string>>>({});

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, totalDueAmount, dateAdded, ...dataToEdit } = initialData;
      setFormData(dataToEdit);
    } else {
      setFormData(defaultFormData);
    }
    setErrors({});
  }, [isOpen, initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof formData]) {
      setErrors(prev => ({...prev, [name as keyof typeof formData]: undefined}));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.name.trim()) newErrors.name = "Customer name is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const submittedCustomer: Customer = {
      id: initialData?.id || crypto.randomUUID(),
      ...formData,
      totalDueAmount: initialData?.totalDueAmount || 0, 
      dateAdded: initialData?.dateAdded || new Date().toISOString(),
    };
    onSubmit(submittedCustomer);
    onClose(); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm`}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm`}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)] transition-colors"
          >
            {initialData ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerFormModal;
