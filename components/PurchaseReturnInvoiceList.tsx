
import React, { useState } from 'react';
import { PurchaseReturnInvoice, GenericSortConfig, SortablePurchaseReturnInvoiceKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ArrowUturnLeftIcon from './icons/ArrowUturnLeftIcon';
import { useTranslations } from '../hooks/useTranslations';
import EditIcon from './icons/EditIcon';

interface PurchaseReturnInvoiceListProps {
  invoices: PurchaseReturnInvoice[];
  onViewDetails: (invoice: PurchaseReturnInvoice) => void; 
  onEdit: (invoice: PurchaseReturnInvoice) => void;
  onSort: (key: SortablePurchaseReturnInvoiceKeys) => void;
  sortConfig: GenericSortConfig<SortablePurchaseReturnInvoiceKeys> | null;
}

const ITEMS_PER_PAGE = 20;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortablePurchaseReturnInvoiceKeys; 
    onSort: (key: SortablePurchaseReturnInvoiceKeys) => void; 
    sortConfig: GenericSortConfig<SortablePurchaseReturnInvoiceKeys> | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-4 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 ${className}`}
        onClick={() => onSort(sortKey)}
        aria-sort={isSorted ? (direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
            direction === 'ascending' ? 
            <ChevronUpIcon className="ml-1 w-4 h-4 text-gray-600" /> : 
            <ChevronDownIcon className="ml-1 w-4 h-4 text-gray-600" />
        )}
      </div>
    </th>
  );
};

const PurchaseReturnInvoiceList: React.FC<PurchaseReturnInvoiceListProps> = ({ invoices, onViewDetails, onEdit, onSort, sortConfig }) => {
  const { t } = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow">
        <ArrowUturnLeftIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('purchaseReturnInvoiceList.noPurchaseReturns', 'No purchase returns found.')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('purchaseReturnInvoiceList.getStarted', 'Create a new purchase return to get started.')}</p>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Pagination Logic
  const totalPages = Math.ceil(invoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = invoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="shadow-lg rounded-lg bg-white flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <TableHeader label={t('purchaseReturnInvoiceForm.returnInvoiceNumberLabel', "Return Invoice #")} sortKey="returnInvoiceNumber" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader label={t('saleInvoiceForm.dateLabel', "Date")} sortKey="date" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader label={t('purchaseInvoiceForm.supplierLabel', "Supplier")} sortKey="supplierName" onSort={onSort} sortConfig={sortConfig} />
              <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">{t('saleInvoiceForm.itemsTitle', "Items")}</th>
              <TableHeader label={t('purchaseReturnInvoiceForm.summary.totalCredit', "Total Credit")} sortKey="totalCreditAmount" onSort={onSort} sortConfig={sortConfig} className="text-right"/>
              <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">{t('serviceDefinitionList.actions', "Actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{invoice.returnInvoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(invoice.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{invoice.supplierName || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-center">{invoice.items.length}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-right">Tk. {invoice.totalCreditAmount.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm whitespace-nowrap">
                   <div className="flex space-x-3">
                    <button
                        onClick={() => onViewDetails(invoice)}
                        className="text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)] font-medium"
                        title={t('edit', "View Details")}
                    >
                        {t('edit', "Details")}
                    </button>
                    <button
                        onClick={() => onEdit(invoice)}
                        className="text-amber-600 hover:text-amber-800 transition-colors"
                        title="Edit Return"
                    >
                        <EditIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {invoices.length > ITEMS_PER_PAGE && (
        <div className="shrink-0 py-3 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-gray-700">
                        Showing <span className="font-bold">{startIndex + 1}</span> to <span className="font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, invoices.length)}</span> of <span className="font-bold">{invoices.length}</span> results
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

export default PurchaseReturnInvoiceList;
