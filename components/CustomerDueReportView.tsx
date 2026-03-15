
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Customer, SaleInvoice, GenericSortConfig, SortableCustomerDueReportKeys, NotificationSettings } from '../types';
import DistinctUsersIcon from './icons/UsersIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon'; 
import SearchIcon from './icons/SearchIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import MessengerIcon from './icons/MessengerIcon';
import EnvelopeIcon from './icons/EnvelopeIcon';
import { useSettings } from '../contexts/SettingsContext'; 
import { useTranslations } from '../hooks/useTranslations';
import { exportToCSV } from '../utils/exportUtils';
import { sendCustomerNotification } from '../utils/notificationUtils';
import SearchableSelect from './SearchableSelect';

interface CustomerDueReportViewProps {
  customers: Customer[];
  saleInvoices: SaleInvoice[];
  onViewInvoiceDetails: (invoice: SaleInvoice) => void;
  sortConfig: GenericSortConfig<SortableCustomerDueReportKeys> | null;
  onSort: (key: SortableCustomerDueReportKeys) => void;
  notificationSettings: NotificationSettings;
}

type FilterType = 'all' | 'today' | 'last7days' | 'last30days' | 'custom';

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


const CustomerDueReportView: React.FC<CustomerDueReportViewProps> = ({ customers, saleInvoices, onViewInvoiceDetails, sortConfig, onSort, notificationSettings }) => {
  const { t } = useTranslations();
  const { appName, logoUrl } = useSettings();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  
  // Invoice Search & Pagination States (Detail View)
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Customer List Search & Pagination States (List View)
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerPage, setCustomerPage] = useState(1);
  
  // Reset invoice pagination when filter/customer changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCustomerId, filterType, customStartDate, customEndDate, searchTerm]);

  // Reset customer list pagination when search changes
  useEffect(() => {
    setCustomerPage(1);
  }, [customerSearchTerm]);

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

  // --- Customer List Logic ---
  const dueCustomers = useMemo(() => {
    return customers
      .filter(c => c.totalDueAmount > 0)
      .filter(c => 
        c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
        (c.phone && c.phone.includes(customerSearchTerm))
      )
      .sort((a, b) => b.totalDueAmount - a.totalDueAmount); // Default sort by high due
  }, [customers, customerSearchTerm]);

  const totalPagesCustomers = Math.ceil(dueCustomers.length / ITEMS_PER_PAGE);
  const startCustIndex = (customerPage - 1) * ITEMS_PER_PAGE;
  const currentDueCustomers = dueCustomers.slice(startCustIndex, startCustIndex + ITEMS_PER_PAGE);

  const totalReceivable = useMemo(() => dueCustomers.reduce((acc, curr) => acc + curr.totalDueAmount, 0), [dueCustomers]);

  // --- Invoice List Logic ---
  const filteredInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    
    const { startDate, endDate } = getDateRange();
    
    // First filter by Customer, Amount Due, and Date
    let invoices = saleInvoices
      .filter(invoice => invoice.customerId === selectedCustomerId && invoice.amountDue > 0)
      .filter(invoice => {
        if (filterType === 'all' || !startDate || !endDate) return true;
        const invoiceDate = new Date(invoice.date);
        const invoiceUTCDate = new Date(Date.UTC(invoiceDate.getUTCFullYear(), invoiceDate.getUTCMonth(), invoiceDate.getUTCDate()));
        return invoiceUTCDate >= startDate && invoiceUTCDate <= endDate;
      });

    // Then filter by Search Term (Invoice # or Amount)
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        invoices = invoices.filter(inv => 
            inv.invoiceNumber.toLowerCase().includes(lowerTerm) || 
            inv.totalAmount.toString().includes(lowerTerm) ||
            inv.amountDue.toString().includes(lowerTerm)
        );
    }

    return invoices;
  }, [selectedCustomerId, saleInvoices, filterType, getDateRange, searchTerm]);

  const sortedDueInvoices = useMemo(() => {
    let sortableItems = [...filteredInvoices];
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
  }, [filteredInvoices, sortConfig]);

  // Invoice Pagination Logic
  const totalPagesInvoices = Math.ceil(sortedDueInvoices.length / ITEMS_PER_PAGE);
  const startInvIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentInvoices = sortedDueInvoices.slice(startInvIndex, startInvIndex + ITEMS_PER_PAGE);

  const totalDueForFilteredInvoices = useMemo(() => {
    return sortedDueInvoices.reduce((sum, inv) => sum + inv.amountDue, 0);
  }, [sortedDueInvoices]);
  
  const selectedCustomerDetails = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const handleSendReminder = async (channel?: 'sms' | 'email' | 'whatsapp' | 'messenger') => {
    if (!selectedCustomerDetails) return;
    setIsSendingAlert(true);
    try {
      await sendCustomerNotification('due_reminder', selectedCustomerDetails, { amount: selectedCustomerDetails.totalDueAmount }, notificationSettings, channel);
      alert(`${t('reports.reminderSent')} via ${channel || 'default channels'} to ${selectedCustomerDetails.name}`);
    } catch (e) {
      alert("Failed to send reminder. Check settings.");
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedCustomerDetails) return;
    const data = sortedDueInvoices.map(inv => ({
        'Invoice #': inv.invoiceNumber,
        'Date': inv.date,
        'Total Amount': inv.totalAmount,
        'Amount Paid': inv.amountPaid,
        'Amount Due': inv.amountDue
    }));
    exportToCSV(data, `Customer_Due_${selectedCustomerDetails.name.replace(/\s/g, '_')}`);
  };

  const FilterButton: React.FC<{label: string, type: FilterType, activeType: FilterType, onClick: (type: FilterType) => void}> = 
    ({ label, type, activeType, onClick }) => (
    <button
      onClick={() => onClick(type)}
      className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors
                  ${activeType === type 
                    ? 'bg-[var(--color-primary-600)] text-white shadow-md' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{t('reports.customerDues')}</h2>
        {selectedCustomerId && (
            <div className="flex flex-wrap items-center gap-2">
            {selectedCustomerDetails && selectedCustomerDetails.totalDueAmount > 0 && (
                <div className="flex items-center bg-primary-50 border border-primary-100 rounded-md p-1 shadow-sm">
                    <span className="text-[10px] font-bold text-primary-600 uppercase px-2 hidden sm:inline">{t('reports.remindVia')}</span>
                    <div className="flex gap-1">
                        {notificationSettings.smsEnabled && (
                            <button
                                onClick={() => handleSendReminder('sms')}
                                disabled={isSendingAlert}
                                title={t('reports.sendSms')}
                                className="p-2 text-primary-600 hover:bg-primary-100 rounded-md transition-colors disabled:opacity-50"
                            >
                                <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                        )}
                        {notificationSettings.whatsappEnabled && (
                            <button
                                onClick={() => handleSendReminder('whatsapp')}
                                disabled={isSendingAlert}
                                title={t('reports.sendWhatsApp')}
                                className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors disabled:opacity-50"
                            >
                                <WhatsAppIcon className="w-4 h-4" />
                            </button>
                        )}
                        {notificationSettings.messengerEnabled && (
                            <button
                                onClick={() => handleSendReminder('messenger')}
                                disabled={isSendingAlert}
                                title={t('reports.sendMessenger')}
                                className="p-2 text-primary-600 hover:bg-primary-100 rounded-md transition-colors disabled:opacity-50"
                            >
                                <MessengerIcon className="w-4 h-4" />
                            </button>
                        )}
                        {notificationSettings.emailEnabled && (
                            <button
                                onClick={() => handleSendReminder('email')}
                                disabled={isSendingAlert}
                                title={t('reports.sendEmail')}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
                            >
                                <EnvelopeIcon className="w-4 h-4" />
                            </button>
                        )}
                        {!notificationSettings.smsEnabled && !notificationSettings.whatsappEnabled && !notificationSettings.messengerEnabled && !notificationSettings.emailEnabled && (
                             <button
                                onClick={() => handleSendReminder()}
                                disabled={isSendingAlert}
                                className="flex items-center px-3 py-1.5 text-xs font-bold text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-all shadow-md disabled:opacity-50"
                            >
                                <PaperAirplaneIcon className={`w-3 h-3 mr-1 ${isSendingAlert ? 'animate-pulse' : ''}`} /> 
                                {t('reports.remindVia')}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {sortedDueInvoices.length > 0 && (
                <button
                    onClick={handleExportCSV}
                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" /> Export
                </button>
            )}
            {sortedDueInvoices.length > 0 && (
                <button
                onClick={() => window.print()}
                className="px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-md shadow-sm transition-colors"
                >
                Print Report
                </button>
            )}
            </div>
        )}
      </div>

      <div className="print:hidden mb-6 p-4 bg-gray-50 rounded-lg shadow-sm space-y-4">
        {selectedCustomerId ? (
            // Detail View Filters
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <button onClick={() => setSelectedCustomerId('')} className="text-sm text-primary-600 font-bold hover:underline">
                        &larr; Back to Customer List
                    </button>
                    <SearchableSelect 
                        label="Switch Customer"
                        options={customers.map(c => ({ id: c.id, label: c.name, subLabel: c.phone }))}
                        selectedId={selectedCustomerId}
                        onSelect={setSelectedCustomerId}
                        placeholder="Search & Select Customer"
                        className="w-full sm:w-64"
                    />
                </div>
                <div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <span className="text-sm font-medium text-gray-700">Filter Invoices By:</span>
                    <FilterButton label="All Time" type="all" activeType={filterType} onClick={setFilterType} />
                    <FilterButton label="Today" type="today" activeType={filterType} onClick={setFilterType} />
                    <FilterButton label="Last 7 Days" type="last7days" activeType={filterType} onClick={setFilterType} />
                    <FilterButton label="Last 30 Days" type="last30days" activeType={filterType} onClick={setFilterType} />
                    <FilterButton label="Custom" type="custom" activeType={filterType} onClick={setFilterType} />
                    </div>
                    {filterType === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} className="px-2 py-1 border rounded-md" />
                        <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} className="px-2 py-1 border rounded-md" />
                    </div>
                    )}
                </div>

                {/* Search Bar for Invoices */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search invoice number or amount..."
                        className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm"
                    />
                </div>
            </div>
        ) : (
            // List View Filter
            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        placeholder="Search customers with dues by name or phone..."
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] font-medium"
                    />
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                    <span>Total Outstanding (All Customers):</span>
                    <span className="font-bold text-red-600">Tk. {totalReceivable.toFixed(2)}</span>
                </div>
            </div>
        )}
      </div>
      
      <div className="print-area">
        <div className="hidden print:block mb-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="print-header-logo"/>}
          <div className="print-report-title">{appName} - Customer Due Report</div>
          {selectedCustomerId && (
            <div className="print-report-subtitle">
                Customer: {selectedCustomerDetails?.name}
            </div>
          )}
        </div>

        {!selectedCustomerId ? (
            // Customer List View
            <>
                {dueCustomers.length === 0 ? (
                    <div className="text-center py-10">
                        <DistinctUsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No customers with dues found</h3>
                        <p className="mt-1 text-sm text-gray-500">All customers are cleared or search did not match.</p>
                    </div>
                ) : (
                    <div className="flex flex-col min-h-[400px]">
                        <div className="overflow-x-auto flex-1">
                            <table className="min-w-full divide-y divide-gray-200 border rounded-md">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <TableHeader label="Customer Name" disableSort />
                                        <TableHeader label="Contact" disableSort />
                                        <TableHeader label="Total Due" className="text-right" disableSort />
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentDueCustomers.map(c => (
                                        <tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedCustomerId(c.id)}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500">{c.phone || '-'}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">Tk. {c.totalDueAmount.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <button 
                                                    className="text-primary-600 hover:text-primary-900 font-medium text-xs uppercase"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(c.id); }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination for Customer List */}
                        {dueCustomers.length > ITEMS_PER_PAGE && (
                            <div className="shrink-0 py-3 px-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-lg print:hidden">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCustomerPage(p => Math.max(1, p - 1))} disabled={customerPage === 1} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Prev</button>
                                    <span className="text-sm text-gray-600">Page {customerPage} of {totalPagesCustomers}</span>
                                    <button onClick={() => setCustomerPage(p => Math.min(totalPagesCustomers, p + 1))} disabled={customerPage === totalPagesCustomers} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </>
        ) : (
            // Invoice Detail View
            <>
                {sortedDueInvoices.length > 0 ? (
                    <>
                    <div className="mb-4 p-3 bg-[var(--color-primary-50)] border border-[var(--color-primary-200)] rounded-md print:border-gray-300 print:bg-gray-50">
                        <p className="text-sm text-[var(--color-primary-700)] print:text-gray-800">
                        <span className="font-semibold">{selectedCustomerDetails?.name}</span> - Total Due (Filtered Period): 
                        <span className="font-bold text-lg ml-2">Tk. {totalDueForFilteredInvoices.toFixed(2)}</span>
                        </p>
                    </div>
                    
                    <div className="flex flex-col min-h-[400px]">
                        <div className="overflow-x-auto flex-1">
                            <table className="min-w-full divide-y divide-gray-200 border rounded-md">
                            <thead className="bg-gray-50">
                                <tr>
                                <TableHeader label="Invoice #" sortKey="invoiceNumber" onSort={onSort} sortConfig={sortConfig} />
                                <TableHeader label="Date" sortKey="date" onSort={onSort} sortConfig={sortConfig} />
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
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{invoice.date}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">Tk. {invoice.totalAmount.toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-green-600 text-right">Tk. {invoice.amountPaid.toFixed(2)}</td>
                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 font-semibold text-right">Tk. {invoice.amountDue.toFixed(2)}</td>
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

                        {/* Pagination Footer */}
                        {sortedDueInvoices.length > ITEMS_PER_PAGE && (
                            <div className="shrink-0 py-3 px-4 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-lg print:hidden">
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-xs text-gray-700">
                                            Showing <span className="font-bold">{startInvIndex + 1}</span> to <span className="font-bold">{Math.min(startInvIndex + ITEMS_PER_PAGE, sortedDueInvoices.length)}</span> of <span className="font-bold">{sortedDueInvoices.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                                <span className="sr-only">Previous</span>
                                                <ChevronDownIcon className="h-4 w-4 rotate-90" />
                                            </button>
                                            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-xs font-black text-gray-700 uppercase tracking-widest">
                                                Page {currentPage} of {totalPagesInvoices}
                                            </span>
                                            <button onClick={() => setCurrentPage(p => Math.min(totalPagesInvoices, p + 1))} disabled={currentPage === totalPagesInvoices} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                                                <span className="sr-only">Next</span>
                                                <ChevronUpIcon className="h-4 w-4 rotate-90" />
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    </>
                ) : (
                <div className="text-center py-10">
                    <DistinctUsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No matching due invoices found.
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        Try adjusting your search or date filter.
                    </p>
                </div>
                )}
            </>
        )}
      </div>
    </div>
  );
};

export default CustomerDueReportView;
