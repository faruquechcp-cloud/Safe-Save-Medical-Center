
import React, { useState } from 'react';
import ChartBarIcon from './icons/ChartBarIcon';
import InventoryIcon from './icons/InventoryIcon';
import ReceiptIcon from './icons/ReceiptIcon';
import UserGroupIcon from './UserGroupIcon';
import TruckIcon from './icons/TruckIcon';
import DocumentChartBarIcon from './icons/DocumentChartBarIcon';
import CashIcon from './icons/CashIcon';
import CloseIcon from './icons/CloseIcon';
import LogoutIcon from './icons/LogoutIcon';
import ArrowUturnLeftIcon from './icons/ArrowUturnLeftIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { ViewMode, AccountingSubViewMode } from './types';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewMode;
  onSetView: (view: ViewMode, subView?: AccountingSubViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onSetView }) => {
  const { t } = useTranslations();
  const { logoUrl, getEffectiveAppName, language } = useSettings();
  const appName = getEffectiveAppName();
  const { logout } = useAuth();
  const [isReportsOpen, setIsReportsOpen] = useState(true);
  
  const isActive = (view: ViewMode) => currentView === view;
  
  const navItemClass = (active: boolean) => `
    w-[90%] mx-auto flex items-center px-4 py-3 text-sm font-bold transition-all duration-200 rounded-xl mb-1
    ${active 
      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20' 
      : 'text-slate-400 hover:text-white hover:bg-primary-800'}
  `;

  const reportSubItemClass = (active: boolean) => `
    w-[80%] mx-auto flex items-center pl-4 pr-4 py-2.5 text-[12px] font-bold transition-all rounded-lg mb-0.5
    ${active 
      ? 'text-primary-400 bg-primary-400/10' 
      : 'text-slate-500 hover:text-primary-300 hover:bg-primary-800/50'}
  `;

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-primary-950/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}

      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-primary-950 text-white shadow-2xl transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-screen flex flex-col`}>
        <div className="flex items-center justify-between h-20 px-6 bg-primary-900/50 border-b border-primary-800 shrink-0">
           <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="sidebar-logo-container w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm shrink-0 overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt={appName} className="w-full h-full object-contain" />
                  ) : (
                    <span className="font-black text-white text-xl">{appName?.charAt(0) || 'S'}</span>
                  )}
              </div>
              <span className="font-black text-base truncate uppercase tracking-tight text-white flex-1 min-w-0">
                {appName}
              </span>
           </div>
           <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white transition-colors ml-2 shrink-0">
              <CloseIcon className="w-6 h-6" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
            <button onClick={() => onSetView('dashboard')} className={navItemClass(isActive('dashboard'))}>
                <ChartBarIcon className="w-5 h-5 mr-3" /> {t('header.dashboard')}
            </button>

            <div className="px-8 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-6 mb-2">
                {t('sidebar.mainModule')}
            </div>
            
            <button onClick={() => onSetView('products')} className={navItemClass(isActive('products'))}>
                <InventoryIcon className="w-5 h-5 mr-3" /> {t('header.products')}
            </button>

            <button onClick={() => onSetView('sales')} className={navItemClass(isActive('sales'))}>
                <ReceiptIcon className="w-5 h-5 mr-3" /> {t('header.sales')}
            </button>

            <button onClick={() => onSetView('serviceInvoices')} className={navItemClass(isActive('serviceInvoices'))}>
                <ClipboardDocumentListIcon className="w-5 h-5 mr-3" /> {t('header.serviceInvoices')}
            </button>

            <button onClick={() => onSetView('serviceDefinitions')} className={navItemClass(isActive('serviceDefinitions'))}>
                <ClipboardDocumentListIcon className="w-5 h-5 mr-3" /> {t('header.services')}
            </button>
            
            <button onClick={() => onSetView('saleReturns')} className={navItemClass(isActive('saleReturns'))}>
                <ArrowUturnLeftIcon className="w-5 h-5 mr-3" /> {t('header.saleReturns')}
            </button>

            <button onClick={() => onSetView('purchases')} className={navItemClass(isActive('purchases'))}>
                <TruckIcon className="w-5 h-5 mr-3" /> {t('header.purchases')}
            </button>

            <button onClick={() => onSetView('purchaseOrders')} className={navItemClass(isActive('purchaseOrders'))}>
                <ClipboardDocumentListIcon className="w-5 h-5 mr-3" /> {language === 'bn' ? 'পার্সেস অর্ডার' : 'Purchase Orders'}
            </button>

            <button onClick={() => onSetView('purchaseReturns')} className={navItemClass(isActive('purchaseReturns'))}>
                <ArrowUturnLeftIcon className="w-5 h-5 mr-3" /> {t('header.purchaseReturns')}
            </button>

            <button onClick={() => onSetView('accounting', 'cashLedger')} className={navItemClass(isActive('accounting'))}>
                <CashIcon className="w-5 h-5 mr-3" /> {t('header.accounting')}
            </button>

            {/* Reports Section */}
            <div className="mt-4">
                <button 
                    onClick={() => setIsReportsOpen(!isReportsOpen)}
                    className="w-[90%] mx-auto flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-primary-800 transition-all rounded-xl"
                >
                    <div className="flex items-center">
                        <DocumentChartBarIcon className="w-5 h-5 mr-3 text-primary-500" />
                        <span>{t('sidebar.reportsAnalytics')}</span>
                    </div>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isReportsOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isReportsOpen && (
                    <div className="bg-primary-900/30 py-2 mt-1 mx-2 rounded-2xl border border-primary-800/50">
                        <button onClick={() => onSetView('profitReport')} className={reportSubItemClass(isActive('profitReport'))}>
                            {t('reports.profitReport')}
                        </button>
                        <button onClick={() => onSetView('todayDueReport')} className={reportSubItemClass(isActive('todayDueReport'))}>
                            {t('reports.todayDueReport')}
                        </button>
                        <button onClick={() => onSetView('customerDueReport')} className={reportSubItemClass(isActive('customerDueReport'))}>
                            {t('reports.customerDues')}
                        </button>
                        <button onClick={() => onSetView('supplierDueReport')} className={reportSubItemClass(isActive('supplierDueReport'))}>
                            {t('reports.supplierDues')}
                        </button>
                        <button onClick={() => onSetView('stockOnHandReport')} className={reportSubItemClass(isActive('stockOnHandReport'))}>
                            {t('reports.stockOnHand')}
                        </button>
                        <button onClick={() => onSetView('lowStock')} className={reportSubItemClass(isActive('lowStock'))}>
                            {t('reports.lowStockList')}
                        </button>
                        <button onClick={() => onSetView('customerSaleReport')} className={reportSubItemClass(isActive('customerSaleReport'))}>
                            {t('reports.customerSaleReport')}
                        </button>
                        <button onClick={() => onSetView('customerTransactionTimelineReport')} className={reportSubItemClass(isActive('customerTransactionTimelineReport'))}>
                            {t('reports.customerTransactionTimeline')}
                        </button>
                        <button onClick={() => onSetView('expiryReport')} className={reportSubItemClass(isActive('expiryReport'))}>
                            {t('reports.expiryReport')}
                        </button>
                        <button onClick={() => onSetView('expiredProducts')} className={reportSubItemClass(isActive('expiredProducts'))}>
                            {t('sidebar.expiredStockOut')}
                        </button>
                    </div>
                )}
            </div>

            <div className="px-8 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-8 mb-2">
                {t('sidebar.dataManagement')}
            </div>
            <button onClick={() => onSetView('customers')} className={navItemClass(isActive('customers'))}>
                <UserGroupIcon className="w-5 h-5 mr-3" /> {t('header.customers')}
            </button>
            <button onClick={() => onSetView('suppliers')} className={navItemClass(isActive('suppliers'))}>
                <TruckIcon className="w-5 h-5 mr-3" /> {t('header.suppliers')}
            </button>
        </div>
        
        <div className="p-6 bg-primary-900/50 border-t border-primary-800">
            <button onClick={() => logout()} className="w-full flex items-center justify-center px-4 py-3 text-sm font-bold text-rose-400 bg-rose-400/10 hover:bg-rose-500 hover:text-white transition-all rounded-xl">
                <LogoutIcon className="w-5 h-5 mr-2" /> {t('header.logout')}
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
