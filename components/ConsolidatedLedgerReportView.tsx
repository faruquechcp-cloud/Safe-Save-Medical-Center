
import React, { useState, useMemo } from 'react';
import { ConsolidatedLedgerEntry, Customer, Supplier, GenericSortConfig, SortableConsolidatedLedgerKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import DocumentChartBarIcon from './icons/DocumentChartBarIcon'; 
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';

interface ConsolidatedLedgerReportViewProps {
  ledgerEntries: ConsolidatedLedgerEntry[];
  customers: Customer[];
  suppliers: Supplier[];
  sortConfig: GenericSortConfig<SortableConsolidatedLedgerKeys> | null;
  onSort: (key: SortableConsolidatedLedgerKeys) => void;
}

type FilterPartyType = 'all' | 'Customer' | 'Supplier' | 'System';
type FilterTransactionType = 
  | 'all' 
  | 'Sale Invoice' 
  | 'Purchase Invoice' 
  | 'Service Invoice'
  | 'Payment Received' 
  | 'Payment Made'
  | 'Sale Return'
  | 'Purchase Return'
  | 'Refund Issued (Sale Return)'
  | 'Refund Received (Purchase Return)';


const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableConsolidatedLedgerKeys; 
    onSort: (key: SortableConsolidatedLedgerKeys) => void; 
    sortConfig: GenericSortConfig<SortableConsolidatedLedgerKeys> | null;
    className?: string;
    colSpan?: number;
}> = ({ label, sortKey, onSort, sortConfig, className = "", colSpan }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        colSpan={colSpan}
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

const ConsolidatedLedgerReportView: React.FC<ConsolidatedLedgerReportViewProps> = ({ ledgerEntries, customers, suppliers, sortConfig, onSort }) => {
  const { appName, logoUrl } = useSettings();
  const { t } = useTranslations();

  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [filterPartyId, setFilterPartyId] = useState<string>(''); 
  const [filterPartyTypeUi, setFilterPartyTypeUi] = useState<FilterPartyType>('all');
  const [filterTransactionType, setFilterTransactionType] = useState<FilterTransactionType>('all');
  
  const todayISO = new Date().toISOString().split('T')[0];

  const partyOptions = useMemo(() => {
    let options: { id: string; name: string; type: 'Customer' | 'Supplier' }[] = [];
    if (filterPartyTypeUi === 'all' || filterPartyTypeUi === 'Customer') {
        options = options.concat(customers.map(c => ({ id: c.id, name: `${c.name} (Customer)`, type: 'Customer' as const })));
    }
    if (filterPartyTypeUi === 'all' || filterPartyTypeUi === 'Supplier') {
        options = options.concat(suppliers.map(s => ({ id: s.id, name: `${s.name} (Supplier)`, type: 'Supplier' as const })));
    }
    return options.sort((a,b) => a.name.localeCompare(b.name));
  }, [customers, suppliers, filterPartyTypeUi]);

  const filteredLedgerEntries = useMemo(() => {
    let filtered = [...ledgerEntries];

    if (filterDateStart) {
      filtered = filtered.filter(e => e.date >= filterDateStart);
    }
    if (filterDateEnd) {
      filtered = filtered.filter(e => e.date <= filterDateEnd);
    }
    if (filterPartyId) {
      const selectedParty = partyOptions.find(p => p.id === filterPartyId);
      if (selectedParty) {
        filtered = filtered.filter(e => e.partyName === selectedParty.name.replace(/ \((Customer|Supplier)\)$/, '') && e.partyType === selectedParty.type);
      }
    } else if (filterPartyTypeUi !== 'all') { 
        filtered = filtered.filter(e => e.partyType === filterPartyTypeUi);
    }

    if (filterTransactionType !== 'all') {
      filtered = filtered.filter(e => e.transactionTypeDisplay === filterTransactionType);
    }
    
    if (sortConfig) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        let comparison = 0;
        if (sortConfig.key === 'date') {
            comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
            if (comparison === 0) comparison = (a.timestamp || 0) - (b.timestamp || 0); 
        } else if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    } else { 
        filtered.sort((a,b) => {
            const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
            if(dateComparison !== 0) return dateComparison;
            return (b.timestamp || 0) - (a.timestamp || 0);
        });
    }
    return filtered;
  }, [ledgerEntries, filterDateStart, filterDateEnd, filterPartyId, filterPartyTypeUi, filterTransactionType, partyOptions, sortConfig]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA');

  const handlePrint = () => { window.print(); };

  const getFilterPeriodText = () => {
    if (filterDateStart && filterDateEnd) return `${formatDate(filterDateStart)} - ${formatDate(filterDateEnd)}`;
    if (filterDateStart) return `From ${formatDate(filterDateStart)}`;
    if (filterDateEnd) return `To ${formatDate(filterDateEnd)}`;
    return t('reports.allTime', 'All Time');
  };
  
  const selectedPartyDetails = useMemo(() => {
    if (!filterPartyId) return null;
    return partyOptions.find(p => p.id === filterPartyId);
  }, [filterPartyId, partyOptions]);

  const transactionTypeDisplayOptions: {value: FilterTransactionType, labelKey: string}[] = [
    { value: 'all', labelKey: 'consolidatedLedger.allTypes' },
    { value: 'Sale Invoice', labelKey: 'reports.saleInvoice' },
    { value: 'Purchase Invoice', labelKey: 'reports.purchaseInvoice' },
    { value: 'Service Invoice', labelKey: 'reports.serviceInvoice' },
    { value: 'Sale Return', labelKey: 'reports.saleReturn' },
    { value: 'Purchase Return', labelKey: 'reports.purchaseReturn' },
    { value: 'Payment Received', labelKey: 'reports.paymentReceived' },
    { value: 'Payment Made', labelKey: 'reports.paymentMade' },
    { value: 'Refund Issued (Sale Return)', labelKey: 'reports.refundIssued' },
    { value: 'Refund Received (Purchase Return)', labelKey: 'reports.refundReceived' },
  ];
  
  const handlePartyTypeUiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterPartyTypeUi(e.target.value as FilterPartyType);
    setFilterPartyId(''); 
  };


  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-4">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{t('consolidatedLedger.title', 'Consolidated Ledger Report')}</h2>
        {filteredLedgerEntries.length > 0 && (
          <button onClick={handlePrint} className="mt-2 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] rounded-md shadow-sm">
            {t('consolidatedLedger.printButton', 'Print Report')}
          </button>
        )}
      </div>

      <div className="print:hidden mb-6 p-4 bg-gray-50 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 items-end">
        <div>
          <label htmlFor="filterDateStartLedger" className="block text-xs font-medium text-gray-600">{t('expiryReport.startDate')}</label>
          <input type="date" id="filterDateStartLedger" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} max={filterDateEnd || todayISO} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs"/>
        </div>
        <div>
          <label htmlFor="filterDateEndLedger" className="block text-xs font-medium text-gray-600">{t('expiryReport.endDate')}</label>
          <input type="date" id="filterDateEndLedger" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} min={filterDateStart} max={todayISO} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs"/>
        </div>
        <div>
          <label htmlFor="filterPartyTypeUiLedger" className="block text-xs font-medium text-gray-600">{t('consolidatedLedger.column.partyType')}</label>
          <select id="filterPartyTypeUiLedger" value={filterPartyTypeUi} onChange={handlePartyTypeUiChange} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs">
            <option value="all">{t('consolidatedLedger.allParties')}</option>
            <option value="Customer">{t('header.customers', 'Customers')}</option>
            <option value="Supplier">{t('header.suppliers', 'Suppliers')}</option>
            <option value="System">System</option>
          </select>
        </div>
        <div>
          <label htmlFor="filterPartyLedger" className="block text-xs font-medium text-gray-600">{t('consolidatedLedger.filterByParty', 'Filter by Party:')}</label>
          <select id="filterPartyLedger" value={filterPartyId} onChange={e => setFilterPartyId(e.target.value)} disabled={(filterPartyTypeUi === 'all' && partyOptions.length === 0) || filterPartyTypeUi === 'System'} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs">
            <option value="">{filterPartyTypeUi === 'all' ? t('consolidatedLedger.allParties') : (filterPartyTypeUi === 'System' ? '-- N/A --' : `-- Select ${filterPartyTypeUi} --`)}</option>
            {partyOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filterTransactionTypeLedger" className="block text-xs font-medium text-gray-600">{t('consolidatedLedger.filterByTransactionType', 'Transaction Type:')}</label>
          <select id="filterTransactionTypeLedger" value={filterTransactionType} onChange={e => setFilterTransactionType(e.target.value as FilterTransactionType)} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs">
            {transactionTypeDisplayOptions.map(opt => <option key={opt.value} value={opt.value}>{t(opt.labelKey, opt.value)}</option>)}
          </select>
        </div>
      </div>
      
      <div className="print-area">
        <div className="hidden print:block mb-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="print-header-logo"/>}
          <div className="print-report-title">{appName} - {t('consolidatedLedger.title')}</div>
          <div className="print-report-subtitle">
            {selectedPartyDetails ? `Party: ${selectedPartyDetails.name}` : (filterPartyTypeUi !== 'all' ? `Party Type: ${filterPartyTypeUi}` : t('consolidatedLedger.allParties'))}
            <br />
            {t('reports.filterByDate')}: {getFilterPeriodText()}
            {filterTransactionType !== 'all' && <><br/>Type: {t(transactionTypeDisplayOptions.find(opt => opt.value === filterTransactionType)?.labelKey || filterTransactionType)}</>}
          </div>
        </div>

        {filteredLedgerEntries.length === 0 ? (
          <div className="text-center py-10">
            <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('consolidatedLedger.noEntries', 'No ledger entries found for the selected criteria.')}</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border rounded-md">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader label={t('consolidatedLedger.column.date','Date')} sortKey="date" onSort={onSort} sortConfig={sortConfig} />
                  <TableHeader label={t('consolidatedLedger.column.partyName','Party Name')} sortKey="partyName" onSort={onSort} sortConfig={sortConfig} />
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('consolidatedLedger.column.partyType','Party Type')}</th>
                  <TableHeader label={t('consolidatedLedger.column.transactionTypeDisplay','Transaction Type')} sortKey="transactionTypeDisplay" onSort={onSort} sortConfig={sortConfig} />
                  <TableHeader label={t('consolidatedLedger.column.reference','Reference')} sortKey="reference" onSort={onSort} sortConfig={sortConfig} />
                  <TableHeader label={t('consolidatedLedger.column.description','Description')} sortKey="description" onSort={onSort} sortConfig={sortConfig} />
                  <TableHeader label={t('consolidatedLedger.column.debit','Debit (Tk.)')} sortKey="debit" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                  <TableHeader label={t('consolidatedLedger.column.credit','Credit (Tk.)')} sortKey="credit" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLedgerEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 text-sm">
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{formatDate(entry.date)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700">{entry.partyName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{entry.partyType}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{t(entry.transactionTypeDisplay, entry.transactionTypeDisplay)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">{entry.reference}</td>
                    <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate" title={entry.description}>{entry.description}</td>
                    <td className={`px-3 py-2 whitespace-nowrap text-right ${entry.debit > 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                      {entry.debit > 0 ? entry.debit.toFixed(2) : '-'}
                    </td>
                    <td className={`px-3 py-2 whitespace-nowrap text-right ${entry.credit > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {entry.credit > 0 ? entry.credit.toFixed(2) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="hidden print:block print-footer-info mt-8">
            {t('print.printed')}: {new Date().toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} {t('common.at', 'at')} {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedLedgerReportView;
