
import React, { useState, useMemo } from 'react';
import { CashTransaction, GenericSortConfig, SortableCashTransactionKeys, CashTransactionType, CashTransactionCategory } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import CashIcon from './icons/CashIcon';
import PlusCircleIcon from './icons/PlusCircleIcon'; 
import { useTranslations } from '../hooks/useTranslations';

interface CashLedgerViewProps {
  transactions: CashTransaction[];
  onAddManualTransaction: () => void; // To open the modal
  onSort: (key: SortableCashTransactionKeys) => void;
  sortConfig: GenericSortConfig<SortableCashTransactionKeys> | null;
}

const ITEMS_PER_PAGE = 20;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableCashTransactionKeys; 
    onSort: (key: SortableCashTransactionKeys) => void; 
    sortConfig: GenericSortConfig<SortableCashTransactionKeys> | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${className}`}
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

const CashLedgerView: React.FC<CashLedgerViewProps> = ({ transactions, onAddManualTransaction, onSort, sortConfig }) => {
  const { t } = useTranslations();
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  const [filterType, setFilterType] = useState<CashTransactionType | ''>('');
  const [filterCategory, setFilterCategory] = useState<CashTransactionCategory | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const todayISO = new Date().toISOString().split('T')[0];

  const processedTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (filterDateStart) {
      filtered = filtered.filter(t => t.date >= filterDateStart);
    }
    if (filterDateEnd) {
      filtered = filtered.filter(t => t.date <= filterDateEnd);
    }
    if (filterType) {
      filtered = filtered.filter(t => t.type === filterType);
    }
    if (filterCategory) {
      filtered = filtered.filter(t => t.category === filterCategory);
    }
    
    // Sort for running balance calculation: by date, then by original timestamp for stability
    const sortedForBalance = [...filtered].sort((a, b) => {
        const dateComparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return a.timestamp - b.timestamp; // Use original insertion order for same-day
    });

    let runningBalance = 0;
    const transactionsWithRunningBalance = sortedForBalance.map(t => {
      runningBalance += (t.type === 'income' ? t.amount : -t.amount);
      return { ...t, runningBalance };
    });
    
    // Now apply display sort config if any, otherwise keep the date-sorted order.
    if (sortConfig) {
        return transactionsWithRunningBalance.sort((a,b) => {
            let valA = a[sortConfig.key as keyof CashTransaction];
            let valB = b[sortConfig.key as keyof CashTransaction];

            if (sortConfig.key === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            }
            
            let comparison = 0;
            if (typeof valA === 'number' && typeof valB === 'number') {
                comparison = valA - valB;
            } else {
                comparison = String(valA).localeCompare(String(valB));
            }
            return sortConfig.direction === 'ascending' ? comparison : -comparison;
        });
    }

    return transactionsWithRunningBalance; 

  }, [transactions, filterDateStart, filterDateEnd, filterType, filterCategory, sortConfig]);

  const currentCashBalance = useMemo(() => {
    return transactions.reduce((balance, t) => {
        return balance + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }, [transactions]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA');
  };
  
  const allCategories = useMemo(() => {
    const cats = new Set<CashTransactionCategory>();
    transactions.forEach(t => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Pagination Logic
  const totalPages = Math.ceil(processedTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = processedTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center">
          <CashIcon className="w-7 h-7 mr-2 text-[var(--color-primary-600)]" />
          {t('accounting.cashLedger')}
        </h2>
        <button
          onClick={onAddManualTransaction}
          className="flex items-center px-4 py-2 bg-[var(--color-primary-600)] text-white text-sm font-medium rounded-md hover:bg-[var(--color-primary-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary-500)] transition-colors"
        >
          <PlusCircleIcon className="w-5 h-5 mr-1.5" />
          {t('accounting.manualTransaction')}
        </button>
      </div>

      <div className="mb-6 p-3 bg-gray-50 rounded-lg shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div>
          <label htmlFor="filterDateStart" className="block text-xs font-medium text-gray-600">{t('reports.customDateRange', 'শুরু')}</label>
          <input type="date" id="filterDateStart" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} max={filterDateEnd || todayISO} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs"/>
        </div>
        <div>
          <label htmlFor="filterDateEnd" className="block text-xs font-medium text-gray-600">{t('reports.customDateRange', 'শেষ')}</label>
          <input type="date" id="filterDateEnd" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} min={filterDateStart} max={todayISO} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs"/>
        </div>
        <div>
          <label htmlFor="filterType" className="block text-xs font-medium text-gray-600">{t('accounting.typeLabel')}</label>
          <select id="filterType" value={filterType} onChange={e => setFilterType(e.target.value as CashTransactionType | '')} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs">
            <option value="">{t('consolidatedLedger.allTypes', 'সব ধরণ')}</option>
            <option value="income">{t('accounting.income')}</option>
            <option value="expense">{t('accounting.expense')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="filterCategory" className="block text-xs font-medium text-gray-600">{t('accounting.categoryLabel')}</label>
          <select id="filterCategory" value={filterCategory} onChange={e => setFilterCategory(e.target.value as CashTransactionCategory | '')} className="mt-0.5 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm sm:text-xs">
            <option value="">{t('consolidatedLedger.allParties', 'সব ক্যাটাগরি')}</option>
            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-center">
        <p className="text-sm text-blue-700">{t('settings.initialBalanceLabel', 'বর্তমান ক্যাশ ব্যালেন্স')}: 
          <span className={`font-bold text-lg ml-2 ${currentCashBalance >= 0 ? 'text-blue-800' : 'text-red-600'}`}>
            {t('common.tk')} {currentCashBalance.toFixed(2)}
          </span>
        </p>
      </div>


      {processedTransactions.length === 0 ? (
        <div className="text-center py-10">
          <CashIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('saleReturnInvoiceList.noSaleReturns', 'কোন লেনদেন পাওয়া যায়নি')}</h3>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200 border rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <TableHeader label={t('reports.customerTimeline.column.date')} sortKey="date" onSort={onSort} sortConfig={sortConfig} />
                <TableHeader label={t('accounting.categoryLabel')} sortKey="category" onSort={onSort} sortConfig={sortConfig} />
                <TableHeader label={t('reports.customerTimeline.column.description')} sortKey="description" onSort={onSort} sortConfig={sortConfig} />
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('accounting.income')}</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('accounting.expense')}</th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('reports.customerTimeline.column.balance')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 text-sm">
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">{formatDate(t.date)}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-500">{t.category}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-xs truncate" title={t.description}>{t.description}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-green-600 text-right">
                    {t.type === 'income' ? t.amount.toFixed(2) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-red-600 text-right">
                    {t.type === 'expense' ? t.amount.toFixed(2) : '-'}
                  </td>
                  <td className={`px-3 py-2 whitespace-nowrap text-right font-medium ${t.runningBalance >= 0 ? 'text-gray-800' : 'text-red-700'}`}>
                    {t.runningBalance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {processedTransactions.length > ITEMS_PER_PAGE && (
        <div className="shrink-0 py-3 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-lg mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-gray-700">
                        Showing <span className="font-bold">{startIndex + 1}</span> to <span className="font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, processedTransactions.length)}</span> of <span className="font-bold">{processedTransactions.length}</span> results
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

export default CashLedgerView;
