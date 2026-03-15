
import React, { useMemo, useState, useEffect } from 'react';
import { MedicationItem, StockOnHandReportItem, GenericSortConfig, SortableStockOnHandReportKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import PrinterIcon from './icons/PrinterIcon';
import SearchIcon from './icons/SearchIcon';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';

interface StockOnHandReportViewProps {
  medications: MedicationItem[];
  sortConfig: GenericSortConfig<SortableStockOnHandReportKeys> | null;
  onSort: (key: SortableStockOnHandReportKeys) => void;
}

const ITEMS_PER_PAGE = 20;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableStockOnHandReportKeys; 
    onSort: (key: SortableStockOnHandReportKeys) => void; 
    sortConfig: GenericSortConfig<SortableStockOnHandReportKeys> | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-4 py-3.5 text-left text-xs font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:bg-gray-100 transition-all ${className}`}
        onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
            direction === 'ascending' ? 
            <ChevronUpIcon className="ml-1.5 w-3 h-3 text-primary-500" /> : 
            <ChevronDownIcon className="ml-1.5 w-3 h-3 text-primary-500" />
        )}
      </div>
    </th>
  );
};

const StockOnHandReportView: React.FC<StockOnHandReportViewProps> = ({ medications, sortConfig, onSort }) => {
  const { t } = useTranslations();
  const { appName, logoUrl } = useSettings();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const reportData = useMemo(() => {
    const data: StockOnHandReportItem[] = [];
    medications.forEach(med => {
      med.batches.forEach(batch => {
        if (batch.quantityInStock > 0) {
          data.push({
            medicationId: med.id,
            medicationName: med.name,
            genericName: med.genericName,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantityInStock: batch.quantityInStock,
            costPrice: batch.costPrice,
            totalPurchaseValue: batch.quantityInStock * batch.costPrice,
          });
        }
      });
    });
    return data;
  }, [medications]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return reportData;
    const term = searchTerm.toLowerCase();
    return reportData.filter(item => 
        item.medicationName.toLowerCase().includes(term) ||
        item.genericName.toLowerCase().includes(term) ||
        item.batchNumber.toLowerCase().includes(term)
    );
  }, [reportData, searchTerm]);

  const sortedReportData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          comparison = valA - valB;
        } else {
          comparison = String(valA).localeCompare(String(valB), 'bn');
        }
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedReportData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedReportData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const grandTotalPurchaseValue = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + item.totalPurchaseValue, 0);
  }, [filteredData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white shadow-2xl rounded-[32px] border border-gray-100 flex flex-col h-[calc(100vh-200px)] overflow-hidden">
      {/* Action Header */}
      <div className="print:hidden p-6 sm:p-8 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl">
                <ClipboardDocumentListIcon className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{t('reports.stockOnHand')}</h2>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Inventory Audit Tool</p>
            </div>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('common.searchProduct')}
                    className="block w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary-500/10 outline-none shadow-sm transition-all"
                />
            </div>
            <button
                onClick={handlePrint}
                className="flex items-center px-6 py-2.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-100 transition-all active:scale-95 shrink-0"
            >
                <PrinterIcon className="w-4 h-4 mr-2" /> {t('reports.printButton')}
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <div className="print-area p-6 sm:p-8">
            {/* Print Header */}
            <div className="hidden print:block mb-8 text-center border-b pb-6">
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mx-auto mb-4 object-contain"/>}
                <h1 className="text-2xl font-black uppercase text-gray-900">{appName}</h1>
                <h2 className="text-lg font-bold text-gray-600 uppercase mt-2">{t('reports.stockOnHand')}</h2>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Generated: {new Date().toLocaleString()}</p>
            </div>

            {paginatedData.length === 0 ? (
                <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
                    <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-200" />
                    <h3 className="mt-4 text-sm font-black text-gray-400 uppercase tracking-widest">
                        {searchTerm ? "কোন ফলাফল পাওয়া যায়নি" : "স্টক তথ্য নেই"}
                    </h3>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/30">
                            <tr>
                                <TableHeader label={t('productForm.nameLabel')} sortKey="medicationName" onSort={onSort} sortConfig={sortConfig} />
                                <TableHeader label={t('productForm.genericLabel')} sortKey="genericName" onSort={onSort} sortConfig={sortConfig} />
                                <TableHeader label={t('productForm.batchNo')} sortKey="batchNumber" onSort={onSort} sortConfig={sortConfig} />
                                <TableHeader label={t('productForm.qty')} sortKey="quantityInStock" onSort={onSort} sortConfig={sortConfig} className="text-center" />
                                <TableHeader label={t('productForm.cost')} sortKey="costPrice" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                                <TableHeader label={t('saleInvoiceForm.item.total')} sortKey="totalPurchaseValue" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {paginatedData.map((item) => (
                                <tr key={item.batchId} className="hover:bg-primary-50/30 transition-all group">
                                    <td className="px-4 py-4 text-sm font-black text-gray-900 uppercase tracking-tight whitespace-nowrap">{item.medicationName}</td>
                                    <td className="px-4 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">{item.genericName}</td>
                                    <td className="px-4 py-4 text-xs font-mono text-gray-400 whitespace-nowrap">{item.batchNumber}</td>
                                    <td className="px-4 py-4 text-sm font-black text-gray-700 whitespace-nowrap text-center">
                                        <span className="bg-gray-100 px-3 py-1 rounded-full">{item.quantityInStock}</span>
                                    </td>
                                    <td className="px-4 py-4 text-sm font-bold text-gray-500 whitespace-nowrap text-right">{item.costPrice.toFixed(2)}</td>
                                    <td className="px-4 py-4 text-sm font-black text-primary-600 whitespace-nowrap text-right">Tk. {item.totalPurchaseValue.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-900 text-white rounded-b-2xl">
                            <tr>
                                <td colSpan={5} className="px-6 py-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    {t('purchaseInvoiceForm.summary.subtotal')}:
                                </td>
                                <td className="px-6 py-6 text-right">
                                    <span className="text-xl font-black tracking-tighter">
                                        Tk. {grandTotalPurchaseValue.toFixed(2)}
                                    </span>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
          <div className="shrink-0 py-4 px-8 flex items-center justify-between bg-gray-50 border-t border-gray-100 print:hidden">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          Showing <span className="text-gray-900">{startIndex + 1}</span> to <span className="text-gray-900">{Math.min(startIndex + ITEMS_PER_PAGE, sortedReportData.length)}</span> of <span className="text-gray-900">{sortedReportData.length}</span>
                      </p>
                  </div>
                  <div>
                      <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px overflow-hidden border border-gray-200" aria-label="Pagination">
                          <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                            disabled={currentPage === 1} 
                            className="relative inline-flex items-center px-4 py-2 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                              <ChevronDownIcon className="h-4 w-4 rotate-90" />
                          </button>
                          <div className="relative inline-flex items-center px-6 py-2 bg-white text-[10px] font-black text-gray-700 uppercase tracking-widest border-x border-gray-100">
                              Page {currentPage} of {totalPages}
                          </div>
                          <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                            disabled={currentPage === totalPages} 
                            className="relative inline-flex items-center px-4 py-2 bg-white text-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                              <ChevronUpIcon className="h-4 w-4 rotate-90" />
                          </button>
                      </nav>
                  </div>
              </div>
          </div>
      )}

      <div className="hidden print:block p-4 text-[8px] font-black text-gray-300 uppercase tracking-widest text-center">
        Report generated by Safe & Save ERP System
      </div>
    </div>
  );
};

export default StockOnHandReportView;
