
import React, { useState, useEffect, useRef } from 'react';
import { MedicationItem, SortConfig, SortableMedicationKeys } from '../types';
import MedicationRow from './MedicationRow';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { useTranslations } from '../hooks/useTranslations';

interface InventoryTableProps {
  medications: (MedicationItem & { totalQuantityInStock: number, soonestExpiryDate: string | null })[]; 
  onEdit: (item: MedicationItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: MedicationItem) => void;
  onSort: (key: SortableMedicationKeys) => void;
  sortConfig: SortConfig | null;
}

const ITEMS_PER_PAGE = 25;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableMedicationKeys; 
    onSort: (key: SortableMedicationKeys) => void; 
    sortConfig: SortConfig | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-white hover:bg-slate-800 transition-all whitespace-nowrap sticky top-0 z-20 bg-slate-900 ${className}`}
        onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
            direction === 'ascending' ? 
            <ChevronUpIcon className="ml-2 w-3.5 h-3.5 text-primary-400" /> : 
            <ChevronDownIcon className="ml-2 w-3.5 h-3.5 text-primary-400" />
        )}
      </div>
    </th>
  );
};


const InventoryTable: React.FC<InventoryTableProps> = ({ medications, onEdit, onDelete, onDuplicate, onSort, sortConfig }) => {
  const { t } = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(medications.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = medications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIndex(-1);
  }, [medications.length]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setSelectedIndex(-1);
      tableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (medications.length === 0) {
    return (
      <div className="text-center py-32 bg-white rounded-[48px] shadow-sm border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="h-28 w-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <svg className="h-14 w-14 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{t('productTable.noProductsFound')}</h3>
        <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">{t('productTable.getStarted')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] bg-white rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden transition-all">
      <div className="flex-1 overflow-auto custom-scrollbar relative" ref={tableContainerRef}>
        <table className="min-w-full divide-y divide-slate-100 table-fixed">
          <thead>
            <tr>
              <TableHeader label={t('saleInvoiceForm.item.medication')} sortKey="name" onSort={onSort} sortConfig={sortConfig} className="w-[220px]" />
              <TableHeader label={t('productForm.genericLabel')} sortKey="genericName" onSort={onSort} sortConfig={sortConfig} className="w-[180px]" />
              <TableHeader label={t('productForm.formLabel')} sortKey="form" onSort={onSort} sortConfig={sortConfig} className="w-[120px]" />
              <TableHeader label={t('productForm.manufacturerLabel')} sortKey="manufacturer" onSort={onSort} sortConfig={sortConfig} className="w-[160px]" />
              <TableHeader label={t('saleInvoiceForm.item.qty')} sortKey="totalQuantityInStock" onSort={onSort} sortConfig={sortConfig} className="w-[110px] text-center"/>
              <TableHeader label={t('productForm.expiry')} sortKey="soonestExpiryDate" onSort={onSort} sortConfig={sortConfig} className="w-[140px]" />
              <TableHeader label={t('productForm.locationLabel')} sortKey="location" onSort={onSort} sortConfig={sortConfig} className="w-[130px]" />
              <th scope="col" className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sticky top-0 z-20 bg-slate-900 w-[150px]">Status</th>
              <th scope="col" className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sticky top-0 z-20 bg-slate-900 w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-50">
            {currentItems.map((item, index) => (
               <MedicationRow 
                    key={item.id}
                    item={item as MedicationItem} 
                    onEdit={onEdit} 
                    onDelete={onDelete}
                    onDuplicate={onDuplicate} 
                    isSelected={selectedIndex === index}
                    onClick={() => setSelectedIndex(index)}
                />
            ))}
          </tbody>
        </table>
      </div>

      <div className="shrink-0 py-6 px-10 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white gap-6">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Results: <span className="text-slate-900">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, medications.length)}</span> / <span className="text-slate-900">{medications.length}</span>
        </p>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-4 bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-600 rounded-2xl transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
          >
            <ChevronDownIcon className="h-5 w-5 rotate-90" />
          </button>
          
          <div className="flex items-center space-x-1.5">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = currentPage;
              if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;
              
              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-11 h-11 rounded-2xl text-[10px] font-black transition-all active:scale-90 ${
                    currentPage === pageNum 
                    ? 'bg-primary-600 text-white shadow-xl shadow-primary-100' 
                    : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-4 bg-slate-50 text-slate-400 hover:bg-primary-50 hover:text-primary-600 rounded-2xl transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
          >
            <ChevronUpIcon className="h-5 w-5 rotate-90" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InventoryTable;
