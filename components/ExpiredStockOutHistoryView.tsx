
import React, { useMemo } from 'react';
import { ExpiredProductStockOut, GenericSortConfig, SortableExpiredProductStockOutKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { formatCurrency } from '../utils/formatUtils';
import TrashIcon from './icons/TrashIcon';
import { useTranslations } from '../hooks/useTranslations';

interface ExpiredStockOutHistoryViewProps {
  stockOuts: ExpiredProductStockOut[];
  onDelete?: (id: string) => void;
}

const ExpiredStockOutHistoryView: React.FC<ExpiredStockOutHistoryViewProps> = ({ stockOuts, onDelete }) => {
  const { t } = useTranslations();
  const [sortConfig, setSortConfig] = React.useState<GenericSortConfig<SortableExpiredProductStockOutKeys>>({ key: 'date', direction: 'descending' });

  const sortedData = useMemo(() => {
    const result = [...stockOuts];
    result.sort((a: any, b: any) => {
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
    return result;
  }, [stockOuts, sortConfig]);

  const totalLoss = useMemo(() => {
    return stockOuts.reduce((sum, item) => sum + item.totalLoss, 0);
  }, [stockOuts]);

  const handleSort = (key: SortableExpiredProductStockOutKeys) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const TableHeader: React.FC<{ label: string; sortKey: SortableExpiredProductStockOutKeys }> = ({ label, sortKey }) => (
    <th 
      className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {sortConfig.key === sortKey && (
          sortConfig.direction === 'ascending' ? <ChevronUpIcon className="ml-1 w-3 h-3" /> : <ChevronDownIcon className="ml-1 w-3 h-3" />
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white shadow-xl rounded-[32px] p-6 sm:p-10 flex flex-col h-[calc(100vh-140px)] border border-gray-100">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter mb-2">{t('expiredStockOut.title')}</h2>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">{t('expiredStockOut.subtitle')}</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[28px] text-right">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">{t('expiredStockOut.totalLoss')}</p>
          <p className="text-3xl font-black text-rose-600 tracking-tighter">{formatCurrency(totalLoss)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar rounded-2xl border border-gray-50">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/50 sticky top-0 z-10">
            <tr>
              <TableHeader label={t('expiredStockOut.date')} sortKey="date" />
              <TableHeader label={t('expiredStockOut.product')} sortKey="medicationName" />
              <TableHeader label={t('expiredStockOut.batch')} sortKey="batchNumber" />
              <TableHeader label={t('expiredStockOut.qty')} sortKey="quantity" />
              <TableHeader label={t('expiredStockOut.unitCost')} sortKey="unitCost" />
              <TableHeader label={t('expiredStockOut.totalLossCol')} sortKey="totalLoss" />
              {onDelete && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {sortedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-4 text-sm font-bold text-gray-600">{item.date}</td>
                <td className="px-4 py-4 text-sm font-black text-gray-900 uppercase">{item.medicationName}</td>
                <td className="px-4 py-4 text-sm font-mono text-gray-500">{item.batchNumber}</td>
                <td className="px-4 py-4 text-sm font-black text-gray-700">{item.quantity}</td>
                <td className="px-4 py-4 text-sm font-bold text-gray-600">{formatCurrency(item.unitCost)}</td>
                <td className="px-4 py-4 text-sm font-black text-rose-600">{formatCurrency(item.totalLoss)}</td>
                {onDelete && (
                  <td className="px-4 py-4 text-right">
                    <button 
                      onClick={() => {
                        if (confirm(t('expiredStockOut.deleteConfirm'))) {
                          onDelete(item.id);
                        }
                      }}
                      className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-20 text-center">
                  <p className="text-sm font-black text-gray-300 uppercase tracking-widest">{t('expiredStockOut.noRecords')}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpiredStockOutHistoryView;
