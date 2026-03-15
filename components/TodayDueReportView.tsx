import React, { useState, useMemo } from 'react';
import { Customer, SaleInvoice, GenericSortConfig, SortableCustomerDueReportKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import SearchIcon from './icons/SearchIcon';
import { useSettings } from '../contexts/SettingsContext'; 
import { exportToCSV } from '../utils/exportUtils';
import { useTranslations } from '../hooks/useTranslations';

interface TodayDueReportViewProps {
  customers: Customer[];
  saleInvoices: SaleInvoice[];
  onViewInvoiceDetails: (invoice: SaleInvoice) => void;
  sortConfig: GenericSortConfig<SortableCustomerDueReportKeys> | null;
  onSort: (key: SortableCustomerDueReportKeys) => void;
}

const ITEMS_PER_PAGE = 15;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey?: SortableCustomerDueReportKeys; 
    onSort?: (key: SortableCustomerDueReportKeys) => void; 
    sortConfig?: GenericSortConfig<SortableCustomerDueReportKeys> | null;
    className?: string;
    disableSort?: boolean;
}> = ({ label, sortKey, onSort, sortConfig, className = "", disableSort = false }) => {
  const isSorted = sortKey && sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider ${!disableSort ? 'cursor-pointer hover:bg-gray-100' : ''} ${className}`}
        onClick={() => !disableSort && sortKey && onSort && onSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {!disableSort && isSorted && (
            direction === 'ascending' ? 
            <ChevronUpIcon className="ml-1 w-3 h-3 text-gray-500" /> : 
            <ChevronDownIcon className="ml-1 w-3 h-3 text-gray-500" />
        )}
      </div>
    </th>
  );
};

const TodayDueReportView: React.FC<TodayDueReportViewProps> = ({ saleInvoices, onViewInvoiceDetails, sortConfig, onSort }) => {
  const { appName, logoUrl } = useSettings();
  const { t } = useTranslations();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const todayInvoicesWithDue = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    let invoices = saleInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        return invoiceDate >= today && invoiceDate <= endOfToday && invoice.amountDue > 0;
    });

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        invoices = invoices.filter(inv => 
            inv.invoiceNumber.toLowerCase().includes(lowerTerm) || 
            (inv.customerName || '').toLowerCase().includes(lowerTerm)
        );
    }

    return invoices;
  }, [saleInvoices, searchTerm]);

  const sortedInvoices = useMemo(() => {
    let sortableItems = [...todayInvoicesWithDue];
    if (sortConfig) {
        sortableItems.sort((a,b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            let comparison = 0;
            if (sortConfig.key === 'date') comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
            else if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
            else comparison = String(valA ?? '').localeCompare(String(valB ?? ''));
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    } else { 
        sortableItems.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return sortableItems;
  }, [todayInvoicesWithDue, sortConfig]);

  const totalPages = Math.ceil(sortedInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentInvoices = sortedInvoices.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const totalDueAmount = useMemo(() => {
    return sortedInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  }, [sortedInvoices]);

  const handleExportCSV = () => {
    const data = sortedInvoices.map(inv => ({
        'Invoice #': inv.invoiceNumber,
        'Date': inv.date,
        'Customer': inv.customerName || 'Walk-in Customer',
        'Total Amount': inv.totalAmount,
        'Amount Paid': inv.amountPaid,
        'Amount Due': inv.amountDue
    }));
    exportToCSV(data, `Today_Due_Report`);
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{t('reports.todayDueReport', "Today's Due Report")}</h2>
        <div className="flex space-x-2">
            {sortedInvoices.length > 0 && (
                <button
                    onClick={handleExportCSV}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" /> {t('common.export', 'Export')}
                </button>
            )}
            {sortedInvoices.length > 0 && (
                <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-md shadow-sm transition-colors"
                >
                {t('reports.printButton', 'Print Report')}
                </button>
            )}
        </div>
      </div>

      <div className="print:hidden mb-6 p-4 bg-gray-50 rounded-lg shadow-sm space-y-4">
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={t('common.searchInvoice', "Search invoice number or customer...")}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm"
            />
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
            <span>{t('dashboard.todayDue', "Today's Total Due")}:</span>
            <span className="font-bold text-red-600">{t('common.tk', 'Tk.')} {totalDueAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="print-area">
        <div className="hidden print:block mb-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="print-header-logo"/>}
          <div className="print-report-title">{appName} - {t('reports.todayDueReport', "Today's Due Report")}</div>
          <div className="print-report-subtitle">
            {t('reports.today', 'Today')}: {new Date().toLocaleDateString()}
          </div>
        </div>

        {sortedInvoices.length > 0 ? (
            <div className="flex flex-col min-h-[400px]">
                <div className="overflow-x-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200 border rounded-md">
                    <thead className="bg-gray-50">
                        <tr>
                        <TableHeader label="Invoice #" sortKey="invoiceNumber" onSort={onSort} sortConfig={sortConfig} />
                        <TableHeader label="Customer" sortKey="customerName" onSort={onSort} sortConfig={sortConfig} />
                        <TableHeader label="Total Amount" sortKey="totalAmount" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount Paid</th>
                        <TableHeader label="Amount Due" sortKey="amountDue" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider print:hidden">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentInvoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{invoice.invoiceNumber}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{invoice.customerName || 'Walk-in Customer'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">{t('common.tk', 'Tk.')} {invoice.totalAmount.toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 text-right">{t('common.tk', 'Tk.')} {invoice.amountPaid.toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-semibold text-right">{t('common.tk', 'Tk.')} {invoice.amountDue.toFixed(2)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm print:hidden">
                            <button 
                                onClick={() => onViewInvoiceDetails(invoice)}
                                className="text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)] font-medium"
                            >
                                View Items
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>

                {sortedInvoices.length > ITEMS_PER_PAGE && (
                    <div className="shrink-0 py-3 px-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-lg print:hidden">
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
                            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="text-center py-10">
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No due invoices found for today.
                </h3>
            </div>
        )}
      </div>
    </div>
  );
};

export default TodayDueReportView;
