
import React, { useState, useMemo } from 'react';
import { MedicationItem, ExpiryReportItem, GenericSortConfig, SortableExpiryReportKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import WarningIcon from './icons/WarningIcon';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';
import { exportToCSV } from '../utils/exportUtils';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import PrinterIcon from './icons/PrinterIcon';

interface ExpiryReportViewProps {
  medications: MedicationItem[];
  sortConfig: GenericSortConfig<SortableExpiryReportKeys> | null;
  onSort: (key: SortableExpiryReportKeys) => void;
  onStockOut?: (item: ExpiryReportItem) => void;
}

const ITEMS_PER_PAGE = 50;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableExpiryReportKeys; 
    onSort: (key: SortableExpiryReportKeys) => void; 
    sortConfig: GenericSortConfig<SortableExpiryReportKeys> | null;
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

const ExpiryReportView: React.FC<ExpiryReportViewProps> = ({ medications, sortConfig, onSort, onStockOut }) => {
  const { appName, logoUrl } = useSettings();
  const { t } = useTranslations();

  // Default range: Today to 30 days from now
  const todayISO = new Date().toISOString().split('T')[0];
  const nextMonthISO = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(todayISO);
  const [endDate, setEndDate] = useState<string>(nextMonthISO);
  const [currentPage, setCurrentPage] = useState(1);

  const reportData = useMemo(() => {
    const results: ExpiryReportItem[] = [];
    
    medications.forEach(med => {
      med.batches.forEach(batch => {
        if (batch.expiryDate >= startDate && batch.expiryDate <= endDate) {
          results.push({
            medicationId: med.id,
            medicationName: med.name,
            genericName: med.genericName,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantityInStock: batch.quantityInStock,
            costPrice: batch.costPrice,
            location: med.location
          });
        }
      });
    });

    if (sortConfig) {
      results.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB));
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    } else {
      results.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
    }

    return results;
  }, [medications, startDate, endDate, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = reportData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    const csvData = reportData.map(item => ({
        [t('expiryReport.brandName')]: item.medicationName,
        [t('expiryReport.genericName')]: item.genericName,
        [t('expiryReport.batchNo')]: item.batchNumber,
        [t('expiryReport.expiryDate')]: item.expiryDate,
        [t('expiryReport.stock')]: item.quantityInStock,
        [t('expiryReport.location')]: item.location
    }));
    exportToCSV(csvData, `Expiry_Report_${startDate}_to_${endDate}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6 flex flex-col h-[calc(100vh-140px)]">
      <div className="print:hidden flex flex-col sm:flex-row justify-between items-center mb-6 gap-3 shrink-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{t('expiryReport.title', 'Custom Expiry Search Report')}</h2>
        {reportData.length > 0 && (
          <div className="flex items-center space-x-2">
            <button 
                onClick={handleExportCSV} 
                className="px-4 py-2 text-sm font-black uppercase tracking-widest text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl border border-primary-100 transition-all active:scale-95 flex items-center"
            >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                {t('common.exportCSV')}
            </button>
            <button 
                onClick={handlePrint} 
                className="px-4 py-2 text-sm font-black uppercase tracking-widest text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-100 transition-all active:scale-95 flex items-center"
            >
                <PrinterIcon className="w-4 h-4 mr-2" />
                {t('common.print')}
            </button>
          </div>
        )}
      </div>

      <div className="print:hidden mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <p className="text-sm font-black text-slate-700 uppercase tracking-widest">{t('expiryReport.searchPrompt', 'Search Products Expiring Between')}:</p>
            <div className="flex flex-wrap gap-2">
                <button 
                    onClick={() => {
                        setStartDate('2000-01-01');
                        setEndDate(todayISO);
                        setCurrentPage(1);
                    }}
                    className="px-4 py-1.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all"
                >
                    মেয়াদ শেষ (Already Expired)
                </button>
                <button 
                    onClick={() => {
                        setStartDate(todayISO);
                        setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                        setCurrentPage(1);
                    }}
                    className="px-4 py-1.5 bg-orange-50 text-orange-600 border border-orange-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-100 transition-all"
                >
                    আগামী ৩০ দিন (Next 30 Days)
                </button>
                <button 
                    onClick={() => {
                        setStartDate(todayISO);
                        setEndDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                        setCurrentPage(1);
                    }}
                    className="px-4 py-1.5 bg-primary-50 text-primary-600 border border-primary-100 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary-100 transition-all"
                >
                    আগামী ৯০ দিন (Next 90 Days)
                </button>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="expStart" className="block text-xs font-medium text-gray-600 mb-1">{t('expiryReport.startDate', 'Start Date')}</label>
            <input 
              type="date" id="expStart" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="expEnd" className="block text-xs font-medium text-gray-600 mb-1">{t('expiryReport.endDate', 'End Date')}</label>
            <input 
              type="date" id="expEnd" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] sm:text-sm"
            />
          </div>
          <div className="text-xs text-gray-500 italic pb-2">
            {t('dashboard.shortExpiryDescription')}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="print-area">
            <div className="hidden print:block mb-4">
            {logoUrl && <img src={logoUrl} alt="Logo" className="print-header-logo"/>}
            <div className="print-report-title">{appName} - {t('expiryReport.title')}</div>
            <div className="print-report-subtitle">
                {t('reports.filterByDate')}: {formatDate(startDate)} {t('common.to', 'to')} {formatDate(endDate)}
            </div>
            </div>

            {reportData.length === 0 ? (
            <div className="text-center py-12">
                <WarningIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('reports.noSalesForCustomer', 'No expiring products found')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('dashboard.noUpcomingExpiries')}</p>
            </div>
            ) : (
            <>
                <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <TableHeader label={t('expiryReport.brandName', 'Brand Name')} sortKey="medicationName" onSort={onSort} sortConfig={sortConfig} />
                        <TableHeader label={t('expiryReport.genericName', 'Generic Name')} sortKey="genericName" onSort={onSort} sortConfig={sortConfig} />
                        <TableHeader label={t('expiryReport.batchNo', 'Batch #')} sortKey="batchNumber" onSort={onSort} sortConfig={sortConfig} />
                        <TableHeader label={t('expiryReport.expiryDate', 'Expiry Date')} sortKey="expiryDate" onSort={onSort} sortConfig={sortConfig} />
                        <TableHeader label={t('expiryReport.stock', 'Stock')} sortKey="quantityInStock" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                        <TableHeader label={t('expiryReport.location', 'Location')} sortKey="location" onSort={onSort} sortConfig={sortConfig} />
                        {onStockOut && <th className="px-3 py-3"></th>}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((item) => {
                        const isExpired = item.expiryDate < today;
                        return (
                            <tr key={item.batchId} className={`hover:bg-gray-50 text-sm ${isExpired ? 'bg-red-50' : ''}`}>
                            <td className="px-3 py-2 text-gray-900 font-medium uppercase">{item.medicationName}</td>
                            <td className="px-3 py-2 text-gray-500">{item.genericName}</td>
                            <td className="px-3 py-2 text-gray-600 font-mono">{item.batchNumber}</td>
                            <td className={`px-3 py-2 ${isExpired ? 'text-red-700 font-bold' : 'text-gray-700'}`}>
                                {formatDate(item.expiryDate)}
                                {isExpired && <span className="ml-2 text-[10px] uppercase bg-red-100 px-1 rounded">{t('productStatus.expired')}</span>}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700 font-bold">{item.quantityInStock}</td>
                            <td className="px-3 py-2 text-gray-500">{item.location}</td>
                            {onStockOut && (
                              <td className="px-3 py-2 text-right">
                                <button 
                                  onClick={() => onStockOut(item)}
                                  disabled={item.quantityInStock <= 0}
                                  className="px-3 py-1 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all disabled:opacity-50"
                                >
                                  Stock Out
                                </button>
                              </td>
                            )}
                            </tr>
                        );
                        })}
                    </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {reportData.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-lg print:hidden">
                        <div className="flex flex-1 justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs text-gray-700">
                                    Showing <span className="font-bold">{startIndex + 1}</span> to <span className="font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, reportData.length)}</span> of <span className="font-bold">{reportData.length}</span> results
                                </p>
                            </div>
                            <div>
                                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Previous</span>
                                        <ChevronDownIcon className="h-4 w-4 rotate-90" aria-hidden="true" />
                                    </button>
                                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Next</span>
                                        <ChevronUpIcon className="h-4 w-4 rotate-90" aria-hidden="true" />
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </>
            )}
            <div className="hidden print:block print-footer-info mt-8">
                {t('print.printed')}: {new Date().toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA')} {t('common.at', 'at')} {new Date().toLocaleTimeString()}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiryReportView;
