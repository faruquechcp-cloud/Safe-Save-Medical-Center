
import React, { useMemo, useState, useCallback } from 'react';
import { SaleInvoice, BatchProfitReportItem, GenericSortConfig, SortableBatchProfitReportKeys } from '../types';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import DocumentChartBarIcon from './icons/DocumentChartBarIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import CurrencyBangladeshiIcon from './icons/CurrencyBangladeshiIcon';
import { useTranslations } from '../hooks/useTranslations';

interface BatchProfitReportViewProps {
  saleInvoices: SaleInvoice[];
  sortConfig: GenericSortConfig<SortableBatchProfitReportKeys> | null;
  onSort: (key: SortableBatchProfitReportKeys) => void;
}

type FilterType = 'all' | 'today' | 'last7days' | 'last30days' | 'custom';

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableBatchProfitReportKeys; 
    onSort: (key: SortableBatchProfitReportKeys) => void; 
    sortConfig: GenericSortConfig<SortableBatchProfitReportKeys> | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-4 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 ${className}`}
        onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
            direction === 'ascending' ? 
            <ChevronUpIcon className="ml-1 w-4 h-4 text-gray-600" /> : 
            <ChevronDownIcon className="ml-1 w-4 h-4 text-gray-600" />
        )}
      </div>
    </th>
  );
};

const BatchProfitReportView: React.FC<BatchProfitReportViewProps> = ({ saleInvoices, sortConfig, onSort }) => {
  const { t } = useTranslations();
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


  const reportData = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    
    const filteredSales = saleInvoices.filter(invoice => {
      if (filterType === 'all' || !startDate || !endDate) {
        return true; 
      }
      const invoiceDate = new Date(invoice.date);
      const invoiceUTCDate = new Date(Date.UTC(invoiceDate.getUTCFullYear(), invoiceDate.getUTCMonth(), invoiceDate.getUTCDate()));
      
      return invoiceUTCDate >= startDate && invoiceUTCDate <= endDate;
    });

    const data: { [key: string]: BatchProfitReportItem } = {};
    filteredSales.forEach(invoice => {
      invoice.items.forEach(saleItem => {
        const key = `${saleItem.medicationId}-${saleItem.batchNumber}`;
        if (!data[key]) {
          data[key] = {
            medicationId: saleItem.medicationId,
            medicationName: saleItem.medicationName,
            batchNumber: saleItem.batchNumber,
            totalQuantitySold: 0,
            totalRevenue: 0,
            totalCOGS: 0,
            profit: 0,
            profitPercentage: 0,
          };
        }
        const cogsForItem = saleItem.costPriceAtSale * saleItem.quantity;
        data[key].totalQuantitySold += saleItem.quantity;
        data[key].totalRevenue += saleItem.totalPrice;
        data[key].totalCOGS += cogsForItem;
        data[key].profit = data[key].totalRevenue - data[key].totalCOGS;
        data[key].profitPercentage = data[key].totalRevenue > 0 
          ? (data[key].profit / data[key].totalRevenue) * 100 
          : 0;
      });
    });
    return Object.values(data);
  }, [saleInvoices, filterType, getDateRange]); 

  const topPerformers = useMemo(() => {
    if (reportData.length === 0) return null;

    const highestPercentage = [...reportData].sort((a, b) => b.profitPercentage - a.profitPercentage)[0];
    const highestAbsolute = [...reportData].sort((a, b) => b.profit - a.profit)[0];

    return { highestPercentage, highestAbsolute };
  }, [reportData]);

  const sortedReportData = useMemo(() => {
    let sortableItems = [...reportData];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
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
    }
    return sortableItems;
  }, [reportData, sortConfig]);

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
  
  const handleFilterChange = (type: FilterType) => {
    setFilterType(type);
    if (type !== 'custom') {
        setCustomStartDate('');
        setCustomEndDate('');
    }
  }


  return (
    <div className="bg-white shadow-xl rounded-lg p-4 sm:p-6">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">{t('reports.profitReport')}</h2>
      </div>

      {topPerformers && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-emerald-500 p-3 rounded-lg text-white">
              <TrendingUpIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">{t('reports.topProfitPercentage')}</p>
              <h3 className="text-lg font-bold text-emerald-900">{topPerformers.highestPercentage.medicationName}</h3>
              <p className="text-sm text-emerald-700 font-semibold">{topPerformers.highestPercentage.profitPercentage.toFixed(2)}%</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4 shadow-sm">
            <div className="bg-blue-500 p-3 rounded-lg text-white">
              <CurrencyBangladeshiIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">{t('reports.topAbsoluteProfit')}</p>
              <h3 className="text-lg font-bold text-blue-900">{topPerformers.highestAbsolute.medicationName}</h3>
              <p className="text-sm text-blue-700 font-semibold">Tk. {topPerformers.highestAbsolute.profit.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 p-3 bg-gray-50 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-sm font-medium text-gray-700">Filter by:</span>
          <FilterButton label="All Time" type="all" activeType={filterType} onClick={handleFilterChange} />
          <FilterButton label="Today" type="today" activeType={filterType} onClick={handleFilterChange} />
          <FilterButton label="Last 7 Days" type="last7days" activeType={filterType} onClick={handleFilterChange} />
          <FilterButton label="Last 30 Days" type="last30days" activeType={filterType} onClick={handleFilterChange} />
          <FilterButton label="Custom" type="custom" activeType={filterType} onClick={handleFilterChange} />
        </div>
        {filterType === 'custom' && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="customStartDate" className="block text-xs font-medium text-gray-600 mb-0.5">Start Date</label>
              <input 
                type="date" 
                id="customStartDate"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                max={customEndDate || todayISO}
                className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-xs focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
              />
            </div>
            <div>
              <label htmlFor="customEndDate" className="block text-xs font-medium text-gray-600 mb-0.5">End Date</label>
              <input 
                type="date" 
                id="customEndDate"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                min={customStartDate}
                max={todayISO}
                className="block w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm sm:text-xs focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
              />
            </div>
             {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
                <p className="col-span-full text-xs text-red-500 mt-1">Start date cannot be after end date.</p>
            )}
          </div>
        )}
      </div>

      {sortedReportData.length === 0 ? (
         <div className="text-center py-10">
            <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Batch Profit Data</h3>
            <p className="mt-1 text-sm text-gray-500">
                {filterType === 'all' 
                ? "There are no sales recorded or medication data to generate this report."
                : "No data found for the selected time period."}
            </p>
         </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <TableHeader label={t('reports.medicationName')} sortKey="medicationName" onSort={onSort} sortConfig={sortConfig} />
                <TableHeader label={t('reports.batchNumber')} sortKey="batchNumber" onSort={onSort} sortConfig={sortConfig} />
                <TableHeader label={t('reports.qtySold')} sortKey="totalQuantitySold" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                <TableHeader label={t('reports.revenue')} sortKey="totalRevenue" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                <TableHeader label={t('reports.cogs')} sortKey="totalCOGS" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                <TableHeader label={t('reports.profit')} sortKey="profit" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                <TableHeader label={t('reports.profitPercentage')} sortKey="profitPercentage" onSort={onSort} sortConfig={sortConfig} className="text-right" />
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {sortedReportData.map((item, index) => (
                <tr key={`${item.medicationId}-${item.batchNumber}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.medicationName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{item.batchNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-right">{item.totalQuantitySold}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-right">Tk. {item.totalRevenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-right">Tk. {item.totalCOGS.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-sm whitespace-nowrap text-right font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Tk. {item.profit.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-sm whitespace-nowrap text-right font-medium ${item.profitPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.profitPercentage.toFixed(2)}%
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default BatchProfitReportView;
