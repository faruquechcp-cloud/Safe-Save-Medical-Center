
import React, { useMemo } from 'react';
import { 
  MedicationItem, 
  SaleInvoice, 
  PurchaseInvoice, 
  ServiceInvoice, 
  SaleReturnInvoice, 
  PurchaseReturnInvoice, 
  CashTransaction, 
  ViewMode 
} from '../types';
import WarningIcon from './icons/WarningIcon';
import PillIcon from './icons/PillIcon';
import ReceiptIcon from './icons/ReceiptIcon'; 
import ChartBarIcon from './icons/ChartBarIcon';
import InventoryIcon from './icons/InventoryIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import TrendingUpIcon from './icons/TrendingUpIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import { getTotalQuantityForMedication } from '../utils/formatUtils';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';

interface DashboardViewProps {
  medications: MedicationItem[];
  saleInvoices: SaleInvoice[];
  purchaseInvoices: PurchaseInvoice[];
  serviceInvoices: ServiceInvoice[];
  saleReturnInvoices: SaleReturnInvoice[];
  purchaseReturnInvoices: PurchaseReturnInvoice[];
  cashTransactions: CashTransaction[];
  onNavigate: (view: ViewMode) => void; 
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
  medications, 
  saleInvoices, 
  purchaseInvoices,
  serviceInvoices,
  saleReturnInvoices,
  purchaseReturnInvoices,
  cashTransactions,
  onNavigate 
}) => {
  const { t, currentLanguage } = useTranslations();
  const { appName } = useSettings();
  
  const todayDt = new Date();
  todayDt.setHours(0, 0, 0, 0); 
  const endOfTodayDt = new Date();
  endOfTodayDt.setHours(23, 59, 59, 999);

  const getFinancials = (start: Date | null, end: Date | null) => {
    const filterByDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    };

    const sales = (saleInvoices || []).filter(inv => filterByDate(inv.date)).reduce((sum, inv) => sum + inv.totalAmount, 0);
    const services = (serviceInvoices || []).filter(inv => filterByDate(inv.date)).reduce((sum, inv) => sum + inv.totalAmount, 0);
    const saleReturns = (saleReturnInvoices || []).filter(inv => filterByDate(inv.date)).reduce((sum, inv) => sum + inv.totalRefundAmount, 0);
    
    const purchases = (purchaseInvoices || []).filter(inv => filterByDate(inv.date)).reduce((sum, inv) => sum + inv.totalAmount, 0);
    const purchaseReturns = (purchaseReturnInvoices || []).filter(inv => filterByDate(inv.date)).reduce((sum, inv) => sum + inv.totalCreditAmount, 0);
    
    const cashIncome = (cashTransactions || []).filter(tx => tx.type === 'income' && filterByDate(tx.date)).reduce((sum, tx) => sum + tx.amount, 0);
    const cashExpense = (cashTransactions || []).filter(tx => tx.type === 'expense' && filterByDate(tx.date)).reduce((sum, tx) => sum + tx.amount, 0);

    const income = sales + services + cashIncome - saleReturns;
    const expense = purchases + cashExpense - purchaseReturns;
    const profit = income - expense;

    return { income, expense, profit };
  };

  const monthlyFinancials = useMemo(() => {
    const start = new Date(todayDt.getFullYear(), todayDt.getMonth(), 1);
    const end = new Date(todayDt.getFullYear(), todayDt.getMonth() + 1, 0, 23, 59, 59, 999);
    return getFinancials(start, end);
  }, [saleInvoices, purchaseInvoices, serviceInvoices, saleReturnInvoices, purchaseReturnInvoices, cashTransactions]);

  const yearlyFinancials = useMemo(() => {
    const start = new Date(todayDt.getFullYear(), 0, 1);
    const end = new Date(todayDt.getFullYear(), 11, 31, 23, 59, 59, 999);
    return getFinancials(start, end);
  }, [saleInvoices, purchaseInvoices, serviceInvoices, saleReturnInvoices, purchaseReturnInvoices, cashTransactions]);

  const allTimeFinancials = useMemo(() => {
    return getFinancials(null, null);
  }, [saleInvoices, purchaseInvoices, serviceInvoices, saleReturnInvoices, purchaseReturnInvoices, cashTransactions]);

  const todaySaleInvoices = (saleInvoices || []).filter(invoice => {
    const invoiceDate = new Date(invoice.date);
    return invoiceDate >= todayDt && invoiceDate <= endOfTodayDt;
  });

  const lowStockItems = medications.filter(m => {
    if (m.isActive === false) return false;
    const totalQty = getTotalQuantityForMedication(m);
    return (m.batches && m.batches.length > 0) && totalQty <= m.lowStockThreshold;
  });

  const todayTotalRevenue = todaySaleInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
  const todayTotalDue = todaySaleInvoices.reduce((sum, inv) => sum + (Number(inv.amountDue) || 0), 0);

  const todayTotalProfit = todaySaleInvoices.reduce((sum, inv) => {
    const cost = inv.items.reduce((itemSum, item) => itemSum + ((item.costPriceAtSale || 0) * item.quantity), 0);
    return sum + (inv.totalAmount - cost);
  }, 0);

  const expiredBatches = useMemo(() => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return medications.flatMap(m => 
      (m.batches || []).filter(b => {
        if (!b.expiryDate) return false;
        return b.expiryDate <= thirtyDaysFromNow && b.quantityInStock > 0;
      }).map(b => ({ medication: m, batch: b }))
    ).sort((a, b) => a.batch.expiryDate.localeCompare(b.batch.expiryDate));
  }, [medications]);

  const topCustomers = useMemo(() => {
    const customerMap = new Map<string, { name: string, total: number }>();
    (saleInvoices || []).forEach(inv => {
      const name = inv.customerName || t('reports.walkInCustomer');
      const current = customerMap.get(name) || { name, total: 0 };
      current.total += inv.totalAmount;
      customerMap.set(name, current);
    });
    return Array.from(customerMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [saleInvoices, t]);

  const topProducts = useMemo(() => {
    const productMap = new Map<string, { name: string, qty: number, unit: string }>();
    (saleInvoices || []).forEach(inv => {
      inv.items.forEach(item => {
        const current = productMap.get(item.medicationId) || { name: item.medicationName, qty: 0, unit: '' };
        current.qty += item.quantity;
        if (!current.unit) {
            const med = medications.find(m => m.id === item.medicationId);
            current.unit = med?.unitOfMeasure || 'টি';
        }
        productMap.set(item.medicationId, current);
      });
    });
    return Array.from(productMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [saleInvoices, medications]);

  const formatNum = (num: number) => num.toLocaleString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US');

  const colorMap: Record<string, { bg: string, border: string, iconBg: string, iconShadow: string, text: string, subText: string }> = {
    indigo: {
      bg: 'from-white to-indigo-50',
      border: 'border-indigo-100',
      iconBg: 'bg-indigo-500',
      iconShadow: 'shadow-indigo-200',
      text: 'text-indigo-600/60',
      subText: 'text-indigo-700'
    },
    violet: {
      bg: 'from-white to-violet-50',
      border: 'border-violet-100',
      iconBg: 'bg-violet-500',
      iconShadow: 'shadow-violet-200',
      text: 'text-violet-600/60',
      subText: 'text-violet-700'
    },
    amber: {
      bg: 'from-white to-amber-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-500',
      iconShadow: 'shadow-amber-200',
      text: 'text-amber-600/60',
      subText: 'text-amber-700'
    }
  };

  const FinancialCard = ({ title, data, colorClass, icon: Icon }: { title: string, data: { income: number, expense: number, profit: number }, colorClass: string, icon: any }) => {
    const colors = colorMap[colorClass] || colorMap.indigo;
    
    return (
      <div className={`bg-gradient-to-br ${colors.bg} p-6 rounded-2xl shadow-sm border ${colors.border} relative overflow-hidden group hover:shadow-xl transition-all`}>
          <div className={`absolute -top-10 -right-10 w-32 h-32 ${colorClass === 'indigo' ? 'bg-indigo-100/30' : colorClass === 'violet' ? 'bg-violet-100/30' : 'bg-amber-100/30'} rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
          <div className="relative z-10">
              <div className={`p-2 ${colors.iconBg} text-white rounded-lg w-fit mb-4 shadow-lg ${colors.iconShadow}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className={`text-[10px] font-black ${colors.text} uppercase tracking-widest mb-1`}>{title}</p>
              <h3 className={`text-2xl font-black tracking-tighter ${data.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {t('common.tk')} {formatNum(data.profit)}
              </h3>
              
              <div className="mt-4 flex flex-col gap-1.5">
                  <div className={`flex items-center text-[8px] font-black ${colors.subText} bg-white/60 w-fit px-2 py-0.5 rounded-md border ${colors.border} backdrop-blur-sm`}>
                      {t('accounting.totalIncome')} : {t('common.tk')} {formatNum(data.income)}
                  </div>
                  <div className="flex items-center text-[8px] font-black text-slate-600 bg-white/60 w-fit px-2 py-0.5 rounded-md border border-slate-200 backdrop-blur-sm">
                      {t('accounting.totalExpense')} : {t('common.tk')} {formatNum(data.expense)}
                  </div>
              </div>
          </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{t('header.dashboard')}</h2>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2 bg-white w-fit px-3 py-1 rounded-full shadow-sm">{t('dashboard.welcome')}</p>
        </div>
        <div className="bg-primary-600 px-6 py-3 rounded-2xl shadow-lg shadow-primary-200 flex items-center space-x-3 border border-primary-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
            <span className="text-[10px] font-black uppercase text-white tracking-widest">{t('dashboard.systemOnline')}</span>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {/* Revenue Card (Today) */}
          <div className="bg-gradient-to-br from-white to-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100/30 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                  <div className="p-2 bg-emerald-500 text-white rounded-lg w-fit mb-4 shadow-lg shadow-emerald-200">
                    <ReceiptIcon className="w-5 h-5" />
                  </div>
                  <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-1">{t('dashboard.todayRevenue')}</p>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{t('common.tk')} {formatNum(todayTotalRevenue)}</h3>
                  <div className="mt-4 flex flex-col gap-1.5">
                    <div className="flex items-center text-[8px] font-black text-emerald-700 bg-white/60 w-fit px-2 py-0.5 rounded-md border border-emerald-200 backdrop-blur-sm">
                      {t('dashboard.todayTotalSale')} : {todaySaleInvoices.length}
                    </div>
                    <div className="flex items-center text-[8px] font-black text-primary-700 bg-white/60 w-fit px-2 py-0.5 rounded-md border border-primary-200 backdrop-blur-sm">
                      {t('dashboard.todayProfit')} : {t('common.tk')} {formatNum(todayTotalProfit)}
                    </div>
                    {todayTotalDue > 0 && (
                      <div className="flex items-center text-[8px] font-black text-rose-700 bg-white/60 w-fit px-2 py-0.5 rounded-md border border-rose-200 backdrop-blur-sm">
                        {t('dashboard.todayDue')} : {t('common.tk')} {formatNum(todayTotalDue)}
                      </div>
                    )}
                  </div>
              </div>
          </div>

          {/* Merged Items & Alerts Card */}
          <div className="bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100/30 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                  <div className="p-2 bg-blue-500 text-white rounded-lg w-fit mb-4 shadow-lg shadow-blue-200">
                    <InventoryIcon className="w-5 h-5" />
                  </div>
                  <div className="space-y-4">
                      <div>
                          <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest mb-1">{t('dashboard.totalItems')}</p>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatNum(medications.length)}</h3>
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-rose-600/60 uppercase tracking-widest mb-1">{t('dashboard.stockAlerts')}</p>
                          <h3 className={`text-2xl font-black tracking-tighter ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatNum(lowStockItems.length)}</h3>
                      </div>
                  </div>
              </div>
          </div>

          {/* Monthly Summary */}
          <FinancialCard title={t('reports.lastMonth')} data={monthlyFinancials} colorClass="indigo" icon={CalendarDaysIcon} />

          {/* Yearly Summary */}
          <FinancialCard title={new Date().getFullYear().toString() + ' ' + t('header.reports')} data={yearlyFinancials} colorClass="violet" icon={TrendingUpIcon} />

          {/* All-time Summary */}
          <FinancialCard title={t('reports.allTime')} data={allTimeFinancials} colorClass="amber" icon={ArchiveBoxIcon} />

          {/* Quick Action Card */}
          <button 
            onClick={() => onNavigate('sales')}
            className="bg-gradient-to-br from-slate-900 to-primary-950 p-6 rounded-2xl shadow-2xl relative overflow-hidden group hover:shadow-primary-900/20 transition-all text-left border border-slate-800"
          >
              <div className="absolute bottom-0 right-0 p-2 opacity-20 transform translate-x-4 translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500">
                <ChartBarIcon className="w-24 h-24 text-primary-500" />
              </div>
              <div className="relative z-10">
                  <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.2em] mb-3">{t('dashboard.action')}</p>
                  <h3 className="text-xl font-black text-white tracking-tight leading-tight uppercase">{t('dashboard.startNewSale')}</h3>
                  <div className="mt-6 flex items-center space-x-3 text-primary-400 font-black text-[10px] uppercase tracking-widest group-hover:text-white transition-colors">
                    <span>{t('dashboard.posModule')}</span>
                    <span className="transform group-hover:translate-x-2 transition-transform">&rarr;</span>
                  </div>
              </div>
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                         <InventoryIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">
                        {t('dashboard.stockAlertTitle')}
                    </h3>
                  </div>
                  <button onClick={() => onNavigate('lowStock')} className="px-5 py-2 bg-white text-[9px] font-black text-primary-600 uppercase border border-primary-100 rounded-full hover:bg-primary-50 transition-all">
                      {t('reports.lowStockList')}
                  </button>
              </div>
              <div className="divide-y divide-slate-50 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {lowStockItems.length > 0 ? (
                    lowStockItems.map(m => (
                        <div key={m.id} className="px-10 py-6 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                            <div>
                                <p className="text-sm font-black text-slate-800 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{m.name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{m.genericName} • {m.manufacturer}</p>
                            </div>
                            <div className="flex items-center space-x-6">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.stockLabel')}</p>
                                    <p className={`text-lg font-black tracking-tighter ${getTotalQuantityForMedication(m) === 0 ? 'text-rose-600' : 'text-orange-600'}`}>
                                        {formatNum(getTotalQuantityForMedication(m))} <span className="text-[10px] font-bold text-slate-400">{m.unitOfMeasure || 'টি'}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))
                  ) : (
                    <div className="p-24 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t('dashboard.allStockHealthy')}</p>
                    </div>
                  )}
              </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                         <WarningIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">
                        {t('dashboard.expiredProducts')}
                    </h3>
                  </div>
                  <button onClick={() => onNavigate('expiryReport')} className="px-5 py-2 bg-white text-[9px] font-black text-rose-600 uppercase border border-rose-100 rounded-full hover:bg-rose-50 transition-all">{t('dashboard.viewAll')}</button>
              </div>
              <div className="divide-y divide-slate-50 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {expiredBatches.length > 0 ? (
                    expiredBatches.map((eb, idx) => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isExpired = eb.batch.expiryDate < todayStr;
                        const isToday = eb.batch.expiryDate === todayStr;
                        
                        return (
                            <div key={`${eb.medication.id}-${idx}`} className="px-10 py-6 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <p className={`text-sm font-black text-slate-800 transition-colors uppercase tracking-tight ${isExpired ? 'group-hover:text-rose-600' : isToday ? 'group-hover:text-orange-600' : 'group-hover:text-amber-600'}`}>{eb.medication.name}</p>
                                        {isExpired ? (
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase rounded-full border border-rose-200 shadow-sm">{t('productStatus.expired')}</span>
                                        ) : isToday ? (
                                            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[8px] font-black uppercase rounded-full border border-orange-200 shadow-sm">{t('productStatus.expiresToday')}</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black uppercase rounded-full border border-amber-200 shadow-sm">{t('productStatus.expiringSoon')}</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                      {t('productForm.batchNo')}: {eb.batch.batchNumber} • {t('productForm.expiry')}: {new Date(eb.batch.expiryDate).toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-6">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('dashboard.stockLabel')}</p>
                                        <p className={`text-lg font-black tracking-tighter ${isExpired ? 'text-rose-600' : isToday ? 'text-orange-600' : 'text-amber-600'}`}>
                                            {formatNum(eb.batch.quantityInStock)} <span className="text-[10px] font-bold text-slate-400">{eb.medication.unitOfMeasure || 'টি'}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                  ) : (
                    <div className="p-24 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t('dashboard.allStockHealthy')}</p>
                    </div>
                  )}
              </div>
          </div>

          <div className="lg:col-span-2 xl:col-span-1 bg-white rounded-3xl shadow-sm border border-slate-100 p-10 flex flex-col items-center text-center justify-between">
              <div className="mt-6 w-full">
                <div className="w-28 h-28 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-white relative group">
                    <div className="absolute inset-0 bg-primary-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                    <PillIcon className="w-14 h-14 text-slate-300 group-hover:text-primary-400 transition-colors" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">{appName}</h3>
                <div className="h-1 w-12 bg-primary-500 mx-auto mb-6 rounded-full"></div>
                <p className="text-[10px] font-bold text-slate-400 leading-loose uppercase px-6 tracking-widest">{t('dashboard.securityNote')}</p>
              </div>

              <div className="w-full space-y-4 mt-12">
                <button onClick={() => onNavigate('accounting')} className="w-full py-5 bg-slate-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-xl">{t('dashboard.financialLedger')}</button>
                <button onClick={() => onNavigate('reports')} className="w-full py-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95">{t('dashboard.reportAnalysis')}</button>
              </div>
          </div>
      </div>

      {/* Top Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Top Customers */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 bg-gradient-to-r from-primary-50 to-primary-100/50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                         <ReceiptIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">
                        {t('dashboard.topCustomers')}
                    </h3>
                  </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {topCustomers.length > 0 ? (
                    topCustomers.map((c, idx) => (
                        <div key={idx} className="px-10 py-6 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center space-x-4">
                                <span className="text-xs font-black text-slate-300 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                                <div>
                                    <p className="text-sm font-black text-slate-800 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{c.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('reports.totalSales')}</p>
                                <p className="text-lg font-black tracking-tighter text-primary-600">
                                    {t('common.tk')} {formatNum(c.total)}
                                </p>
                            </div>
                        </div>
                    ))
                  ) : (
                    <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                        No data available
                    </div>
                  )}
              </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-200">
                         <InventoryIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em]">
                        {t('dashboard.topProducts')}
                    </h3>
                  </div>
              </div>
              <div className="divide-y divide-slate-50 max-h-[450px] overflow-y-auto custom-scrollbar">
                  {topProducts.length > 0 ? (
                    topProducts.map((p, idx) => (
                        <div key={idx} className="px-10 py-6 flex justify-between items-center hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center space-x-4">
                                <span className="text-xs font-black text-slate-300 w-6">{(idx + 1).toString().padStart(2, '0')}</span>
                                <div>
                                    <p className="text-sm font-black text-slate-800 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{p.name}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('productForm.qty')}</p>
                                <p className="text-lg font-black tracking-tighter text-primary-600">
                                    {formatNum(p.qty)} <span className="text-[10px] font-bold text-slate-400">{p.unit}</span>
                                </p>
                            </div>
                        </div>
                    ))
                  ) : (
                    <div className="p-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                        No data available
                    </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default DashboardView;
