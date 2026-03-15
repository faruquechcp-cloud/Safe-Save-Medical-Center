
import React, { useState } from 'react';
import { Supplier, GenericSortConfig, SortableSupplierKeys } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import TruckIcon from './icons/TruckIcon';
import { useTranslations } from '../hooks/useTranslations';

interface SupplierTableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: string) => void;
  onSort: (key: SortableSupplierKeys) => void;
  sortConfig: GenericSortConfig<SortableSupplierKeys> | null;
}

const ITEMS_PER_PAGE = 20;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableSupplierKeys; 
    onSort: (key: SortableSupplierKeys) => void; 
    sortConfig: GenericSortConfig<SortableSupplierKeys> | null;
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

const SupplierTable: React.FC<SupplierTableProps> = ({ suppliers, onEdit, onDelete, onSort, sortConfig }) => {
  const { t } = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);

  if (suppliers.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-[40px] shadow-xl border border-gray-100">
        <TruckIcon className="mx-auto h-20 w-20 text-gray-100 mb-4" />
        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No suppliers found</h3>
        <p className="text-sm text-gray-400 mt-1 font-bold uppercase tracking-widest">Get started by adding a new vendor partner.</p>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA');
  };

  // Pagination Logic
  const totalPages = Math.ceil(suppliers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = suppliers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
              <TableHeader label={t('supplierForm.nameLabel')} sortKey="name" onSort={onSort} sortConfig={sortConfig} />
              <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">{t('supplierForm.contactLabel')}</th>
              <TableHeader label={t('purchaseInvoiceForm.summary.amountDue')} sortKey="totalAmountOwed" onSort={onSort} sortConfig={sortConfig} className="text-right" />
              <TableHeader label={t('reports.customerTimeline.column.date')} sortKey="dateAdded" onSort={onSort} sortConfig={sortConfig} />
              <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {currentItems.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-primary-50/30 transition-all group">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-primary-600 font-black text-lg group-hover:scale-110 transition-transform">
                        {supplier.name.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{supplier.name}</span>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-800 tracking-tight">{supplier.contact || '—'}</span>
                    <span className="text-[10px] font-bold text-gray-400 lowercase">{supplier.email || '—'}</span>
                  </div>
                </td>
                <td className={`px-6 py-5 whitespace-nowrap text-right ${supplier.totalAmountOwed > 0 ? 'text-primary-600' : 'text-gray-400'}`}>
                  <span className="text-lg font-black tracking-tighter">
                    {t('common.tk')} {supplier.totalAmountOwed.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-xs font-bold text-gray-400">
                    {formatDate(supplier.dateAdded)}
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => onEdit(supplier)} className="p-3 text-gray-400 hover:text-primary-600 hover:bg-white rounded-2xl shadow-sm transition-all active:scale-90 border border-transparent hover:border-primary-100" title="Edit">
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => onDelete(supplier.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-white rounded-2xl shadow-sm transition-all active:scale-90 border border-transparent hover:border-red-100" title="Delete">
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
      {suppliers.length > ITEMS_PER_PAGE && (
        <div className="shrink-0 py-4 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50">
            <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-gray-700">
                        Showing <span className="font-bold">{startIndex + 1}</span> to <span className="font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, suppliers.length)}</span> of <span className="font-bold">{suppliers.length}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                            <span className="sr-only">Previous</span>
                            <ChevronDownIcon className="h-4 w-4 rotate-90" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-xs font-black text-gray-700 uppercase tracking-widest">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
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

export default SupplierTable;
