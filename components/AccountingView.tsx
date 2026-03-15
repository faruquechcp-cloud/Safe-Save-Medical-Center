
import React, { useState, useEffect, useMemo } from 'react';
import { 
    AccountingSubViewMode, 
    CashTransaction, SortableCashTransactionKeys, GenericSortConfig
} from '../types';
import CashLedgerView from './CashLedgerView';

import CashIcon from './icons/CashIcon';
import ArrowDownCircleIcon from './icons/ArrowDownCircleIcon';
import ArrowUpCircleIcon from './icons/ArrowUpCircleIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import { useTranslations } from '../hooks/useTranslations';

interface AccountingViewProps {
  initialSubView?: AccountingSubViewMode;
  cashTransactions: CashTransaction[];
  cashLedgerSortConfig: GenericSortConfig<SortableCashTransactionKeys> | null;
  onCashLedgerSort: (key: SortableCashTransactionKeys) => void;
  setIsManualTransactionModalOpen: (open: boolean) => void;
  setIsReceivePaymentModalOpen: (open: boolean) => void;
  setIsPaySuppliersModalOpen: (open: boolean) => void;
}

const AccountingView: React.FC<AccountingViewProps> = ({
  initialSubView = 'cashLedger',
  cashTransactions,
  cashLedgerSortConfig,
  onCashLedgerSort,
  setIsManualTransactionModalOpen,
  setIsReceivePaymentModalOpen,
  setIsPaySuppliersModalOpen,
}) => {
  const { t } = useTranslations();
  const [activeSubView, setActiveSubView] = useState<AccountingSubViewMode>(initialSubView);
  
  useEffect(() => {
    setActiveSubView(initialSubView);
  }, [initialSubView]);

  const stats = useMemo(() => {
    const totalIncome = cashTransactions.filter(t => t.type === 'income').reduce((s, c) => s + c.amount, 0);
    const totalExpense = cashTransactions.filter(t => t.type === 'expense').reduce((s, c) => s + c.amount, 0);
    return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
  }, [cashTransactions]);

  const TabButton: React.FC<{id: AccountingSubViewMode, label: string, icon: React.ReactNode}> = ({id, label, icon}) => (
    <button
      onClick={() => setActiveSubView(id)}
      className={`flex flex-col items-center justify-center p-8 rounded-[40px] border-2 transition-all ${activeSubView === id ? 'bg-primary-600 text-white border-primary-600 shadow-2xl shadow-primary-100' : 'bg-white text-slate-400 border-slate-100 hover:border-primary-200'}`}
    >
      <div className="mb-4">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('accounting.totalIncome')}</p>
              <h3 className="text-4xl font-black text-emerald-600 tracking-tighter">Tk. {stats.totalIncome.toFixed(2)}</h3>
          </div>
          <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">{t('accounting.totalExpense')}</p>
              <h3 className="text-4xl font-black text-rose-600 tracking-tighter">Tk. {stats.totalExpense.toFixed(2)}</h3>
          </div>
          <div className="bg-slate-900 p-10 rounded-[48px] shadow-2xl text-white flex flex-col justify-between">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">{t('accounting.currentCashBalance')}</p>
              <h3 className="text-4xl font-black text-primary-400 tracking-tighter">Tk. {stats.balance.toFixed(2)}</h3>
          </div>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <TabButton id="cashLedger" label={t('accounting.cashLedger')} icon={<CashIcon className="w-8 h-8" />} />
        <TabButton id="receiveCustomerPayment" label={t('accounting.dueCollection')} icon={<ArrowDownCircleIcon className="w-8 h-8" />} />
        <TabButton id="paySupplierDue" label={t('accounting.billSettlement')} icon={<ArrowUpCircleIcon className="w-8 h-8" />} />
        <TabButton id="manualTransaction" label={t('accounting.otherEntry')} icon={<PlusCircleIcon className="w-8 h-8" />} />
      </div>

      <div className="bg-white rounded-[56px] border border-slate-100 shadow-sm overflow-hidden p-4 relative">
        {activeSubView === 'cashLedger' && (
            <CashLedgerView 
                transactions={cashTransactions} 
                onAddManualTransaction={() => setActiveSubView('manualTransaction')}
                onSort={onCashLedgerSort}
                sortConfig={cashLedgerSortConfig}
            />
        )}
        {activeSubView === 'manualTransaction' && (
            <div className="p-20 text-center">
                <div className="w-24 h-24 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <PlusCircleIcon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">{t('accounting.newEntryTitle')}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mb-10">{t('accounting.newEntryDesc')}</p>
                <button 
                    onClick={() => setIsManualTransactionModalOpen(true)}
                    className="px-12 py-5 bg-primary-600 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 transition-all"
                >
                    {t('accounting.openForm')}
                </button>
            </div>
        )}
        {activeSubView === 'receiveCustomerPayment' && (
            <div className="p-20 text-center">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ArrowDownCircleIcon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">{t('accounting.receivePaymentTitle')}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mb-10">{t('accounting.receivePaymentDesc')}</p>
                <button onClick={() => setIsReceivePaymentModalOpen(true)} className="px-12 py-5 bg-emerald-600 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 transition-all">
                    {t('accounting.startPayment')}
                </button>
            </div>
        )}
        {activeSubView === 'paySupplierDue' && (
            <div className="p-20 text-center">
                <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ArrowUpCircleIcon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">{t('accounting.paySupplierTitle')}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] mb-10">{t('accounting.paySupplierDesc')}</p>
                <button onClick={() => setIsPaySuppliersModalOpen(true)} className="px-12 py-5 bg-rose-600 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl hover:scale-105 transition-all">
                    {t('accounting.startSupplierPayment')}
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default AccountingView;
