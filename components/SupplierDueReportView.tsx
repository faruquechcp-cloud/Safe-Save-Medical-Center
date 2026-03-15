
import React, { useState, useMemo, useCallback } from 'react';
import { Supplier, PurchaseInvoice, GenericSortConfig, SortableSupplierDueReportKeys } from '../types';
import BuildingStorefrontIcon from './icons/BuildingStorefrontIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import { useSettings } from '../contexts/SettingsContext'; 
import { exportToCSV } from '../utils/exportUtils';
import SearchableSelect from './SearchableSelect';
import { useTranslations } from '../hooks/useTranslations';

interface SupplierDueReportViewProps {
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[];
  onViewInvoiceDetails: (invoice: PurchaseInvoice) => void;
  sortConfig: GenericSortConfig<SortableSupplierDueReportKeys> | null;
  onSort: (key: SortableSupplierDueReportKeys) => void;
}

type FilterType = 'all' | 'today' | 'last7days' | 'last30days' | 'custom';

const TableHeader: React.FC<{
    label: string;
    sortKey: SortableSupplierDueReportKeys;
    onSort: (key: SortableSupplierDueReportKeys) => void;
    sortConfig: GenericSortConfig<SortableSupplierDueReportKeys> | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th
        scope="col"
        className={`px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
        onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
            direction === 'ascending' ?
            <ChevronUpIcon className="ml-1 w-3 h-3 text-gray-500" /> :
            <ChevronDownIcon className="ml-1 w-3 h-3 text-gray-500" />
        )}
      </div>
    </th>
  );
};

const SupplierDueReportView: React.FC<SupplierDueReportViewProps> = ({ suppliers, purchaseInvoices, onViewInvoiceDetails, sortConfig, onSort }) => {
  const { appName, logoUrl } = useSettings();
  const { t } = useTranslations();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const todayISO = new Date().toISOString().split('T')[0];

  const getDateRange = useCallback(() => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (filterType) {
      case 'today':
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setUTCHours(23, 59, 59, 999);
        break;
      case 'last7days':
        endDate = new Date(today);
        endDate.setUTCHours(23, 59, 59, 999);
        startDate = new Date(today);
        startDate.setUTCDate(today.getUTCDate() - 6);
        startDate.setUTCHours(0,0,0,0);
        break;
      case 'last30days':
        endDate = new Date(today);
        endDate.setUTCHours(23, 59, 59, 999);
        startDate = new Date(today);
        startDate.setUTCDate(today.getUTCDate() - 29);
        startDate.setUTCHours(0,0,0,0);
        break;
      case 'custom':
         if (customStartDate) {
            const sDate = new Date(customStartDate);
            startDate = new Date(Date.UTC(sDate.getFullYear(), sDate.getMonth(), sDate.getDate()));
            startDate.setUTCHours(0,0,0,0);
        }
        if (customEndDate) {
            const eDate = new Date(customEndDate);
            endDate = new Date(Date.UTC(eDate.getFullYear(), eDate.getMonth(), eDate.getDate()));
            endDate.setUTCHours(23, 59, 59, 999);
        }
        break;
      case 'all':
      default:
        break;
    }
    return { startDate, endDate };
  }, [filterType, customStartDate, customEndDate]);

  const dueInvoices = useMemo(() => {
    if (!selectedSupplierId) return [];

    const { startDate, endDate } = getDateRange();

    return purchaseInvoices
      .filter(invoice => invoice.supplierId === selectedSupplierId && invoice.amountDue > 0)
      .filter(invoice => {
        if (filterType === 'all' || !startDate || !endDate) return true;
        const invoiceDate = new Date(invoice.date);
        const invoiceUTCDate = new Date(Date.UTC(invoiceDate.getUTCFullYear(), invoiceDate.getUTCMonth(), invoiceDate.getUTCDate()));
        return invoiceUTCDate >= startDate && invoiceUTCDate <= endDate;
      });
  }, [selectedSupplierId, purchaseInvoices, filterType, getDateRange]);

  const sortedDueInvoices = useMemo(() => {
    let sortableItems = [...dueInvoices];
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
  }, [dueInvoices, sortConfig]);

  const totalOwedForFilteredInvoices = useMemo(() => {
    return sortedDueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  }, [sortedDueInvoices]);

  const selectedSupplierDetails = useMemo(() => {
    return suppliers.find(s => s.id === selectedSupplierId);
  }, [suppliers, selectedSupplierId]);

  const supplierOptions = useMemo(() => {
      return suppliers.map(s => ({
          id: s.id,
          label: s.name,
          subLabel: s.contact || ''
      })).sort((a, b) => a.label.localeCompare(b.label, 'bn'));
  }, [suppliers]);

  const handleExportCSV = () => {
    if (!selectedSupplierDetails) return;
    const data = sortedDueInvoices.map(inv => ({
        'Invoice #': inv.invoiceNumber,
        'Date': inv.date,
        'Total Amount': inv.totalAmount,
        'Amount Paid': inv.amountPaid,
        'Amount Owed': inv.amountDue
    }));
    exportToCSV(data, `Supplier_Due_${selectedSupplierDetails.name.replace(/\s/g, '_')}`);
  };

  const FilterButton: React.FC<{label: string, type: FilterType, activeType: FilterType, onClick: (type: FilterType) => void}> =
    ({ label, type, activeType, onClick }) => (
      <button
        onClick={() => onClick(type)}
        className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors
                    ${activeType === type
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
      >
        {label}
      </button>
    );

  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
     if (type !== 'custom') {
        setCustomStartDate('');
        setCustomEndDate('');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  const handlePrint = () => {
    window.print();
  };

  const getFilterPeriodText = () => {
    const { startDate, endDate } = getDateRange();
    if (filterType === 'all') return 'Period: All Time';
    if (startDate && endDate) {
      if (filterType === 'today') return `Period: Today (${formatDate(startDate.toISOString())})`;
      return `Period: ${formatDate(startDate.toISOString())} - ${formatDate(endDate.toISOString())}`;
    }
    return 'Period: Not specified';
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">Supplier Due Report</h2>
        <div className="flex space-x-2">
          {selectedSupplierId && sortedDueInvoices.length > 0 && (
            <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
            >
                <ArrowUpTrayIcon className="w-4 h-4 mr-2" /> Export
            </button>
          )}
          {selectedSupplierId && sortedDueInvoices.length > 0 && (
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm transition-colors"
            >
              Print Report
            </button>
          )}
        </div>
      </div>

      <div className="print:hidden mb-6 p-4 bg-gray-50 rounded-lg shadow-sm space-y-4">
        <div className="w-full sm:w-1/2 md:w-1/3">
          <SearchableSelect 
            label={t('purchaseInvoiceForm.supplierLabel', 'Select Supplier')}
            options={supplierOptions}
            selectedId={selectedSupplierId}
            onSelect={setSelectedSupplierId}
            placeholder={t('purchaseInvoiceForm.selectSupplierPlaceholder', 'Search supplier name or contact...')}
          />
        </div>

        {selectedSupplierId && (
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              <span className="text-sm font-medium text-gray-700">Filter Invoices By:</span>
              <FilterButton label="All Time" type="all" activeType={filterType} onClick={handleFilterChange} />
              <FilterButton label="Today" type="today" activeType={filterType} onClick={handleFilterChange} />
              <FilterButton label="Last 7 Days" type="last7days" activeType={filterType} onClick={handleFilterChange} />
              <FilterButton label="Last 30 Days" type="last30days" activeType={filterType} onClick={handleFilterChange} />
              <FilterButton label="Custom" type="custom" activeType={filterType} onClick={handleFilterChange} />
            </div>
            {filterType === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customStartDateSupDue" className="block text-xs font-medium text-gray-600 mb-0.5">Start Date</label>
                  <input type="date" id="customStartDateSupDue" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} max={customEndDate || todayISO} className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-xs focus:ring-primary-500 focus:border-primary-500"/>
                </div>
                <div>
                  <label htmlFor="customEndDateSupDue" className="block text-xs font-medium text-gray-600 mb-0.5">End Date</label>
                  <input type="date" id="customEndDateSupDue" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} min={customStartDate} max={todayISO} className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-xs focus:ring-primary-500 focus:border-primary-500"/>
                </div>
                 {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
                    <p className="col-span-full text-xs text-red-500 mt-1">Start date cannot be after end date.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Printable Area Starts */}
      <div className="print-area">
        {/* Print Header */}
        <div className="hidden print:block mb-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="print-header-logo"/>}
          <div className="print-report-title">{appName} - Supplier Due Report</div>
          {selectedSupplierDetails && (
            <div className="print-report-subtitle">
              For Supplier: {selectedSupplierDetails.name} <br/>
              {getFilterPeriodText()}
            </div>
          )}
        </div>

        {selectedSupplierId ? (
          sortedDueInvoices.length > 0 ? (
            <>
              <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-md print:border-gray-300 print:bg-gray-50">
                <p className="text-sm text-primary-700 print:text-gray-800">
                  <span className="font-semibold">{selectedSupplierDetails?.name}</span> - Total Owed (Filtered Period):
                  <span className="font-bold text-lg ml-2">Tk. {totalOwedForFilteredInvoices.toFixed(2)}</span>
                </p>
                <p className="text-xs text-primary-600 print:text-gray-600">
                  Overall Total Owed (All Time): Tk. {selectedSupplierDetails?.totalAmountOwed.toFixed(2)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border rounded-md">
                  <thead className="bg-gray-50">
                    <tr>
                      <TableHeader label="Invoice #" sortKey="invoiceNumber" onSort={onSort} sortConfig={sortConfig} />
                      <TableHeader label="Date" sortKey="date" onSort={onSort} sortConfig={sortConfig} />
                      <TableHeader label="Total Amount" sortKey="totalAmount" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount Paid</th>
                      <TableHeader label="Amount Owed" sortKey="amountDue" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider print:hidden">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedDueInvoices.map(invoice => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDate(invoice.date)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">Tk. {invoice.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 text-right">Tk. {invoice.amountPaid.toFixed(2)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600 font-semibold text-right">Tk. {invoice.amountDue.toFixed(2)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm print:hidden">
                          <button
                            onClick={() => onViewInvoiceDetails(invoice)}
                            className="text-primary-600 hover:text-primary-800 font-medium"
                          >
                            View Items
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Due Invoices</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedSupplierDetails?.name || 'This supplier'} has no due invoices for the selected period, or all invoices are fully paid.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-10 print:hidden">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Select a Supplier</h3>
            <p className="mt-1 text-sm text-gray-500">Please select a supplier to view their due report.</p>
          </div>
        )}
        {/* Print Footer */}
        <div className="hidden print:block print-footer-info mt-8">
            Printed on: {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString()}
        </div>
      </div> {/* End Print Area */}
    </div>
  );
};

export default SupplierDueReportView;
