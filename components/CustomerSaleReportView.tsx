
import React, { useState, useMemo, useCallback } from 'react';
import { Customer, SaleInvoice, GenericSortConfig, SortableCustomerSaleReportKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import UsersIcon from './icons/UsersIcon';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';
import SearchableSelect from './SearchableSelect';

interface CustomerSaleReportViewProps {
  customers: Customer[];
  saleInvoices: SaleInvoice[];
  onViewInvoiceDetails: (invoice: SaleInvoice) => void;
  sortConfig: GenericSortConfig<SortableCustomerSaleReportKeys> | null;
  onSort: (key: SortableCustomerSaleReportKeys) => void;
}

type FilterDateRangeType = 'allTime' | 'today' | 'yesterday' | 'last7Days' | 'lastWeek' | 'last30Days' | 'lastMonth' | 'custom' | 'specificDate';

const TableHeader: React.FC<{ 
    label: string; 
    sortKey?: SortableCustomerSaleReportKeys; 
    onSort?: (key: SortableCustomerSaleReportKeys) => void; 
    sortConfig?: GenericSortConfig<SortableCustomerSaleReportKeys> | null;
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
        aria-sort={isSorted ? (direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
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

const CustomerSaleReportView: React.FC<CustomerSaleReportViewProps> = ({ 
  customers, saleInvoices, onViewInvoiceDetails, sortConfig, onSort 
}) => {
  const { appName, logoUrl } = useSettings();
  const { t } = useTranslations();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('all'); 
  const [filterDateRangeType, setFilterDateRangeType] = useState<FilterDateRangeType>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [specificDate, setSpecificDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const todayISO = new Date().toISOString().split('T')[0];

  const customerOptions = useMemo(() => {
    return [
        { id: 'all', label: t('reports.allCustomers', '-- All Customers --') },
        ...customers.map(c => ({ id: c.id, label: c.name, subLabel: c.phone }))
    ];
  }, [customers, t]);

  const getDateRange = useCallback(() => {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (filterDateRangeType) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;
      case 'yesterday':
        startDate = new Date(new Date().setDate(today.getDate() - 1));
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(new Date().setDate(today.getDate() - 1));
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'last7Days':
        endDate = new Date(today.setHours(23, 59, 59, 999));
        startDate = new Date(new Date().setDate(today.getDate() - 6));
        startDate.setHours(0,0,0,0);
        break;
      case 'lastWeek':
        const currentDay = today.getDay(); 
        const diffToLastSunday = currentDay === 0 ? 7 : currentDay; 
        const lastSunday = new Date(new Date().setDate(today.getDate() - diffToLastSunday));
        lastSunday.setHours(0,0,0,0);
        startDate = lastSunday;
        endDate = new Date(new Date(lastSunday).setDate(lastSunday.getDate() + 6));
        endDate.setHours(23,59,59,999);
        break;
      case 'last30Days':
        endDate = new Date(today.setHours(23, 59, 59, 999));
        startDate = new Date(new Date().setDate(today.getDate() - 29));
        startDate.setHours(0,0,0,0);
        break;
      case 'lastMonth':
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        startDate = new Date(currentYear, currentMonth - 1, 1);
        startDate.setHours(0,0,0,0);
        endDate = new Date(currentYear, currentMonth, 0); 
        endDate.setHours(23,59,59,999);
        break;
      case 'specificDate':
        if (specificDate) {
            const sDate = new Date(specificDate);
            startDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 0, 0, 0, 0);
            endDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 23, 59, 59, 999);
        }
        break;
      case 'custom':
        if (customStartDate) {
            const sDate = new Date(customStartDate); 
            startDate = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 0, 0, 0, 0);
        }
        if (customEndDate) {
            const eDate = new Date(customEndDate); 
            endDate = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59, 999);
        }
        break;
      case 'allTime':
      default:
        break;
    }
    return { startDate, endDate };
  }, [filterDateRangeType, customStartDate, customEndDate, specificDate]);

  const filteredSaleInvoices = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    
    return saleInvoices
      .filter(invoice => {
        if (selectedCustomerId !== 'all' && invoice.customerId !== selectedCustomerId) {
          return false;
        }
        if (!startDate || !endDate) return true; 
        
        const invoiceDate = new Date(invoice.date); 
        const normalizedInvoiceDate = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), invoiceDate.getDate());
        
        return normalizedInvoiceDate >= startDate && normalizedInvoiceDate <= endDate;
      });
  }, [selectedCustomerId, saleInvoices, getDateRange]);

  const sortedSaleInvoices = useMemo(() => {
    let sortableItems = [...filteredSaleInvoices];
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
  }, [filteredSaleInvoices, sortConfig]);

  const totalSalesForFilteredPeriod = useMemo(() => {
    return sortedSaleInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  }, [sortedSaleInvoices]);
  
  const selectedCustomerDetails = useMemo(() => {
    if (selectedCustomerId === 'all') return null;
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const FilterDateRangeButton: React.FC<{labelKey: string, type: FilterDateRangeType, activeType: FilterDateRangeType, onClick: (type: FilterDateRangeType) => void}> = 
    ({ labelKey, type, activeType, onClick }) => (
    <button
      onClick={() => onClick(type)}
      className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors
                  ${activeType === type 
                    ? 'bg-[var(--color-primary-600)] text-white shadow-md' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      {t(labelKey)}
    </button>
  );

  const handleFilterDateRangeChange = (type: FilterDateRangeType) => {
    setFilterDateRangeType(type);
     if (type !== 'custom') {
        setCustomStartDate('');
        setCustomEndDate('');
    }
  };
  
  const formatDateForDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA');
  };
  
  const handlePrint = () => { window.print(); };

  const getFilterPeriodText = () => {
    const { startDate, endDate } = getDateRange();
    if (filterDateRangeType === 'allTime') return t('reports.allTime', 'All Time');
    if (startDate && endDate) {
      if (filterDateRangeType === 'today') return `${t('reports.today', 'Today')} (${formatDateForDisplay(startDate.toISOString())})`;
      if (filterDateRangeType === 'yesterday') return `${t('reports.yesterday', 'Yesterday')} (${formatDateForDisplay(startDate.toISOString())})`;
      if (filterDateRangeType === 'specificDate') return `${t('reports.specificDate', 'Date')}: ${formatDateForDisplay(startDate.toISOString())}`;
      return `${t('reports.filterByDate', 'Period')}: ${formatDateForDisplay(startDate.toISOString())} - ${formatDateForDisplay(endDate.toISOString())}`;
    }
    return t('reports.filterByDate', 'Period: Not specified');
  };

  const dateRangeOptions = [
    { key: 'today', labelKey: 'reports.today' },
    { key: 'yesterday', labelKey: 'reports.yesterday' }, 
    { key: 'specificDate', labelKey: 'reports.specificDate' }, 
    { key: 'last7Days', labelKey: 'reports.last7Days' },
    { key: 'lastWeek', labelKey: 'reports.lastWeek' },
    { key: 'last30Days', labelKey: 'reports.last30Days' },
    { key: 'lastMonth', labelKey: 'reports.lastMonth' },
    { key: 'allTime', labelKey: 'reports.allTime' },
    { key: 'custom', labelKey: 'reports.customDateRange' }
  ] as {key: FilterDateRangeType, labelKey: string}[];


  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{t('reports.customerSaleReport', 'Customer Sale Report')}</h2>
        {sortedSaleInvoices.length > 0 && (
          <button onClick={handlePrint} className="mt-2 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-md shadow-sm">
            {t('reports.printButton', 'Print Report')}
          </button>
        )}
      </div>

      <div className="print:hidden mb-6 p-4 bg-gray-50 rounded-lg shadow-sm space-y-4">
        <div className="w-full sm:w-1/2 md:w-1/3">
          <SearchableSelect
            label={t('saleInvoiceForm.customerLabel', 'Customer')}
            options={customerOptions}
            selectedId={selectedCustomerId}
            onSelect={setSelectedCustomerId}
            placeholder={t('reports.selectCustomer', 'Select Customer')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.filterByDate', 'Filter by Date')}:</label>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {dateRangeOptions.map(opt => (
                 <FilterDateRangeButton 
                    key={opt.key}
                    labelKey={opt.labelKey} 
                    type={opt.key} 
                    activeType={filterDateRangeType} 
                    onClick={handleFilterDateRangeChange} 
                />
            ))}
          </div>
          
          {filterDateRangeType === 'specificDate' && (
            <div className="mt-3">
                <label htmlFor="specificDateInput" className="block text-xs font-medium text-gray-600 mb-0.5">{t('reports.selectDate', 'Select Date')}</label>
                <input 
                    type="date" 
                    id="specificDateInput" 
                    value={specificDate} 
                    onChange={e => setSpecificDate(e.target.value)} 
                    max={todayISO} 
                    className="block w-full sm:w-64 px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
                />
            </div>
          )}

          {filterDateRangeType === 'custom' && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="customStartDateCustSale" className="block text-xs font-medium text-gray-600 mb-0.5">Start Date</label>
                <input type="date" id="customStartDateCustSale" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} max={customEndDate || todayISO} className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-xs"/>
              </div>
              <div>
                <label htmlFor="customEndDateCustSale" className="block text-xs font-medium text-gray-600 mb-0.5">End Date</label>
                <input type="date" id="customEndDateCustSale" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} min={customStartDate} max={todayISO} className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-xs"/>
              </div>
              {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
                  <p className="col-span-full text-xs text-red-500 mt-1">Start date cannot be after end date.</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="print-area">
        <div className="hidden print:block mb-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="print-header-logo"/>}
          <div className="print-report-title">{appName} - {t('reports.customerSaleReport', 'Customer Sale Report')}</div>
          <div className="print-report-subtitle">
            {selectedCustomerDetails ? `${t('saleInvoiceForm.customerLabel', 'Customer')}: ${selectedCustomerDetails.name}` : t('reports.allCustomers', 'All Customers')}
            <br />
            {getFilterPeriodText()}
          </div>
        </div>

        {sortedSaleInvoices.length > 0 ? (
          <>
            <div className="mb-4 p-4 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-md print:border-gray-300 print:bg-gray-50 flex flex-wrap justify-between items-center gap-4">
              <div className="text-sm text-[var(--color-primary-700)] print:text-gray-800">
                <span className="font-semibold block sm:inline">
                  {selectedCustomerDetails ? selectedCustomerDetails.name : t('reports.allCustomers', 'All Customers')}
                </span>
                <span className="hidden sm:inline"> - </span>
                <span>{t('reports.totalSales', 'Total Sales')}: </span>
                <span className="font-bold text-lg ml-1">Tk. {totalSalesForFilteredPeriod.toFixed(2)}</span>
              </div>
              <div className="text-sm text-[var(--color-primary-600)] font-medium">
                 {t('reports.totalInvoices', 'Total Invoices')}: <span className="font-bold">{sortedSaleInvoices.length}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHeader label={t('saleInvoiceForm.invoiceNumberLabel', "Invoice #")} sortKey="invoiceNumber" onSort={onSort} sortConfig={sortConfig} />
                    <TableHeader label={t('saleInvoiceForm.dateLabel', "Date")} sortKey="date" onSort={onSort} sortConfig={sortConfig} />
                    {selectedCustomerId === 'all' && <TableHeader label={t('saleInvoiceForm.customerLabel', "Customer")} sortKey="customerName" onSort={onSort} sortConfig={sortConfig} />}
                    
                    {/* New Items Summary Column */}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3">
                        {t('reports.itemsSummary', "Item Details")}
                    </th>

                    <TableHeader label={t('saleInvoiceForm.summary.netPayable', "Total Amount")} sortKey="totalAmount" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider print:hidden">{t('serviceDefinitionList.actions', "Actions")}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedSaleInvoices.map(invoice => {
                    // Generate item summary string using multiplication symbol
                    const itemSummary = invoice.items.map(i => `${i.medicationName} ×${i.quantity}`).join(', ');
                    
                    return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-600 font-medium">{invoice.invoiceNumber}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{formatDateForDisplay(invoice.date)}</td>
                        {selectedCustomerId === 'all' && <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{invoice.customerName || t('reports.walkInCustomer', 'Walk-in Customer')}</td>}
                        
                        {/* Display Item Summary with truncation for very long lists */}
                        <td className="px-4 py-2 text-xs text-gray-600">
                            <div className="line-clamp-2" title={itemSummary}>
                                {itemSummary}
                            </div>
                        </td>

                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 font-bold text-right">Tk. {invoice.totalAmount.toFixed(2)}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm print:hidden">
                            <button 
                            onClick={() => onViewInvoiceDetails(invoice)}
                            className="text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)] font-medium"
                            >
                            {t('edit', "View Details")}
                            </button>
                        </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="text-center py-10">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('reports.noSalesForCustomer', 'No sales found')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedCustomerId === 'all'
                ? t('reports.noSalesForCustomer', 'No sales found for the selected period.')
                : t('reports.noSalesForCustomer', 'No sales found for {customerName} in this period.', { customerName: selectedCustomerDetails?.name || 'the selected customer' })}
            </p>
          </div>
        )}
        <div className="hidden print:block print-footer-info mt-8">
            Printed on: {new Date().toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default CustomerSaleReportView;
