
import React, { useState } from 'react';
import { ServiceInvoice, GenericSortConfig, SortableServiceInvoiceKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ReceiptIcon from './icons/ReceiptIcon'; 
import { useTranslations } from '../hooks/useTranslations';
import EditIcon from './icons/EditIcon';

interface ServiceInvoiceListProps {
  invoices: ServiceInvoice[];
  onViewDetails: (invoice: ServiceInvoice) => void; 
  onEdit: (invoice: ServiceInvoice) => void;
  onSort: (key: SortableServiceInvoiceKeys) => void;
  sortConfig: GenericSortConfig<SortableServiceInvoiceKeys> | null;
}

const ITEMS_PER_PAGE = 20;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableServiceInvoiceKeys; 
    onSort: (key: SortableServiceInvoiceKeys) => void; 
    sortConfig: GenericSortConfig<SortableServiceInvoiceKeys> | null;
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

const ServiceInvoiceList: React.FC<ServiceInvoiceListProps> = ({ invoices, onViewDetails, onEdit, onSort, sortConfig }) => {
  const { t } = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow">
        <ReceiptIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('serviceInvoiceList.noInvoices', "No service invoices found")}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('serviceInvoiceList.getStarted', "Get started by creating a new service invoice.")}</p>
      </div>
    );
  }

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
              <TableHeader label={t('saleInvoiceForm.invoiceNumberLabel', "Invoice #")} sortKey="invoiceNumber" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader label={t('saleInvoiceForm.dateLabel', "Date")} sortKey="date" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader label={t('saleInvoiceForm.customerLabel', "Customer")} sortKey="customerName" onSort={onSort} sortConfig={sortConfig} />
              <th scope="col" className="px-4 py-3.5 text-center text-sm font-semibold text-gray-900">{t('saleInvoiceForm.itemsTitle', "Items")}</th>
              <TableHeader label={t('saleInvoiceForm.summary.netPayable', "Total Amount")} sortKey="totalAmount" onSort={onSort} sortConfig={sortConfig} className="text-right"/>
              <TableHeader label={t('saleInvoiceForm.summary.amountDue', "Amount Due")} sortKey="amountDue" onSort={onSort} sortConfig={sortConfig} className="text-right"/>
              <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900">{t('serviceDefinitionList.actions', "Actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{invoice.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(invoice.date).toLocaleDateString('en-CA')}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{invoice.customerName || 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-center">{invoice.items.length}</td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-right">Tk. {invoice.totalAmount.toFixed(2)}</td>
                <td className={`px-4 py-3 text-sm whitespace-nowrap text-right ${invoice.amountDue > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                    Tk. {invoice.amountDue.toFixed(2)}
                </td>
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
                        title="Edit Invoice"
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

export default ServiceInvoiceList;
