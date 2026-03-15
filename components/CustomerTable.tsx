
import React, { useState } from 'react';
import { Customer, GenericSortConfig, SortableCustomerKeys } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import UserGroupIcon from './UserGroupIcon';
import BellIcon from './icons/BellIcon';
import { useTranslations } from '../hooks/useTranslations';

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onNotify?: (customer: Customer) => void;
  onSort: (key: SortableCustomerKeys) => void;
  sortConfig: GenericSortConfig<SortableCustomerKeys> | null;
}

const ITEMS_PER_PAGE = 20;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableCustomerKeys; 
    onSort: (key: SortableCustomerKeys) => void; 
    sortConfig: GenericSortConfig<SortableCustomerKeys> | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:bg-gray-50 transition-all ${className}`}
        onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
            direction === 'ascending' ? 
            <ChevronUpIcon className="ml-2 w-3 h-3 text-primary-500" /> : 
            <ChevronDownIcon className="ml-2 w-3 h-3 text-primary-500" />
        )}
      </div>
    </th>
  );
};

const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onEdit, onDelete, onNotify, onSort, sortConfig }) => {
  const { t } = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  
  if (customers.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[40px] shadow-xl border border-gray-100">
        <UserGroupIcon className="mx-auto h-20 w-20 text-gray-100 mb-4" />
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{t('customerTable.noCustomersFound', 'কোন গ্রাহক পাওয়া যায়নি')}</h3>
        <p className="text-sm text-gray-400 mt-1 font-bold uppercase tracking-widest">{t('customerTable.getStarted', 'নতুন গ্রাহক নিবন্ধনের মাধ্যমে শুরু করুন')}</p>
      </div>
    );
  }

  // Pagination Logic
  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = customers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden transition-all flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-50">
          <thead className="bg-gray-50/50">
            <tr>
              <TableHeader label={t('customerForm.nameLabel')} sortKey="name" onSort={onSort} sortConfig={sortConfig} />
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{t('supplierForm.contactLabel', 'যোগাযোগ')}</th>
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              <TableHeader label={t('reports.customerTimeline.column.balance', 'মোট ব্যালেন্স')} sortKey="totalDueAmount" onSort={onSort} sortConfig={sortConfig} className="text-right" />
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {currentItems.map((customer) => (
              <tr key={customer.id} className="hover:bg-primary-50/30 transition-all group">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-primary-600 font-black text-lg group-hover:scale-110 transition-transform">
                        {customer.name.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{customer.name}</span>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-800 tracking-tight">{customer.phone || '—'}</span>
                    <span className="text-[10px] font-bold text-gray-400 lowercase">{customer.email || '—'}</span>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  {customer.totalDueAmount > 0 ? (
                    <span className="px-4 py-1.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded-full border border-red-100 tracking-widest">বকেয়া আছে</span>
                  ) : customer.totalDueAmount < 0 ? (
                    <span className="px-4 py-1.5 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-full border border-green-100 tracking-widest">অ্যাডভান্স</span>
                  ) : (
                    <span className="px-4 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-black uppercase rounded-full border border-gray-100 tracking-widest">পরিশোধিত</span>
                  )}
                </td>
                <td className={`px-6 py-5 whitespace-nowrap text-right ${customer.totalDueAmount > 0 ? 'text-red-600' : customer.totalDueAmount < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="text-lg font-black tracking-tighter">
                    {t('common.tk')} {Math.abs(customer.totalDueAmount).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-2">
                    {onNotify && (
                      <button onClick={() => onNotify(customer)} className="p-3 text-primary-500 hover:bg-white rounded-2xl shadow-sm transition-all active:scale-90 border border-transparent hover:border-primary-100" title="Send Alert">
                        <BellIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button onClick={() => onEdit(customer)} className="p-3 text-gray-400 hover:text-primary-600 hover:bg-white rounded-2xl shadow-sm transition-all active:scale-90 border border-transparent hover:border-primary-100" title="Edit">
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDelete(customer.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-white rounded-2xl shadow-sm transition-all active:scale-90 border border-transparent hover:border-red-100" title="Delete">
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      {customers.length > ITEMS_PER_PAGE && (
        <div className="shrink-0 py-4 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-gray-700">
                        Showing <span className="font-bold">{startIndex + 1}</span> to <span className="font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, customers.length)}</span> of <span className="font-bold">{customers.length}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <span className="sr-only">Previous</span>
                            <ChevronDownIcon className="h-4 w-4 rotate-90" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-xs font-black text-gray-700 uppercase tracking-widest">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <span className="sr-only">Next</span>
                            <ChevronUpIcon className="h-4 w-4 rotate-90" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTable;
