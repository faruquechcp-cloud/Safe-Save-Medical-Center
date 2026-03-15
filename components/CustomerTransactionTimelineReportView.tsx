
import React, { useState, useMemo, useCallback } from 'react';
import { 
  Customer, SaleInvoice, CashTransaction, SaleReturnInvoice,
  CustomerTransactionTimelineEntry, GenericSortConfig, SortableCustomerTransactionTimelineKeys 
} from '../types'; 
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import UsersIcon from './icons/UsersIcon';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';
import SearchableSelect from './SearchableSelect';

interface CustomerTransactionTimelineReportViewProps {
  customers: Customer[];
  saleInvoices: SaleInvoice[];
  cashTransactions: CashTransaction[];
  saleReturnInvoices: SaleReturnInvoice[];
  onViewInvoiceDetails: (invoice: SaleInvoice | SaleReturnInvoice) => void; 
  sortConfig: GenericSortConfig<SortableCustomerTransactionTimelineKeys> | null;
  onSort: (key: SortableCustomerTransactionTimelineKeys) => void;
}

type FilterDateRangeType = 'allTime' | 'today' | 'last7Days' | 'lastWeek' | 'last30Days' | 'lastMonth' | 'custom';

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableCustomerTransactionTimelineKeys; 
    onSort: (key: SortableCustomerTransactionTimelineKeys) => void; 
    sortConfig: GenericSortConfig<SortableCustomerTransactionTimelineKeys> | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
        onClick={() => onSort(sortKey)}
        aria-sort={isSorted ? (direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
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

const CustomerTransactionTimelineReportView: React.FC<CustomerTransactionTimelineReportViewProps> = ({ 
  customers, saleInvoices, cashTransactions, saleReturnInvoices, sortConfig, onSort 
}) => {
  const { appName, logoUrl } = useSettings();
  const { t } = useTranslations();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [filterDateRangeType, setFilterDateRangeType] = useState<FilterDateRangeType>('allTime');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  
  const todayISO = new Date().toISOString().split('T')[0];

  const customerOptions = useMemo(() => {
    return customers.map(c => ({ 
      id: c.id, 
      label: c.name, 
      subLabel: c.phone 
    }));
  }, [customers]);

  const getDateRange = useCallback(() => {
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (filterDateRangeType) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;
      case 'last7Days':
        endDate = new Date(new Date().setHours(23, 59, 59, 999)); 
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
        endDate = new Date(new Date().setHours(23, 59, 59, 999));
        startDate = new Date(new Date().setDate(today.getDate() - 29));
        startDate.setHours(0,0,0,0);
        break;
      case 'lastMonth':
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        startDate = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
        endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
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
  }, [filterDateRangeType, customStartDate, customEndDate]);

  const transactionTimeline = useMemo(() => {
    if (!selectedCustomerId) return [];
    
    const entries: CustomerTransactionTimelineEntry[] = [];
    const { startDate: filterStart, endDate: filterEnd } = getDateRange();

    // Process Sale Invoices
    saleInvoices
      .filter(inv => inv.customerId === selectedCustomerId)
      .forEach(inv => {
        const invoiceDate = new Date(inv.date);
        const entryTimestamp = invoiceDate.getTime(); 

        // Entry for the invoice itself (billed amount)
        entries.push({
          id: `sale_${inv.id}`,
          date: inv.date,
          timestamp: entryTimestamp,
          typeDisplay: t('reports.customerTimeline.type.sale', 'Sale'),
          description: inv.items.map(i => `${i.medicationName} x${i.quantity}`).join(', '),
          reference: inv.invoiceNumber,
          billedAmount: inv.totalAmount,
          paidOrCreditedAmount: inv.amountPaid, 
          balance: 0 
        });
      });

    // Process Standalone Cash Payments
    cashTransactions
      .filter(ct => ct.relatedCustomerId === selectedCustomerId && 
                    ct.type === 'income' && 
                    ct.category === t('accounting.categoryCustomerPayment', 'Customer Payment Received') && 
                    !ct.relatedInvoiceId) 
      .forEach(ct => {
        entries.push({
          id: `payment_${ct.id}`,
          date: ct.date,
          timestamp: ct.timestamp,
          typeDisplay: t('reports.customerTimeline.type.payment', 'Payment'),
          description: ct.description,
          reference: `PAY-${ct.id.substring(0,6)}`,
          billedAmount: 0,
          paidOrCreditedAmount: ct.amount,
          balance: 0 
        });
      });

    // Process Sale Returns
    saleReturnInvoices
      .filter(sr => sr.customerId === selectedCustomerId)
      .forEach(sr => {
        const returnDate = new Date(sr.date);
        const entryTimestamp = returnDate.getTime();

        entries.push({
          id: `salereturn_${sr.id}`,
          date: sr.date,
          timestamp: entryTimestamp,
          typeDisplay: t('reports.customerTimeline.type.saleReturn', 'Sale Return'),
          description: sr.items.map(i => `${i.medicationName} x${i.quantityReturned} (Returned)`).join(', ') + (sr.restockingFee ? ` - Restocking Fee: Tk. ${sr.restockingFee.toFixed(2)}` : ''),
          reference: sr.returnInvoiceNumber,
          billedAmount: sr.refundIssued, 
          paidOrCreditedAmount: sr.totalRefundAmount, 
          balance: 0
        });
      });
      
    // Filter by date range
    let dateFilteredEntries = entries;
    if (filterStart && filterEnd) {
        dateFilteredEntries = entries.filter(e => {
            const entryDate = new Date(e.date);
            const normalizedEntryDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
            return normalizedEntryDate >= filterStart && normalizedEntryDate <= filterEnd;
        });
    }
    
    // Sort entries chronologically
    dateFilteredEntries.sort((a, b) => {
      const dateComparison = a.timestamp - b.timestamp;
      if (dateComparison !== 0) return dateComparison;
      if (a.typeDisplay === t('reports.customerTimeline.type.sale', 'Sale') && b.typeDisplay !== t('reports.customerTimeline.type.sale', 'Sale')) return -1;
      if (a.typeDisplay !== t('reports.customerTimeline.type.sale', 'Sale') && b.typeDisplay === t('reports.customerTimeline.type.sale', 'Sale')) return 1;
      return 0;
    });

    // Calculate running balance
    let currentBalance = 0;
    const finalEntries = dateFilteredEntries.map(e => {
      currentBalance += (e.billedAmount - e.paidOrCreditedAmount);
      return { ...e, balance: currentBalance };
    });
    
    if (sortConfig) {
        finalEntries.sort((a,b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            let comparison = 0;
            if (sortConfig.key === 'date') { 
                 comparison = a.timestamp - b.timestamp;
            } else if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else {
                comparison = String(valA ?? '').localeCompare(String(valB ?? ''));
            }
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }

    return finalEntries;

  }, [selectedCustomerId, saleInvoices, cashTransactions, saleReturnInvoices, getDateRange, sortConfig, t]);

  
  const selectedCustomerDetails = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);
  
  const summary = useMemo(() => {
    const totalBilled = transactionTimeline.reduce((sum, entry) => sum + entry.billedAmount, 0);
    const totalPaidOrCredited = transactionTimeline.reduce((sum, entry) => sum + entry.paidOrCreditedAmount, 0);
    const finalBalance = transactionTimeline.length > 0 ? transactionTimeline[transactionTimeline.length - 1].balance : 0;
    return { totalBilled, totalPaidOrCredited, finalBalance };
  }, [transactionTimeline]);


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
    return new Date(dateString).toLocaleDateString(t('language.current', 'en') === 'bn' ? 'bn-BD' : 'en-CA');
  };

  const formatTimeForDisplay = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(t('language.current', 'en') === 'bn' ? 'bn-BD' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  
  const handlePrint = () => { window.print(); };

  const getFilterPeriodText = () => {
    const { startDate, endDate } = getDateRange();
    if (filterDateRangeType === 'allTime') return t('reports.allTime', 'All Time');
    if (startDate && endDate) {
      if (filterDateRangeType === 'today') return `${t('reports.today', 'Today')} (${formatDateForDisplay(startDate.toISOString())})`;
      return `${t('reports.filterByDate', 'Period')}: ${formatDateForDisplay(startDate.toISOString())} - ${formatDateForDisplay(endDate.toISOString())}`;
    }
    return t('reports.filterByDate', 'Period: Not specified');
  };

  const dateRangeOptions = [
    { key: 'allTime', labelKey: 'reports.allTime' },
    { key: 'today', labelKey: 'reports.today' },
    { key: 'last7Days', labelKey: 'reports.last7Days' },
    { key: 'lastWeek', labelKey: 'reports.lastWeek' },
    { key: 'last30Days', labelKey: 'reports.last30Days' },
    { key: 'lastMonth', labelKey: 'reports.lastMonth' },
    { key: 'custom', labelKey: 'reports.customDateRange' }
  ] as {key: FilterDateRangeType, labelKey: string}[];


  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{t('reports.customerTimeline.title', 'Customer Transaction Timeline')}</h2>
        {selectedCustomerId && transactionTimeline.length > 0 && (
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

        {selectedCustomerId && (
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
            {filterDateRangeType === 'custom' && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="customStartDateCustTimeline" className="block text-xs font-medium text-gray-600 mb-0.5">Start Date</label>
                  <input type="date" id="customStartDateCustTimeline" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} max={customEndDate || todayISO} className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-xs"/>
                </div>
                <div>
                  <label htmlFor="customEndDateCustTimeline" className="block text-xs font-medium text-gray-600 mb-0.5">End Date</label>
                  <input type="date" id="customEndDateCustTimeline" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} min={customStartDate} max={todayISO} className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-xs"/>
                </div>
                {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
                    <p className="col-span-full text-xs text-red-500 mt-1">Start date cannot be after end date.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="print-area">
        <div className="hidden print:block mb-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="print-header-logo"/>}
          <div className="print-report-title">{appName} - {t('reports.customerTimeline.title', 'Customer Transaction Timeline')}</div>
          <div className="print-report-subtitle">
            {selectedCustomerDetails ? `${t('saleInvoiceForm.customerLabel', 'Customer')}: ${selectedCustomerDetails.name}` : ''}
            <br />
            {getFilterPeriodText()}
          </div>
        </div>

        {!selectedCustomerId ? (
            <div className="text-center py-10 print:hidden">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('reports.customerTimeline.selectCustomerPrompt', 'Please select a customer to view their transaction timeline.')}</h3>
            </div>
        ) : transactionTimeline.length === 0 ? (
            <div className="text-center py-10">
                <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('reports.customerTimeline.noTransactions', 'No transactions found')}</h3>
                <p className="mt-1 text-sm text-gray-500">
                {t('reports.customerTimeline.noTransactionsForCustomer', 'No transactions found for {customerName} in this period.', { customerName: selectedCustomerDetails?.name || 'the selected customer' })}
                </p>
            </div>
        ) : (
          <>
            <div className="mb-4 p-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-md print:border-gray-300 print:bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <p>
                        <span className="font-semibold">{t('reports.customerTimeline.totalBilled', 'Total Billed/Returned (+/-)')}: </span>
                        <span className="font-medium">Tk. {summary.totalBilled.toFixed(2)}</span>
                    </p>
                    <p>
                        <span className="font-semibold">{t('reports.customerTimeline.totalPaidCredited', 'Total Paid/Credited (-)')}: </span>
                        <span className="font-medium">Tk. {summary.totalPaidOrCredited.toFixed(2)}</span>
                    </p>
                    <p>
                        <span className="font-semibold">{t('reports.customerTimeline.finalBalance', 'Final Balance (Filtered)')}: </span>
                        <span className={`font-bold ${summary.finalBalance >= 0 ? 'text-gray-800' : 'text-red-600'}`}>Tk. {summary.finalBalance.toFixed(2)}</span>
                    </p>
                    {selectedCustomerDetails && (
                       <p>
                        <span className="font-semibold">{t('reports.customerTimeline.overallDue', 'Overall Total Due')}: </span>
                        <span className={`font-bold ${selectedCustomerDetails.totalDueAmount >= 0 ? 'text-gray-800' : 'text-red-600'}`}>Tk. {selectedCustomerDetails.totalDueAmount.toFixed(2)}</span>
                       </p>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHeader label={t('reports.customerTimeline.column.date', "Date")} sortKey="date" onSort={onSort} sortConfig={sortConfig} />
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('reports.customerTimeline.column.time', "Time")}</th>
                    <TableHeader label={t('reports.customerTimeline.column.type', "Type")} sortKey="typeDisplay" onSort={onSort} sortConfig={sortConfig} />
                    <TableHeader label={t('reports.customerTimeline.column.description', "Description")} sortKey="reference" onSort={onSort} sortConfig={sortConfig} /> 
                    <TableHeader label={t('reports.customerTimeline.column.reference', "Reference")} sortKey="reference" onSort={onSort} sortConfig={sortConfig} />
                    <TableHeader label={t('reports.customerTimeline.column.billedReturned', "Billed/Returned (+/-)")} sortKey="billedAmount" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                    <TableHeader label={t('reports.customerTimeline.column.paidCredited', "Paid/Credited (-)")} sortKey="paidOrCreditedAmount" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                    <TableHeader label={t('reports.customerTimeline.column.balance', "Balance")} sortKey="balance" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactionTimeline.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50 text-sm">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{formatDateForDisplay(entry.date)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{formatTimeForDisplay(entry.timestamp)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{entry.typeDisplay}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-xs truncate" title={entry.description}>{entry.description}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-gray-500">{entry.reference}</td>
                      <td className={`px-3 py-2 whitespace-nowrap text-right ${entry.billedAmount > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {entry.billedAmount !== 0 ? `Tk. ${entry.billedAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-3 py-2 whitespace-nowrap text-right ${entry.paidOrCreditedAmount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                        {entry.paidOrCreditedAmount !== 0 ? `Tk. ${entry.paidOrCreditedAmount.toFixed(2)}` : '-'}
                      </td>
                      <td className={`px-3 py-2 whitespace-nowrap text-right font-medium ${entry.balance >= 0 ? 'text-gray-800' : 'text-red-700'}`}>
                        Tk. {entry.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="hidden print:block print-footer-info mt-8">
            Printed on: {new Date().toLocaleDateString(t('language.current', 'en') === 'bn' ? 'bn-BD' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} at {new Date().toLocaleTimeString(t('language.current', 'en') === 'bn' ? 'bn-BD' : 'en-US')}
        </div>
      </div>
    </div>
  );
};

export default CustomerTransactionTimelineReportView;
