
import React, { useState, useMemo, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { useTranslations } from './hooks/useTranslations';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import LoginForm from './components/LoginForm';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import InventoryTable from './components/InventoryTable';
import SaleInvoiceList from './components/SaleInvoiceList';
import PurchaseInvoiceList from './components/PurchaseInvoiceList';
import CustomerTable from './components/CustomerTable';
import SupplierTable from './components/SupplierTable';
import LoadingScreen from './components/LoadingScreen';
import MedicationFormModal from './components/MedicationFormModal';
import SaleInvoiceFormModal from './components/SaleInvoiceFormModal';
import PurchaseInvoiceFormModal from './components/PurchaseInvoiceFormModal';
import ServiceInvoiceFormModal from './components/ServiceInvoiceFormModal';
import SaleReturnInvoiceFormModal from './components/SaleReturnInvoiceFormModal';
import PurchaseReturnInvoiceFormModal from './components/PurchaseReturnInvoiceFormModal';
import ServiceDefinitionList from './components/ServiceDefinitionList';
import ServiceDefinitionFormModal from './components/ServiceDefinitionFormModal';
import AccountingView from './components/AccountingView';
import SettingsModal from './components/SettingsModal';
import HeldInvoicesModal from './components/HeldInvoicesModal';
import ActivationScreen from './components/ActivationScreen';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import ServiceInvoiceList from './components/ServiceInvoiceList';
import SaleReturnInvoiceList from './components/SaleReturnInvoiceList';
import PurchaseReturnInvoiceList from './components/PurchaseReturnInvoiceList';
import CustomerFormModal from './components/CustomerFormModal';
import SupplierFormModal from './components/SupplierFormModal';
import ManualCashTransactionModal from './components/ManualCashTransactionModal';
import ReceivePaymentModal from './components/ReceivePaymentModal';
import PaySuppliersModal from './components/PaySuppliersModal';
import SearchBar from './components/SearchBar';
import ExportImportActions from './components/ExportImportActions';
import { exportFullDatabase, importFullDatabase } from './utils/exportUtils';
// Report Views
import ExpiryReportView from './components/ExpiryReportView';
import ExpiredStockOutHistoryView from './components/ExpiredStockOutHistoryView';
import StockOnHandReportView from './components/StockOnHandReportView';
import BatchProfitReportView from './components/BatchProfitReportView';
import CustomerDueReportView from './components/CustomerDueReportView';
import SupplierDueReportView from './components/SupplierDueReportView';
import CustomerSaleReportView from './components/CustomerSaleReportView';
import CustomerTransactionTimelineReportView from './components/CustomerTransactionTimelineReportView';
import ConsolidatedLedgerReportView from './components/ConsolidatedLedgerReportView';
import LowStockView from './components/LowStockView';
import PurchaseOrderView from './components/PurchaseOrderView';

import PlusIcon from './components/icons/PlusIcon';
import PlusCircleIcon from './components/icons/PlusCircleIcon';
import ArrowDownCircleIcon from './components/icons/ArrowDownCircleIcon';
import ArrowUpCircleIcon from './components/icons/ArrowUpCircleIcon';
import InventoryIcon from './components/icons/InventoryIcon';
import ClipboardDocumentListIcon from './components/icons/ClipboardDocumentListIcon';
import UserGroupIcon from './components/UserGroupIcon';
import TruckIcon from './components/icons/TruckIcon';
import ArrowUturnLeftIcon from './components/icons/ArrowUturnLeftIcon';
import ReceiptIcon from './components/icons/ReceiptIcon';
import { isLicenseActive } from './utils/licenseUtils';
import { 
    ViewMode, AccountingSubViewMode, SaleInvoice, MedicationItem, SortConfig, Customer, 
    ServiceInvoice, SaleReturnInvoice, PurchaseReturnInvoice, ServiceItemDefinition, GenericSortConfig, 
    SortableServiceItemDefinitionKeys, Supplier, PurchaseInvoice, SortableCustomerKeys, 
    SortableSupplierKeys, SortableBatchProfitReportKeys, SortableCustomerDueReportKeys,
    SortableSupplierDueReportKeys, SortableCustomerSaleReportKeys, SortableCustomerTransactionTimelineKeys,
    SortableConsolidatedLedgerKeys, SortableExpiryReportKeys, SortableStockOnHandReportKeys,
    SortableSaleInvoiceKeys, SortablePurchaseInvoiceKeys,
    ConsolidatedLedgerEntry, SaleInvoiceFormState, HeldInvoice, PurchaseInvoiceFormState,
    ServiceInvoiceItem, CashTransaction, SaleItem, PurchaseItem, SaleReturnItem, PurchaseReturnItem,
    ExpiryReportItem
} from './types';
import { getTotalQuantityForMedication, getSoonestExpiryDateForMedication, formatCurrency } from './utils/formatUtils';

import { createDatabaseBackup, uploadBackupToGoogleDrive } from './utils/backupUtils';
import TodayDueReportView from './components/TodayDueReportView';

const AppContent: React.FC = () => {

  const { isAuthenticated, currentUser, logout, isLoading: authLoading } = useAuth();
  const { isLoading: settingsLoading, license, notificationSettings, backupSettings, updateBackupSettings } = useSettings();
  const { t } = useTranslations();

  const [backupStatus, setBackupStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  // Auto Backup Effect
  useEffect(() => {
    if (backupSettings && updateBackupSettings) {
      const triggerBackup = async () => {
        if (window.navigator.onLine) {
          const lastBackup = backupSettings.lastBackupDate ? new Date(backupSettings.lastBackupDate) : new Date(0);
          const now = new Date();
          const diffHours = (now.getTime() - lastBackup.getTime()) / (1000 * 60 * 60);

          if (diffHours >= backupSettings.backupIntervalHours && backupSettings.autoBackupEnabled && backupSettings.googleTokens) {
            setBackupStatus({ type: 'info', message: t('settings.backingUp', 'Backing up to Google Drive...') });
            try {
              const content = await createDatabaseBackup();
              const success = await uploadBackupToGoogleDrive(content, backupSettings);
              if (success) {
                updateBackupSettings({ lastBackupDate: now.toISOString() });
                setBackupStatus({ type: 'success', message: t('settings.backupSuccess', 'Backup successful!') });
              } else {
                setBackupStatus({ type: 'error', message: t('settings.backupError', 'Backup failed') });
              }
            } catch (e) {
              setBackupStatus({ type: 'error', message: t('settings.backupError', 'Backup failed') });
            }
            setTimeout(() => setBackupStatus(null), 5000);
          }
        }
      };

      // Check every minute
      const interval = setInterval(triggerBackup, 60000);

      // Also check immediately when coming back online
      const handleOnline = () => {
        console.log('System is back online, checking for pending backups...');
        triggerBackup();
      };

      window.addEventListener('online', handleOnline);

      return () => {
        clearInterval(interval);
        window.removeEventListener('online', handleOnline);
      };
    }
  }, [backupSettings, updateBackupSettings, t]);

  // OAuth Listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        if (updateBackupSettings) {
          updateBackupSettings({
            googleDriveEnabled: true,
            googleTokens: event.data.tokens,
            autoBackupEnabled: true
          });
          alert('Google Drive connected successfully!');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [updateBackupSettings]);
  
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [accountingSubView, setAccountingSubView] = useState<AccountingSubViewMode>('cashLedger');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Inventory Specific States
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventorySort, setInventorySort] = useState<SortConfig>({ key: 'name', direction: 'ascending' });

  // Customer & Supplier Specific States
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSort, setCustomerSort] = useState<GenericSortConfig<SortableCustomerKeys>>({ key: 'name', direction: 'ascending' });
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierSort, setSupplierSort] = useState<GenericSortConfig<SortableSupplierKeys>>({ key: 'name', direction: 'ascending' });

  // Report Sorting States
  const [profitReportSort, setProfitReportSort] = useState<GenericSortConfig<SortableBatchProfitReportKeys>>({ key: 'medicationName', direction: 'ascending' });
  const [customerDueSort, setCustomerDueSort] = useState<GenericSortConfig<SortableCustomerDueReportKeys>>({ key: 'customerName', direction: 'ascending' });
  const [supplierDueSort, setSupplierDueSort] = useState<GenericSortConfig<SortableSupplierDueReportKeys>>({ key: 'supplierName', direction: 'ascending' });
  const [customerSaleSort, setCustomerSaleSort] = useState<GenericSortConfig<SortableCustomerSaleReportKeys>>({ key: 'date', direction: 'descending' });
  const [customerTimelineSort, setCustomerTimelineSort] = useState<GenericSortConfig<SortableCustomerTransactionTimelineKeys>>({ key: 'date', direction: 'ascending' });
  const [consolidatedLedgerSort, setConsolidatedLedgerSort] = useState<GenericSortConfig<SortableConsolidatedLedgerKeys>>({ key: 'date', direction: 'descending' });
  const [expiryReportSort, setExpiryReportSort] = useState<GenericSortConfig<SortableExpiryReportKeys>>({ key: 'expiryDate', direction: 'ascending' });
  const [stockOnHandSort, setStockOnHandSort] = useState<GenericSortConfig<SortableStockOnHandReportKeys>>({ key: 'medicationName', direction: 'ascending' });

  // Service Definitions States
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceSort, setServiceSort] = useState<GenericSortConfig<SortableServiceItemDefinitionKeys>>({ key: 'name', direction: 'ascending' });

  // Sale Invoices Specific States
  const [saleInvoiceSort, setSaleInvoiceSort] = useState<GenericSortConfig<SortableSaleInvoiceKeys>>({ key: 'invoiceNumber', direction: 'ascending' });
  const [purchaseInvoiceSort, setPurchaseInvoiceSort] = useState<GenericSortConfig<SortablePurchaseInvoiceKeys>>({ key: 'invoiceNumber', direction: 'ascending' });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<string | undefined>(undefined);
  const [isHeldInvoicesOpen, setIsHeldInvoicesOpen] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isMedicationModalMinimized, setIsMedicationModalMinimized] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isSaleModalMinimized, setIsSaleModalMinimized] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPurchaseModalMinimized, setIsPurchaseModalMinimized] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isServiceModalMinimized, setIsServiceModalMinimized] = useState(false);
  const [isServiceDefinitionModalOpen, setIsServiceDefinitionModalOpen] = useState(false);
  const [isServiceDefinitionModalMinimized, setIsServiceDefinitionModalMinimized] = useState(false);
  const [isSaleReturnModalOpen, setIsSaleReturnModalOpen] = useState(false);
  const [isSaleReturnModalMinimized, setIsSaleReturnModalMinimized] = useState(false);
  const [isPurchaseReturnModalOpen, setIsPurchaseReturnModalOpen] = useState(false);
  const [isPurchaseReturnModalMinimized, setIsPurchaseReturnModalMinimized] = useState(false);
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [isQuickCustomerModalMinimized, setIsQuickCustomerModalMinimized] = useState(false);
  const [isQuickSupplierModalOpen, setIsQuickSupplierModalOpen] = useState(false);
  const [isQuickSupplierModalMinimized, setIsQuickSupplierModalMinimized] = useState(false);
  const [isQuickMedicationModalOpen, setIsQuickMedicationModalOpen] = useState(false);
  const [isQuickMedicationModalMinimized, setIsQuickMedicationModalMinimized] = useState(false);
  const [isManualTransactionModalOpen, setIsManualTransactionModalOpen] = useState(false);
  const [isManualTransactionModalMinimized, setIsManualTransactionModalMinimized] = useState(false);
  const [isReceivePaymentModalOpen, setIsReceivePaymentModalOpen] = useState(false);
  const [isReceivePaymentModalMinimized, setIsReceivePaymentModalMinimized] = useState(false);
  const [isPaySuppliersModalOpen, setIsPaySuppliersModalOpen] = useState(false);
  const [isPaySuppliersModalMinimized, setIsPaySuppliersModalMinimized] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<{data: any, type: any} | null>(null);
  const [editingMedication, setEditingMedication] = useState<MedicationItem | null>(null);
  const [editingServiceDefinition, setEditingServiceDefinition] = useState<ServiceItemDefinition | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editingSaleInvoice, setEditingSaleInvoice] = useState<SaleInvoice | null>(null);
  const [editingPurchaseInvoice, setEditingPurchaseInvoice] = useState<PurchaseInvoice | null>(null);
  const [editingServiceInvoice, setEditingServiceInvoice] = useState<ServiceInvoice | null>(null);
  const [editingSaleReturnInvoice, setEditingSaleReturnInvoice] = useState<SaleReturnInvoice | null>(null);
  const [editingPurchaseReturnInvoice, setEditingPurchaseReturnInvoice] = useState<PurchaseReturnInvoice | null>(null);
  const [resumingHeldInvoice, setResumingHeldInvoice] = useState<HeldInvoice | null>(null);
  const [saleModalKey, setSaleModalKey] = useState(0);
  const [resumingHeldPurchase, setResumingHeldPurchase] = useState<HeldInvoice | null>(null);
  const [lastCreatedCustomerId, setLastCreatedCustomerId] = useState<string | null>(null);
  const [lastCreatedSupplierId, setLastCreatedSupplierId] = useState<string | null>(null);
  const [lastCreatedMedicationId, setLastCreatedMedicationId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    if (!isSaleModalOpen && !isPurchaseModalOpen) {
      setLastCreatedCustomerId(null);
      setLastCreatedSupplierId(null);
      setLastCreatedMedicationId(null);
      setEditingSaleInvoice(null);
      setEditingPurchaseInvoice(null);
    }
  }, [isSaleModalOpen, isPurchaseModalOpen]);

  // Queries
  const medications = useLiveQuery(() => db.medications.toArray(), []);
  const saleInvoices = useLiveQuery(() => db.saleInvoices.toArray(), []);
  const purchaseInvoices = useLiveQuery(() => db.purchaseInvoices.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);

  useEffect(() => {
    const ensureCashSaleCustomer = async () => {
      if (customers !== undefined) {
        const hasCashSale = customers.some(c => 
          c.name.toLowerCase().includes('cash sale') || 
          c.name.toLowerCase().includes('cash sell') ||
          c.name.includes('নগদ')
        );
        if (!hasCashSale) {
          await db.customers.add({
            id: crypto.randomUUID(),
            name: 'Cash Sale',
            phone: '',
            email: '',
            address: '',
            openingBalance: 0,
            totalDueAmount: 0,
            dateAdded: new Date().toISOString()
          });
        }
      }
    };
    ensureCashSaleCustomer();
  }, [customers]);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const cashTransactions = useLiveQuery(() => db.cashTransactions.toArray(), []);
  const heldInvoices = useLiveQuery(() => db.heldInvoices.toArray(), []);
  const customCategories = useLiveQuery(() => db.customTransactionCategories.toArray(), []);
  const serviceInvoices = useLiveQuery(() => db.serviceInvoices.toArray(), []);
  const saleReturnInvoices = useLiveQuery(() => db.saleReturnInvoices.toArray(), []);
  const purchaseReturnInvoices = useLiveQuery(() => db.purchaseReturnInvoices.toArray(), []);
  const serviceDefinitions = useLiveQuery(() => db.serviceItemDefinitions.toArray(), []);
  const expiredStockOuts = useLiveQuery(() => db.expiredProductStockOuts.toArray(), []);

  // Filtered Inventory Logic
  const filteredInventory = useMemo(() => {
    if (!medications) return [];
    let result = medications.map((m: MedicationItem) => ({
      ...m,
      totalQuantityInStock: getTotalQuantityForMedication(m),
      soonestExpiryDate: getSoonestExpiryDateForMedication(m)
    }));
    if (inventorySearch) {
      const term = inventorySearch.toLowerCase();
            result = result.filter((m: { name: string; genericName: string; }) => m.name.toLowerCase().includes(term) || m.genericName.toLowerCase().includes(term));
    }
    result.sort((a: any, b: any) => {
      const valA = a[inventorySort.key];
      const valB = b[inventorySort.key];
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
      else comparison = String(valA || '').localeCompare(String(valB || ''), 'bn');
      return inventorySort.direction === 'ascending' ? comparison : -comparison;
    });
    return result;
  }, [medications, inventorySearch, inventorySort]);

  // FIX: Added missing filteredServices useMemo
  const filteredServices = useMemo(() => {
    if (!serviceDefinitions) return [];
    let result = [...serviceDefinitions];
    if (serviceSearch) {
      const term = serviceSearch.toLowerCase();
      result = result.filter((s: ServiceItemDefinition) => s.name.toLowerCase().includes(term) || s.category.toLowerCase().includes(term));
    }
    result.sort((a: any, b: any) => {
      const valA = a[serviceSort.key];
      const valB = b[serviceSort.key];
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
      else comparison = String(valA || '').localeCompare(String(valB || ''), 'bn');
      return serviceSort.direction === 'ascending' ? comparison : -comparison;
    });
    return result;
  }, [serviceDefinitions, serviceSearch, serviceSort]);

  // FIX: Added missing filteredCustomers useMemo
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    let result = [...customers];
    if (customerSearch) {
      const term = customerSearch.toLowerCase();
      result = result.filter((c: Customer) => c.name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term)));
    }
    result.sort((a: any, b: any) => {
      const valA = a[customerSort.key];
      const valB = b[customerSort.key];
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
      else comparison = String(valA || '').localeCompare(String(valB || ''), 'bn');
      return customerSort.direction === 'ascending' ? comparison : -comparison;
    });
    return result;
  }, [customers, customerSearch, customerSort]);

  // FIX: Added missing filteredSuppliers useMemo
  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    let result = [...suppliers];
    if (supplierSearch) {
      const term = supplierSearch.toLowerCase();
      result = result.filter((s: Supplier) => s.name.toLowerCase().includes(term) || (s.contact && s.contact.includes(term)));
    }
    result.sort((a: any, b: any) => {
      const valA = a[supplierSort.key];
      const valB = b[supplierSort.key];
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
      else comparison = String(valA || '').localeCompare(String(valB || ''), 'bn');
      return supplierSort.direction === 'ascending' ? comparison : -comparison;
    });
    return result;
  }, [suppliers, supplierSearch, supplierSort]);

  const sortedSaleInvoices = useMemo(() => {
    if (!saleInvoices) return [];
    const result = [...saleInvoices];
    result.sort((a: any, b: any) => {
      const valA = a[saleInvoiceSort.key];
      const valB = b[saleInvoiceSort.key];
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
      else comparison = String(valA || '').localeCompare(String(valB || ''), 'bn');
      return saleInvoiceSort.direction === 'ascending' ? comparison : -comparison;
    });
    return result;
  }, [saleInvoices, saleInvoiceSort]);

  const sortedPurchaseInvoices = useMemo(() => {
    if (!purchaseInvoices) return [];
    const result = [...purchaseInvoices];
    result.sort((a: any, b: any) => {
      const valA = a[purchaseInvoiceSort.key];
      const valB = b[purchaseInvoiceSort.key];
      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') comparison = valA - valB;
      else comparison = String(valA || '').localeCompare(String(valB || ''), 'bn');
      return purchaseInvoiceSort.direction === 'ascending' ? comparison : -comparison;
    });
    return result;
  }, [purchaseInvoices, purchaseInvoiceSort]);

  // FIX: Added missing consolidatedLedgerEntries useMemo
  const consolidatedLedgerEntries = useMemo(() => {
    const entries: ConsolidatedLedgerEntry[] = [];

        (saleInvoices || []).forEach((inv: SaleInvoice) => {
      entries.push({
        id: `sale_${inv.id}`,
        date: inv.date,
        timestamp: new Date(inv.date).getTime(),
        partyName: inv.customerName || 'Walk-in Customer',
        partyType: 'Customer',
        transactionTypeDisplay: 'Sale Invoice',
        reference: inv.invoiceNumber,
        description: inv.items.map((i: SaleItem) => `${i.medicationName} x${i.quantity}`).join(', '),
        debit: inv.totalAmount,
        credit: 0
      });
    });

        (purchaseInvoices || []).forEach((inv: PurchaseInvoice) => {
      entries.push({
        id: `purch_${inv.id}`,
        date: inv.date,
        timestamp: new Date(inv.date).getTime(),
        partyName: inv.supplierName || 'N/A',
        partyType: 'Supplier',
        transactionTypeDisplay: 'Purchase Invoice',
        reference: inv.invoiceNumber,
        description: inv.items.map((i: PurchaseItem) => `${i.medicationName} x${i.quantity}`).join(', '),
        debit: 0,
        credit: inv.totalAmount
      });
    });

        (serviceInvoices || []).forEach((inv: ServiceInvoice) => {
      entries.push({
        id: `serv_${inv.id}`,
        date: inv.date,
        timestamp: new Date(inv.date).getTime(),
        partyName: inv.customerName || 'Walk-in Customer',
        partyType: 'Customer',
        transactionTypeDisplay: 'Service Invoice',
        reference: inv.invoiceNumber,
        description: inv.items.map((i: ServiceInvoiceItem) => i.serviceItemName).join(', '),
        debit: inv.totalAmount,
        credit: 0
      });
    });

        (saleReturnInvoices || []).forEach((inv: SaleReturnInvoice) => {
      entries.push({
        id: `sr_${inv.id}`,
        date: inv.date,
        timestamp: new Date(inv.date).getTime(),
        partyName: inv.customerName || 'N/A',
        partyType: 'Customer',
        transactionTypeDisplay: 'Sale Return',
        reference: inv.returnInvoiceNumber,
        description: inv.items.map((i: SaleReturnItem) => i.medicationName).join(', '),
        debit: 0,
        credit: inv.totalRefundAmount
      });
    });

        (purchaseReturnInvoices || []).forEach((inv: PurchaseReturnInvoice) => {
      entries.push({
        id: `pr_${inv.id}`,
        date: inv.date,
        timestamp: new Date(inv.date).getTime(),
        partyName: inv.supplierName || 'N/A',
        partyType: 'Supplier',
        transactionTypeDisplay: 'Purchase Return',
        reference: inv.returnInvoiceNumber,
        description: inv.items.map((i: PurchaseReturnItem) => i.medicationName).join(', '),
        debit: inv.totalCreditAmount,
        credit: 0
      });
    });

        (cashTransactions || []).forEach((ct: CashTransaction) => {
      const partyName = ct.relatedCustomerId ? (customers?.find((c: Customer) => c.id === ct.relatedCustomerId)?.name || 'Unknown Customer') :
                       ct.relatedSupplierId ? (suppliers?.find((s: Supplier) => s.id === ct.relatedSupplierId)?.name || 'Unknown Supplier') :
                       'System';
      const partyType = ct.relatedCustomerId ? 'Customer' : 
                       ct.relatedSupplierId ? 'Supplier' : 
                       'System';
      entries.push({
        id: `ct_${ct.id}`,
        date: ct.date,
        timestamp: ct.timestamp,
        partyName,
        partyType,
        transactionTypeDisplay: ct.category,
        reference: ct.relatedInvoiceId ? `INV-${ct.relatedInvoiceId.substring(0, 6)}` : `TRN-${ct.id.substring(0, 6)}`,
        description: ct.description,
        debit: ct.type === 'expense' ? ct.amount : 0,
        credit: ct.type === 'income' ? ct.amount : 0
      });
    });

    return entries;
  }, [saleInvoices, purchaseInvoices, serviceInvoices, saleReturnInvoices, purchaseReturnInvoices, cashTransactions, customers, suppliers]);

  // Handlers
  const handleCustomerSubmit = async (customer: Customer) => {
    await db.customers.put(customer);
    setLastCreatedCustomerId(customer.id);
  };

  const handleSupplierSubmit = async (supplier: Supplier) => {
    await db.suppliers.put(supplier);
    setLastCreatedSupplierId(supplier.id);
  };

  const handleRestore = async (content: string) => {
    setIsRestoring(true);
    try {
      await importFullDatabase(db, content);
    } catch (error) {
      console.error("Restore error:", error);
      setIsRestoring(false);
    }
  };

  const handleAddSale = async (invoice: SaleInvoice) => {
    // If it's an edit, we need to reverse the old invoice's effects
    const existingInvoice = await db.saleInvoices.get(invoice.id);
    let itemsChanged = true;

    if (existingInvoice) {
      // Check if items are identical to avoid unnecessary stock movements
      if (existingInvoice.items.length === invoice.items.length) {
        const isSame = existingInvoice.items.every((item, idx) => {
          const newItem = invoice.items[idx];
          return item.medicationId === newItem.medicationId &&
                 item.quantity === newItem.quantity &&
                 item.batchNumber === newItem.batchNumber;
        });
        if (isSame) {
          itemsChanged = false;
        }
      }

      if (itemsChanged) {
        // 1. Reverse stock deductions
        for (const item of existingInvoice.items) {
          const med = await db.medications.get(item.medicationId);
          if (med && item.batchDeductions) {
            for (const deduction of item.batchDeductions) {
              const batch = med.batches.find(b => b.batchNumber === deduction.batchNumber);
              if (batch) {
                batch.quantityInStock += deduction.quantity;
              }
            }
            await db.medications.put(med);
          }
        }
      }

      // 2. Reverse customer balance
      if (existingInvoice.customerId) {
        const cust = await db.customers.get(existingInvoice.customerId);
        if (cust) {
          cust.totalDueAmount -= existingInvoice.amountDue;
          await db.customers.put(cust);
        }
      }
      // 3. Delete old cash transaction
      await db.cashTransactions.where('relatedInvoiceId').equals(existingInvoice.id).delete();
    }

    if (itemsChanged) {
      // Implementing FIFO/Manual Hybrid Logic
      for (const item of invoice.items) {
        const med = await db.medications.get(item.medicationId);
        if (med) {
          let remainingToDeduct = item.quantity;
          const deductions: { batchNumber: string; quantity: number }[] = [];
          let totalCostPrice = 0;

          const userWantsSpecificBatch = item.batchNumber && item.batchNumber !== 'FIFO-AUTO';

          if (userWantsSpecificBatch) {
              // Priority 1: User selected a specific batch
              const targetBatch = med.batches.find((b: any) => b.batchNumber === item.batchNumber);
              if (targetBatch) {
                  const takeAmount = Math.min(targetBatch.quantityInStock, remainingToDeduct);
                  targetBatch.quantityInStock -= takeAmount;
                  remainingToDeduct -= takeAmount;
                  deductions.push({ batchNumber: targetBatch.batchNumber, quantity: takeAmount });
                  totalCostPrice += (targetBatch.costPrice * takeAmount);
              }
          }

          // Priority 2: If still remaining (or Auto selected), use FIFO/FEFO
          if (remainingToDeduct > 0) {
              const sortedBatches = [...med.batches]
                  .filter(b => b.quantityInStock > 0)
                  .sort((a, b) => {
                      const dateA = new Date(a.expiryDate).getTime();
                      const dateB = new Date(b.expiryDate).getTime();
                      if (dateA !== dateB) return dateA - dateB;
                      return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
                  });

              for (const batch of sortedBatches) {
                  if (remainingToDeduct <= 0) break;
                  // Avoid double-deducting if user selected this batch and it's already processed above
                  if (userWantsSpecificBatch && batch.batchNumber === item.batchNumber) continue;

                  const takeAmount = Math.min(batch.quantityInStock, remainingToDeduct);
                  batch.quantityInStock -= takeAmount;
                  remainingToDeduct -= takeAmount;
                  deductions.push({ batchNumber: batch.batchNumber, quantity: takeAmount });
                  totalCostPrice += (batch.costPrice * takeAmount);
              }
          }

          // Update audit info
          item.batchNumber = deductions.map(d => d.batchNumber).join(', ');
          item.batchDeductions = deductions;
          item.costPriceAtSale = item.quantity > 0 ? (totalCostPrice / item.quantity) : 0;

          await db.medications.put(med);
        }
      }
    } else if (existingInvoice) {
      // If items didn't change, preserve the cost price and batch deductions from the existing record
      invoice.items = invoice.items.map((item, idx) => ({
        ...item,
        costPriceAtSale: existingInvoice.items[idx].costPriceAtSale,
        batchDeductions: existingInvoice.items[idx].batchDeductions,
        batchNumber: existingInvoice.items[idx].batchNumber
      }));
    }

    await db.saleInvoices.put(invoice);
    
    // If it was a held invoice, clear it
    if (resumingHeldInvoice) {
        await db.heldInvoices.delete(resumingHeldInvoice.id);
        setResumingHeldInvoice(null);
    }

    if (invoice.customerId) {
      const cust = await db.customers.get(invoice.customerId);
      if (cust) {
        cust.totalDueAmount += invoice.amountDue;
        await db.customers.put(cust);
      }
    }
    if (invoice.amountPaid > 0) {
      await db.cashTransactions.add({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        date: invoice.date,
        type: 'income',
        category: 'Sale Invoice',
        description: `Payment for Invoice ${invoice.invoiceNumber}`,
        amount: invoice.amountPaid,
        relatedInvoiceId: invoice.id,
        relatedInvoiceType: 'sale',
        relatedCustomerId: invoice.customerId
      });
    }
    setSelectedInvoiceForView({data: invoice, type: 'sale'});
    if (editingSaleInvoice) {
      setIsSaleModalOpen(false);
      setEditingSaleInvoice(null);
    } else {
      setSaleModalKey(prev => prev + 1);
    }
    setIsSaleModalMinimized(false);
  };

  const handleHoldSale = async (formData: SaleInvoiceFormState) => {
        const customer = customers?.find((c: Customer) => c.id === formData.selectedCustomerId);
    const holdId = resumingHeldInvoice?.id || crypto.randomUUID();
    
    await db.heldInvoices.put({
      id: holdId,
      type: 'sale',
      heldAt: new Date().toISOString(),
      descriptiveName: customer ? `Sale for ${customer.name}` : `Walk-in Sale (${formData.invoiceNumber})`,
      formData: formData
    });
    
    setIsSaleModalOpen(false);
    setIsSaleModalMinimized(false);
    setResumingHeldInvoice(null);
  };

  const handleHoldPurchase = async (formData: PurchaseInvoiceFormState) => {
        const supplier = suppliers?.find((s: Supplier) => s.id === formData.selectedSupplierId);
    const holdId = resumingHeldPurchase?.id || crypto.randomUUID();
    
    await db.heldInvoices.put({
      id: holdId,
      type: 'purchase',
      heldAt: new Date().toISOString(),
      descriptiveName: supplier ? `Purchase from ${supplier.name}` : `Stock Purchase (${formData.invoiceNumber})`,
      formData: formData
    });
    
    setIsPurchaseModalOpen(false);
    setIsPurchaseModalMinimized(false);
    setResumingHeldPurchase(null);
  };

  const handleResumeHeldInvoice = (held: HeldInvoice) => {
      if (held.type === 'sale') {
          setResumingHeldInvoice(held);
          setIsSaleModalOpen(true);
          setIsSaleModalMinimized(false);
      } else if (held.type === 'purchase') {
          setResumingHeldPurchase(held);
          setIsPurchaseModalOpen(true);
          setIsPurchaseModalMinimized(false);
      }
      setIsHeldInvoicesOpen(false);
  };

  const handleAddPurchase = async (invoice: PurchaseInvoice) => {
    // If it's an edit, reverse old effects
    const existingInvoice = await db.purchaseInvoices.get(invoice.id);
    let itemsChanged = true;

    if (existingInvoice) {
      // Check if items are identical to avoid unnecessary stock movements
      if (existingInvoice.items.length === invoice.items.length) {
        const isSame = existingInvoice.items.every((item, idx) => {
          const newItem = invoice.items[idx];
          return item.medicationId === newItem.medicationId &&
                 item.quantity === newItem.quantity &&
                 item.batchNumber === newItem.batchNumber &&
                 item.expiryDate === newItem.expiryDate;
        });
        if (isSame) {
          itemsChanged = false;
        }
      }

      if (itemsChanged) {
        // 1. Reverse stock additions
        for (const item of existingInvoice.items) {
          const med = await db.medications.get(item.medicationId);
          if (med) {
            const batch = med.batches.find(b => b.batchNumber === item.batchNumber);
            if (batch) {
              batch.quantityInStock -= item.quantity;
            }
            await db.medications.put(med);
          }
        }
      }
      // 2. Reverse supplier balance
      if (existingInvoice.supplierId) {
        const supplier = await db.suppliers.get(existingInvoice.supplierId);
        if (supplier) {
          supplier.totalAmountOwed -= existingInvoice.amountDue;
          await db.suppliers.put(supplier);
        }
      }
      // 3. Delete old cash transaction
      await db.cashTransactions.where('relatedInvoiceId').equals(existingInvoice.id).delete();
    }

    await db.purchaseInvoices.put(invoice);

    if (resumingHeldPurchase) {
      await db.heldInvoices.delete(resumingHeldPurchase.id);
      setResumingHeldPurchase(null);
    }

    if (itemsChanged) {
      for (const item of invoice.items) {
        const med = await db.medications.get(item.medicationId);
        if (med) {
          const existingBatch = med.batches.find(b => b.batchNumber === item.batchNumber);
          if (existingBatch) {
            existingBatch.quantityInStock += item.quantity;
            existingBatch.costPrice = item.unitCost;
          } else {
            med.batches.push({
              id: crypto.randomUUID(),
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              quantityInStock: item.quantity,
              costPrice: item.unitCost,
              dateAdded: new Date().toISOString()
            });
          }
          await db.medications.put(med);
        }
      }
    }
    if (invoice.supplierId) {
      const supplier = await db.suppliers.get(invoice.supplierId);
      if (supplier) {
        supplier.totalAmountOwed += invoice.amountDue;
        await db.suppliers.put(supplier);
      }
    }
    if (invoice.amountPaid > 0) {
      await db.cashTransactions.add({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        date: invoice.date,
        type: 'expense',
        category: 'Purchase Invoice',
        description: `Payment for Purchase Bill ${invoice.invoiceNumber}`,
        amount: invoice.amountPaid,
        relatedInvoiceId: invoice.id,
        relatedInvoiceType: 'purchase',
        relatedSupplierId: invoice.supplierId
      });
    }
    setIsPurchaseModalOpen(false);
    setIsPurchaseModalMinimized(false);
  };

  const handleAddService = async (invoice: ServiceInvoice) => {
    const existingInvoice = await db.serviceInvoices.get(invoice.id);
    if (existingInvoice) {
      if (existingInvoice.customerId) {
        const customer = await db.customers.get(existingInvoice.customerId);
        if (customer) {
          customer.totalDueAmount -= existingInvoice.amountDue;
          await db.customers.put(customer);
        }
      }
      await db.cashTransactions.where('relatedInvoiceId').equals(existingInvoice.id).delete();
    }

    await db.serviceInvoices.put(invoice);
    if (invoice.customerId) {
      const customer = await db.customers.get(invoice.customerId);
      if (customer) {
        customer.totalDueAmount += invoice.amountDue;
        await db.customers.put(customer);
      }
    }
    if (invoice.amountPaid > 0) {
      await db.cashTransactions.add({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        date: invoice.date,
        type: 'income',
        category: 'Service Invoice',
        description: `Payment for Service Bill ${invoice.invoiceNumber}`,
        amount: invoice.amountPaid,
        relatedInvoiceId: invoice.id,
        relatedInvoiceType: 'service',
        relatedCustomerId: invoice.customerId
      });
    }
    setSelectedInvoiceForView({data: invoice, type: 'service'});
    setIsServiceModalOpen(false);
  };

  const handleStockOutExpired = async (item: ExpiryReportItem) => {
    if (!confirm(`${item.medicationName} (Batch: ${item.batchNumber}) এর ${item.quantityInStock} টি পন্য স্টক আউট করতে চান? এতে ${formatCurrency(item.quantityInStock * item.costPrice)} লস হবে।`)) {
      return;
    }

    const med = await db.medications.get(item.medicationId);
    if (med) {
      const batch = med.batches.find(b => b.id === item.batchId);
      if (batch) {
        const qty = batch.quantityInStock;
        const loss = qty * batch.costPrice;

        // 1. Record the stock out
        await db.expiredProductStockOuts.add({
          id: crypto.randomUUID(),
          date: new Date().toISOString().split('T')[0],
          medicationId: med.id,
          medicationName: med.name,
          batchNumber: batch.batchNumber,
          quantity: qty,
          unitCost: batch.costPrice,
          totalLoss: loss,
          notes: 'Expired Product Stock Out'
        });

        // 2. Adjust stock
        batch.quantityInStock = 0;
        await db.medications.put(med);

        // 3. Record as expense in cash transactions (optional, but good for accounting)
        await db.cashTransactions.add({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
          category: 'Expired Product Loss',
          description: `Loss from expired ${med.name} (Batch: ${batch.batchNumber})`,
          amount: loss
        });

        alert('স্টক আউট সফল হয়েছে।');
      }
    }
  };

  const handleDeleteStockOut = async (id: string) => {
    await db.expiredProductStockOuts.delete(id);
  };

  const handleAddSaleReturn = async (invoice: SaleReturnInvoice) => {
    const existingInvoice = await db.saleReturnInvoices.get(invoice.id);
    if (existingInvoice) {
      // Reverse stock additions
      for (const item of existingInvoice.items) {
        const med = await db.medications.get(item.medicationId);
        if (med) {
          const batch = med.batches.find(b => b.batchNumber === item.batchNumber);
          if (batch) {
            batch.quantityInStock -= item.quantityReturned;
            await db.medications.put(med);
          }
        }
      }
      // Reverse customer balance
      if (existingInvoice.customerId) {
        const customer = await db.customers.get(existingInvoice.customerId);
        if (customer) {
          customer.totalDueAmount += existingInvoice.totalRefundAmount;
          await db.customers.put(customer);
        }
      }
      // Delete old cash transaction
      await db.cashTransactions.where('relatedInvoiceId').equals(existingInvoice.id).delete();
    }

    await db.saleReturnInvoices.put(invoice);
    for (const item of invoice.items) {
      const med = await db.medications.get(item.medicationId);
      if (med) {
        const batch = med.batches.find(b => b.batchNumber === item.batchNumber);
        if (batch) {
          batch.quantityInStock += item.quantityReturned;
          await db.medications.put(med);
        }
      }
    }
    if (invoice.customerId) {
      const customer = await db.customers.get(invoice.customerId);
      if (customer) {
        customer.totalDueAmount -= invoice.totalRefundAmount;
        await db.customers.put(customer);
      }
    }
    if (invoice.refundIssued > 0) {
      await db.cashTransactions.add({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        date: invoice.date,
        type: 'expense',
        category: 'Refund Issued (Sale Return)',
        description: `Refund for Return ${invoice.returnInvoiceNumber}`,
        amount: invoice.refundIssued,
        relatedInvoiceId: invoice.id,
        relatedInvoiceType: 'saleReturn',
        relatedCustomerId: invoice.customerId
      });
    }
    setIsSaleReturnModalOpen(false);
  };

  const handleAddPurchaseReturn = async (invoice: PurchaseReturnInvoice) => {
    const existingInvoice = await db.purchaseReturnInvoices.get(invoice.id);
    if (existingInvoice) {
      // Reverse stock deductions
      for (const item of existingInvoice.items) {
        const med = await db.medications.get(item.medicationId);
        if (med) {
          const batch = med.batches.find(b => b.batchNumber === item.batchNumber);
          if (batch) {
            batch.quantityInStock += item.quantityReturned;
            await db.medications.put(med);
          }
        }
      }
      // Reverse supplier balance
      if (existingInvoice.supplierId) {
        const supplier = await db.suppliers.get(existingInvoice.supplierId);
        if (supplier) {
          supplier.totalAmountOwed += existingInvoice.totalCreditAmount;
          await db.suppliers.put(supplier);
        }
      }
      // Delete old cash transaction
      await db.cashTransactions.where('relatedInvoiceId').equals(existingInvoice.id).delete();
    }

    await db.purchaseReturnInvoices.put(invoice);
    for (const item of invoice.items) {
      const med = await db.medications.get(item.medicationId);
      if (med) {
        const batch = med.batches.find(b => b.batchNumber === item.batchNumber);
        if (batch) {
          batch.quantityInStock -= item.quantityReturned;
          await db.medications.put(med);
        }
      }
    }
    if (invoice.supplierId) {
      const supplier = await db.suppliers.get(invoice.supplierId);
      if (supplier) {
        supplier.totalAmountOwed -= invoice.totalCreditAmount;
        await db.suppliers.put(supplier);
      }
    }
    if (invoice.refundReceived > 0) {
      await db.cashTransactions.add({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        date: invoice.date,
        type: 'income',
        category: 'Refund Received (Purchase Return)',
        description: `Refund for Purchase Return ${invoice.returnInvoiceNumber}`,
        amount: invoice.refundReceived,
        relatedInvoiceId: invoice.id,
        relatedInvoiceType: 'purchaseReturn',
        relatedSupplierId: invoice.supplierId
      });
    }
    setIsPurchaseReturnModalOpen(false);
  };

  if (authLoading || settingsLoading) return <LoadingScreen />;
  const isAppActive = license ? (license.isValid && isLicenseActive(license.expiryDate)) : false;
  if (!isAppActive) return <ActivationScreen onSuccess={() => window.location.reload()} />;
  if (!isAuthenticated) return <LoginForm />;

  const handleSetView = (view: ViewMode, subView?: AccountingSubViewMode) => {
    setCurrentView(view);
    if (subView) setAccountingSubView(subView);
    setIsSidebarOpen(false);
  };

  const getNextInvoiceNumber = async (prefix: string, table: any) => {
    const count = await table.count();
    return `${prefix}-${(count + 1).toString().padStart(8, '0')}`;
  };

  const handleOpenSettings = (tab?: string) => {
      setSettingsInitialTab(tab);
      setIsSettingsOpen(true);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            medications={medications || []} 
            saleInvoices={saleInvoices || []} 
            purchaseInvoices={purchaseInvoices || []}
            serviceInvoices={serviceInvoices || []}
            saleReturnInvoices={saleReturnInvoices || []}
            purchaseReturnInvoices={purchaseReturnInvoices || []}
            cashTransactions={cashTransactions || []}
            onNavigate={handleSetView} 
          />
        );
      
      case 'products':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex items-center space-x-5">
                        <div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <InventoryIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.products')}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Manage Center Inventory</p>
                    </div>
                </div>
                <div className="flex flex-1 w-full max-w-xl">
                    <SearchBar searchTerm={inventorySearch} onSearchChange={setInventorySearch} placeholder={t('common.searchProduct')} />
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                    <ExportImportActions onBackup={() => exportFullDatabase(db)} onRestore={handleRestore} data={medications || []} filename="SafeSave_Inventory" onImport={async m => { await db.medications.bulkPut(m as MedicationItem[]); }} entityType="product" />
                    <button onClick={() => { setEditingMedication(null); setIsMedicationModalOpen(true); }} className="bg-primary-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-primary-100 hover:bg-primary-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0">
                        <PlusIcon className="w-5 h-5 mr-2" /> {t('header.addProduct')}
                    </button>
                </div>
            </div>
            <InventoryTable medications={filteredInventory} onEdit={(m) => { setEditingMedication(m); setIsMedicationModalOpen(true); }} onDelete={id => db.medications.delete(id)} onDuplicate={(m) => { const { id, ...clean } = m; setEditingMedication({ ...clean, id: crypto.randomUUID(), batches: [] } as any); setIsMedicationModalOpen(true); }} onSort={(key) => setInventorySort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} sortConfig={inventorySort} />
          </div>
        );

      case 'serviceDefinitions':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex items-center space-x-5">
                    <div className="h-16 w-16 bg-purple-50 text-purple-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <ClipboardDocumentListIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.services')}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Manage Center Services & Fees</p>
                    </div>
                </div>

                <div className="flex flex-1 w-full max-w-xl">
                    <SearchBar 
                        searchTerm={serviceSearch} 
                        onSearchChange={setServiceSearch} 
                        placeholder="সেবা খুঁজুন..." 
                    />
                </div>

                <button 
                    onClick={() => { setEditingServiceDefinition(null); setIsServiceDefinitionModalOpen(true); }} 
                    className="bg-purple-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-purple-100 hover:bg-purple-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('serviceDefinitionList.addButton')}
                </button>
            </div>

            <ServiceDefinitionList 
                serviceDefinitions={filteredServices} 
                onEdit={(sd) => { setEditingServiceDefinition(sd); setIsServiceDefinitionModalOpen(true); }} 
                onDelete={id => { if(confirm(t('confirmDelete.message', {itemName: 'Service'}))) db.serviceItemDefinitions.delete(id) }} 
                onSort={(key) => setServiceSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} 
                sortConfig={serviceSort} 
            />
          </div>
        );

      case 'serviceInvoices':
        return (
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                    <div className="flex items-center space-x-5">
                        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                            <ReceiptIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.serviceInvoices')}</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Diagnostic Billing History</p>
                        </div>
                    </div>
                    <button onClick={() => setIsServiceModalOpen(true)} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        {t('serviceInvoiceList.createButton')}
                    </button>
                </div>
                <ServiceInvoiceList 
                  invoices={serviceInvoices || []} 
                  onViewDetails={(inv) => setSelectedInvoiceForView({data: inv, type: 'service'})} 
                  onEdit={(invoice) => {
                    setEditingServiceInvoice(invoice);
                    setIsServiceModalOpen(true);
                    setIsServiceModalMinimized(false);
                  }} 
                  onSort={() => {}} 
                  sortConfig={null} 
                />
            </div>
        );

      case 'saleReturns':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex items-center space-x-5">
                    <div className="h-16 w-16 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <ArrowUturnLeftIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.saleReturns')}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Manage Customer Returns</p>
                    </div>
                </div>
                <button onClick={() => setIsSaleReturnModalOpen(true)} className="bg-red-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('saleReturnInvoiceList.createButton')}
                </button>
            </div>
            <SaleReturnInvoiceList 
              invoices={saleReturnInvoices || []} 
              onViewDetails={(inv) => setSelectedInvoiceForView({data: inv, type: 'saleReturn'})} 
              onEdit={(invoice) => {
                setEditingSaleReturnInvoice(invoice);
                setIsSaleReturnModalOpen(true);
                setIsSaleReturnModalMinimized(false);
              }} 
              onSort={() => {}} 
              sortConfig={null} 
            />
          </div>
        );

      case 'purchaseReturns':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex items-center space-x-5">
                    <div className="h-16 w-16 bg-orange-50 text-orange-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <ArrowUturnLeftIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.purchaseReturns')}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Return Goods to Vendor</p>
                    </div>
                </div>
                <button onClick={() => setIsPurchaseReturnModalOpen(true)} className="bg-orange-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-orange-100 hover:bg-orange-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('purchaseReturnInvoiceList.createButton')}
                </button>
            </div>
            <PurchaseReturnInvoiceList 
              invoices={purchaseReturnInvoices || []} 
              onViewDetails={(inv) => setSelectedInvoiceForView({data: inv, type: 'purchaseReturn'})} 
              onEdit={(invoice) => {
                setEditingPurchaseReturnInvoice(invoice);
                setIsPurchaseReturnModalOpen(true);
                setIsPurchaseReturnModalMinimized(false);
              }} 
              onSort={() => {}} 
              sortConfig={null} 
            />
          </div>
        );

      case 'reports':
      case 'profitReport':
        return <BatchProfitReportView saleInvoices={saleInvoices || []} sortConfig={profitReportSort} onSort={key => setProfitReportSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} />;
      case 'todayDueReport':
        return <TodayDueReportView customers={customers || []} saleInvoices={saleInvoices || []} onViewInvoiceDetails={inv => setSelectedInvoiceForView({data: inv, type: 'sale'})} sortConfig={customerDueSort} onSort={key => setCustomerDueSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} />;
      case 'customerDueReport':
        return <CustomerDueReportView customers={customers || []} saleInvoices={saleInvoices || []} notificationSettings={notificationSettings} onViewInvoiceDetails={inv => setSelectedInvoiceForView({data: inv, type: 'sale'})} sortConfig={customerDueSort} onSort={key => setCustomerDueSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} />;
      case 'supplierDueReport':
        return <SupplierDueReportView suppliers={suppliers || []} purchaseInvoices={purchaseInvoices || []} onViewInvoiceDetails={inv => setSelectedInvoiceForView({data: inv, type: 'purchase'})} sortConfig={supplierDueSort} onSort={key => setSupplierDueSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} />;
      case 'stockOnHandReport':
        return <StockOnHandReportView medications={medications || []} sortConfig={stockOnHandSort} onSort={key => setStockOnHandSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} />;
      case 'customerSaleReport':
        return <CustomerSaleReportView customers={customers || []} saleInvoices={saleInvoices || []} onViewInvoiceDetails={inv => setSelectedInvoiceForView({data: inv, type: 'sale'})} sortConfig={customerSaleSort} onSort={key => setCustomerSaleSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} />;
      case 'customerTransactionTimelineReport':
        return <CustomerTransactionTimelineReportView customers={customers || []} saleInvoices={saleInvoices || []} cashTransactions={cashTransactions || []} saleReturnInvoices={saleReturnInvoices || []} onViewInvoiceDetails={inv => setSelectedInvoiceForView({data: inv, type: 'sale'})} sortConfig={customerTimelineSort} onSort={key => setCustomerTimelineSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} />;
      case 'expiryReport':
        return <ExpiryReportView medications={medications || []} sortConfig={expiryReportSort} onSort={key => setExpiryReportSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} onStockOut={handleStockOutExpired} />;
      case 'expiredProducts':
        return <ExpiredStockOutHistoryView stockOuts={expiredStockOuts || []} onDelete={handleDeleteStockOut} />;
      case 'lowStock':
        return <LowStockView medications={medications || []} suppliers={suppliers || []} />;
      case 'purchaseOrders':
        return <PurchaseOrderView />;
      case 'consolidatedLedgerReport':
        return <ConsolidatedLedgerReportView ledgerEntries={consolidatedLedgerEntries} customers={customers || []} suppliers={suppliers || []} sortConfig={consolidatedLedgerSort} onSort={key => setConsolidatedLedgerSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} />;

      case 'accounting':
        return (
          <AccountingView 
            cashTransactions={cashTransactions || []} 
            cashLedgerSortConfig={null} 
            onCashLedgerSort={() => {}} 
            initialSubView={accountingSubView}
            setIsManualTransactionModalOpen={setIsManualTransactionModalOpen}
            setIsReceivePaymentModalOpen={setIsReceivePaymentModalOpen}
            setIsPaySuppliersModalOpen={setIsPaySuppliersModalOpen}
          />
        );
      
      case 'customers':
        return (
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                  <div className="flex items-center space-x-5">
                      <div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center shadow-inner">
                          <UserGroupIcon className="w-8 h-8" />
                      </div>
                      <div>
                          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.customers')}</h2>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Manage Patient Profiles</p>
                      </div>
                  </div>
                  <div className="flex flex-1 w-full max-w-xl">
                      <SearchBar searchTerm={customerSearch} onSearchChange={setCustomerSearch} placeholder={t('common.searchCustomer')} />
                  </div>
                  <div className="flex items-center space-x-3 shrink-0">
                      <ExportImportActions onBackup={() => exportFullDatabase(db)} onRestore={handleRestore} data={customers || []} filename="SafeSave_Customers" onImport={async c => { await db.customers.bulkPut(c as Customer[]); }} entityType="customer" />
                      <button onClick={() => { setEditingCustomer(null); setIsQuickCustomerModalOpen(true); }} className="bg-primary-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-primary-100 hover:bg-primary-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0">
                          <PlusIcon className="w-5 h-5 mr-2" /> {t('customerList.addButton')}
                      </button>
                  </div>
              </div>
              <CustomerTable customers={filteredCustomers} onEdit={(c) => { setEditingCustomer(c); setIsQuickCustomerModalOpen(true); }} onDelete={id => db.customers.delete(id)} onSort={(key) => setCustomerSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} sortConfig={customerSort} />
            </div>
        );

      case 'suppliers':
        return (
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                    <div className="flex items-center space-x-5">
                        <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center shadow-inner">
                            <TruckIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.suppliers')}</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Manage Vendor Relations</p>
                        </div>
                    </div>
                    <div className="flex flex-1 w-full max-w-xl">
                        <SearchBar searchTerm={supplierSearch} onSearchChange={setSupplierSearch} placeholder={t('common.searchSupplier')} />
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                        <ExportImportActions onBackup={() => exportFullDatabase(db)} onRestore={handleRestore} data={suppliers || []} filename="SafeSave_Suppliers" onImport={async s => { await db.suppliers.bulkPut(s as Supplier[]); }} entityType="supplier" />
                        <button onClick={() => { setEditingSupplier(null); setIsQuickSupplierModalOpen(true); }} className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0">
                            <PlusIcon className="w-5 h-5 mr-2" /> {t('supplierList.addButton')}
                        </button>
                    </div>
                </div>
                <SupplierTable suppliers={filteredSuppliers} onEdit={(s) => { setEditingSupplier(s); setIsQuickSupplierModalOpen(true); }} onDelete={id => db.suppliers.delete(id)} onSort={(key) => setSupplierSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} sortConfig={supplierSort} />
            </div>
        );

      case 'sales':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex items-center space-x-5">
                    <div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <ReceiptIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.sales')}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Inventory Outflow Records</p>
                    </div>
                </div>
                <button 
                  onClick={() => {
                    setIsSaleModalOpen(true);
                    setIsSaleModalMinimized(false);
                    setResumingHeldInvoice(null);
                  }} 
                  className="bg-primary-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-primary-100 hover:bg-primary-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('saleInvoiceList.createButton')}
                </button>
            </div>
            <SaleInvoiceList 
              invoices={sortedSaleInvoices} 
              onViewDetails={(inv) => setSelectedInvoiceForView({data: inv, type: 'sale'})} 
              onEdit={(invoice) => {
                setEditingSaleInvoice(invoice);
                setIsSaleModalOpen(true);
                setIsSaleModalMinimized(false);
              }} 
              onSort={(key) => setSaleInvoiceSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} 
              sortConfig={saleInvoiceSort} 
            />
          </div>
        );

      case 'purchases':
        return (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 transition-all hover:shadow-md">
                <div className="flex items-center space-x-5">
                    <div className="h-16 w-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <TruckIcon className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight leading-none">{t('header.purchases')}</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Vendor Procurement History</p>
                    </div>
                </div>
                <button 
                    onClick={() => {
                        setIsPurchaseModalOpen(true);
                        setIsPurchaseModalMinimized(false);
                        setResumingHeldPurchase(null);
                    }} 
                    className="bg-primary-600 text-white px-8 py-3.5 rounded-2xl shadow-xl shadow-primary-100 hover:bg-primary-700 font-black uppercase text-[11px] tracking-[0.2em] transition-all active:scale-95 flex items-center shrink-0"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {t('purchaseInvoiceList.createButton')}
                </button>
            </div>
            <PurchaseInvoiceList 
              invoices={sortedPurchaseInvoices} 
              onViewDetails={(inv) => setSelectedInvoiceForView({data: inv, type: 'purchase'})} 
              onEdit={(invoice) => {
                setEditingPurchaseInvoice(invoice);
                setIsPurchaseModalOpen(true);
                setIsPurchaseModalMinimized(false);
              }} 
              onSort={(key) => setPurchaseInvoiceSort(prev => ({ key, direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }))} 
              sortConfig={purchaseInvoiceSort} 
            />
          </div>
        );

      default:
        return (
          <DashboardView 
            medications={medications || []} 
            saleInvoices={saleInvoices || []} 
            purchaseInvoices={purchaseInvoices || []}
            serviceInvoices={serviceInvoices || []}
            saleReturnInvoices={saleReturnInvoices || []}
            purchaseReturnInvoices={purchaseReturnInvoices || []}
            cashTransactions={cashTransactions || []}
            onNavigate={handleSetView} 
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentView={currentView} onSetView={handleSetView} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          currentUser={currentUser} onLogout={logout} onOpenSettings={handleOpenSettings} onOpenHeldInvoices={() => setIsHeldInvoicesOpen(true)}
          heldInvoicesCount={heldInvoices?.length || 0} onToggleSidebar={() => setIsSidebarOpen(true)} currentView={currentView} 
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar relative">
          {/* Minimized Modals Indicator */}
          <div className="fixed bottom-6 right-6 z-[100] flex flex-row-reverse flex-wrap items-end gap-3 max-w-[calc(100%-3rem)]">
              {isSaleModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsSaleModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-primary-600 text-white rounded-2xl shadow-2xl hover:bg-primary-700 transition-all active:scale-95 group"
                      >
                          <ReceiptIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">বিক্রয় ফর্ম পুনরায় চালু করুন: {(resumingHeldInvoice?.formData as any)?.invoiceNumber || 'নতুন বিক্রয়'}</span>
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isPurchaseModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsPurchaseModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all active:scale-95 group"
                      >
                          <TruckIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">ক্রয় ফর্ম পুনরায় চালু করুন: {(resumingHeldPurchase?.formData as any)?.invoiceNumber || 'নতুন ক্রয়'}</span>
                          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isServiceModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsServiceModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-purple-600 text-white rounded-2xl shadow-2xl hover:bg-purple-700 transition-all active:scale-95 group"
                      >
                          <ReceiptIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">সেবা বিলিং পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isMedicationModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsMedicationModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-slate-800 text-white rounded-2xl shadow-2xl hover:bg-black transition-all active:scale-95 group"
                      >
                          <InventoryIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">পণ্য এন্ট্রি পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isSaleReturnModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsSaleReturnModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-rose-600 text-white rounded-2xl shadow-2xl hover:bg-rose-700 transition-all active:scale-95 group"
                      >
                          <ArrowUturnLeftIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">বিক্রয় ফেরত পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isPurchaseReturnModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsPurchaseReturnModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-orange-600 text-white rounded-2xl shadow-2xl hover:bg-orange-700 transition-all active:scale-95 group"
                      >
                          <ArrowUturnLeftIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">ক্রয় ফেরত পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isServiceDefinitionModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsServiceDefinitionModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-primary-600 text-white rounded-2xl shadow-2xl hover:bg-primary-700 transition-all active:scale-95 group border-2 border-white/20"
                      >
                          <ClipboardDocumentListIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">সেবা তালিকা এন্ট্রি পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isQuickCustomerModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsQuickCustomerModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-primary-600 text-white rounded-2xl shadow-2xl hover:bg-primary-700 transition-all active:scale-95 group"
                      >
                          <UserGroupIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">কাস্টমার এন্ট্রি পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isQuickSupplierModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsQuickSupplierModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-blue-600 text-white rounded-2xl shadow-2xl hover:bg-blue-700 transition-all active:scale-95 group"
                      >
                          <TruckIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">সাপ্লায়ার এন্ট্রি পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isQuickMedicationModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsQuickMedicationModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-slate-800 text-white rounded-2xl shadow-2xl hover:bg-black transition-all active:scale-95 group"
                      >
                          <InventoryIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">দ্রুত পণ্য এন্ট্রি পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isManualTransactionModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsManualTransactionModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-primary-600 text-white rounded-2xl shadow-2xl hover:bg-primary-700 transition-all active:scale-95 group border-2 border-white/20"
                      >
                          <PlusCircleIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">অন্যান্য এন্ট্রি পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isReceivePaymentModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsReceivePaymentModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-emerald-600 text-white rounded-2xl shadow-2xl hover:bg-emerald-700 transition-all active:scale-95 group border-2 border-white/20"
                      >
                          <ArrowDownCircleIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">বকেয়া সংগ্রহ পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}

              {isPaySuppliersModalMinimized && (
                  <div className="animate-in slide-in-from-right-5 duration-300">
                      <button 
                        onClick={() => setIsPaySuppliersModalMinimized(false)}
                        className="flex items-center space-x-3 px-6 py-4 bg-rose-600 text-white rounded-2xl shadow-2xl hover:bg-rose-700 transition-all active:scale-95 group border-2 border-white/20"
                      >
                          <ArrowUpCircleIcon className="w-5 h-5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">সাপ্লায়ার পেমেন্ট পুনরায় চালু করুন</span>
                          <div className="w-2 h-2 bg-rose-400 rounded-full animate-pulse ml-2"></div>
                      </button>
                  </div>
              )}
          </div>
          
          <div className="max-w-[1600px] mx-auto"> {renderContent()} </div>
        </main>
      </div>

      {/* Modals */}
      <MedicationFormModal 
        isOpen={isMedicationModalOpen} 
        onClose={() => { setIsMedicationModalOpen(false); setIsMedicationModalMinimized(false); }} 
        onSubmit={m => { db.medications.put(m); setLastCreatedMedicationId(m.id); }} 
        title={editingMedication ? t('productForm.editTitle') : t('productForm.addTitle')} 
        initialData={editingMedication} 
        existingMedications={medications} 
        onMinimize={() => setIsMedicationModalMinimized(true)}
        isMinimized={isMedicationModalMinimized}
      />
      <ServiceDefinitionFormModal 
        isOpen={isServiceDefinitionModalOpen} 
        onClose={() => { setIsServiceDefinitionModalOpen(false); setIsServiceDefinitionModalMinimized(false); }} 
        onSubmit={sd => db.serviceItemDefinitions.put(sd)} 
        initialData={editingServiceDefinition} 
        onMinimize={() => setIsServiceDefinitionModalMinimized(true)}
        isMinimized={isServiceDefinitionModalMinimized}
      />
      
      <SaleInvoiceFormModal 
        key={saleModalKey}
        isOpen={isSaleModalOpen} 
        onClose={() => {
            setIsSaleModalOpen(false);
            setIsSaleModalMinimized(false);
            setResumingHeldInvoice(null);
            setEditingSaleInvoice(null);
        }} 
        onSubmit={handleAddSale} 
        onHold={handleHoldSale}
        onMinimize={() => setIsSaleModalMinimized(true)}
        isMinimized={isSaleModalMinimized}
        medications={medications || []} 
        customers={customers || []} 
        getNextInvoiceNumber={() => getNextInvoiceNumber('INV', db.saleInvoices)} 
        onCreateCustomer={() => { setEditingCustomer(null); setIsQuickCustomerModalOpen(true); }} 
        resumeData={resumingHeldInvoice}
        editData={editingSaleInvoice}
        lastCreatedCustomerId={lastCreatedCustomerId}
        lastCreatedMedicationId={lastCreatedMedicationId}
      />

      <PurchaseInvoiceFormModal 
        isOpen={isPurchaseModalOpen} 
        onClose={() => {
            setIsPurchaseModalOpen(false);
            setIsPurchaseModalMinimized(false);
            setResumingHeldPurchase(null);
            setEditingPurchaseInvoice(null);
        }} 
        onSubmit={handleAddPurchase}
        onHold={handleHoldPurchase}
        onMinimize={() => setIsPurchaseModalMinimized(true)}
        isMinimized={isPurchaseModalMinimized}
        medications={medications || []} 
        suppliers={suppliers || []} 
        getNextInvoiceNumber={() => getNextInvoiceNumber('PUR', db.purchaseInvoices)} 
        onCreateSupplier={() => { setEditingSupplier(null); setIsQuickSupplierModalOpen(true); }} 
        onCreateMedication={() => setIsQuickMedicationModalOpen(true)}
        resumeData={resumingHeldPurchase}
        editData={editingPurchaseInvoice}
        lastCreatedSupplierId={lastCreatedSupplierId}
        lastCreatedMedicationId={lastCreatedMedicationId}
      />

      <ServiceInvoiceFormModal 
        isOpen={isServiceModalOpen} 
        onClose={() => { 
          setIsServiceModalOpen(false); 
          setIsServiceModalMinimized(false); 
          setEditingServiceInvoice(null);
        }} 
        onSubmit={handleAddService} 
        serviceDefinitions={serviceDefinitions || []} 
        customers={customers || []} 
        getNextInvoiceNumber={() => getNextInvoiceNumber('SRV', db.serviceInvoices)} 
        onCreateCustomer={() => { setEditingCustomer(null); setIsQuickCustomerModalOpen(true); }} 
        onMinimize={() => setIsServiceModalMinimized(true)}
        isMinimized={isServiceModalMinimized}
        editData={editingServiceInvoice}
      />
      <SaleReturnInvoiceFormModal 
        isOpen={isSaleReturnModalOpen} 
        onClose={() => { 
          setIsSaleReturnModalOpen(false); 
          setIsSaleReturnModalMinimized(false); 
          setEditingSaleReturnInvoice(null);
        }} 
        onSubmit={handleAddSaleReturn} 
        medications={medications || []} 
        customers={customers || []} 
        saleInvoices={saleInvoices || []} 
        getNextInvoiceNumber={() => getNextInvoiceNumber('SRN', db.saleReturnInvoices)} 
        onMinimize={() => setIsSaleReturnModalMinimized(true)}
        isMinimized={isSaleReturnModalMinimized}
        editData={editingSaleReturnInvoice}
      />
      <PurchaseReturnInvoiceFormModal 
        isOpen={isPurchaseReturnModalOpen} 
        onClose={() => { 
          setIsPurchaseReturnModalOpen(false); 
          setIsPurchaseReturnModalMinimized(false); 
          setEditingPurchaseReturnInvoice(null);
        }} 
        onSubmit={handleAddPurchaseReturn} 
        medications={medications || []} 
        suppliers={suppliers || []} 
        purchaseInvoices={purchaseInvoices || []} 
        getNextInvoiceNumber={() => getNextInvoiceNumber('PRN', db.purchaseReturnInvoices)} 
        onMinimize={() => setIsPurchaseReturnModalMinimized(true)}
        isMinimized={isPurchaseReturnModalMinimized}
        editData={editingPurchaseReturnInvoice}
      />
      <CustomerFormModal 
        isOpen={isQuickCustomerModalOpen} 
        onClose={() => { setIsQuickCustomerModalOpen(false); setIsQuickCustomerModalMinimized(false); }} 
        onSubmit={handleCustomerSubmit} 
        title={editingCustomer ? t('customerForm.editTitle') : t('customerForm.addTitle')} 
        initialData={editingCustomer} 
        zIndex={60} 
        onMinimize={() => setIsQuickCustomerModalMinimized(true)}
        isMinimized={isQuickCustomerModalMinimized}
      />
      <SupplierFormModal 
        isOpen={isQuickSupplierModalOpen} 
        onClose={() => { setIsQuickSupplierModalOpen(false); setIsQuickSupplierModalMinimized(false); }} 
        onSubmit={handleSupplierSubmit} 
        title={editingSupplier ? t('supplierForm.editTitle') : t('supplierForm.addTitle')} 
        initialData={editingSupplier} 
        zIndex={60} 
        onMinimize={() => setIsQuickSupplierModalMinimized(true)}
        isMinimized={isQuickSupplierModalMinimized}
      />
      <MedicationFormModal 
        isOpen={isQuickMedicationModalOpen} 
        onClose={() => { setIsQuickMedicationModalOpen(false); setIsQuickMedicationModalMinimized(false); }} 
        onSubmit={(m) => { db.medications.add(m); setLastCreatedMedicationId(m.id); }} 
        title={t('productForm.addTitle')} 
        existingMedications={medications} 
        zIndex={60} 
        onMinimize={() => setIsQuickMedicationModalMinimized(true)}
        isMinimized={isQuickMedicationModalMinimized}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        customCategories={customCategories || []} 
        onAddCustomCategory={(n, t) => db.customTransactionCategories.add({ id: crypto.randomUUID(), name: n, type: t })} 
        onDeleteCustomCategory={id => db.customTransactionCategories.delete(id)} 
        initialTab={settingsInitialTab}
      />
      
      <HeldInvoicesModal 
        isOpen={isHeldInvoicesOpen} 
        onClose={() => setIsHeldInvoicesOpen(false)} 
        heldInvoices={heldInvoices || []} 
        onResume={handleResumeHeldInvoice} 
        onDiscard={id => db.heldInvoices.delete(id)} 
      />

      {/* Accounting Modals */}
      <ManualCashTransactionModal 
        isOpen={isManualTransactionModalOpen} 
        onClose={() => { setIsManualTransactionModalOpen(false); setIsManualTransactionModalMinimized(false); }} 
        onSubmit={t => db.cashTransactions.add({ ...t, id: crypto.randomUUID(), timestamp: Date.now() })} 
        title={t('accounting.manualEntryTitle')} 
        customCategories={customCategories || []} 
        onMinimize={() => setIsManualTransactionModalMinimized(true)}
        isMinimized={isManualTransactionModalMinimized}
      />
      <ReceivePaymentModal 
        isOpen={isReceivePaymentModalOpen} 
        onClose={() => { setIsReceivePaymentModalOpen(false); setIsReceivePaymentModalMinimized(false); }} 
        onSubmit={async (cid, amt, dt, n) => {
          const customer = await db.customers.get(cid);
          if (customer) { customer.totalDueAmount -= amt; await db.customers.put(customer);
            await db.cashTransactions.add({ id: crypto.randomUUID(), timestamp: Date.now(), date: dt, type: 'income', category: 'Customer Payment', description: n || `Payment from ${customer.name}`, amount: amt, relatedCustomerId: cid });
          }
        }} 
        customers={customers || []} 
        saleInvoices={saleInvoices || []} 
        onMinimize={() => setIsReceivePaymentModalMinimized(true)}
        isMinimized={isReceivePaymentModalMinimized}
      />
      <PaySuppliersModal 
        isOpen={isPaySuppliersModalOpen} 
        onClose={() => { setIsPaySuppliersModalOpen(false); setIsPaySuppliersModalMinimized(false); }} 
        onSubmit={async (sid, amt, dt, n) => {
          const supplier = await db.suppliers.get(sid);
          if (supplier) { supplier.totalAmountOwed -= amt; await db.suppliers.put(supplier);
            await db.cashTransactions.add({ id: crypto.randomUUID(), timestamp: Date.now(), date: dt, type: 'expense', category: 'Supplier Payment', description: n || `Payment to ${supplier.name}`, amount: amt, relatedSupplierId: sid });
          }
        }} 
        suppliers={suppliers || []} 
        purchaseInvoices={purchaseInvoices || []} 
        onMinimize={() => setIsPaySuppliersModalMinimized(true)}
        isMinimized={isPaySuppliersModalMinimized}
      />

      {selectedInvoiceForView && <InvoiceDetailModal isOpen={!!selectedInvoiceForView} onClose={() => setSelectedInvoiceForView(null)} invoice={selectedInvoiceForView.data} invoiceType={selectedInvoiceForView.type} customers={customers} zIndex={100} />}
      
      {isRestoring && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white p-6 text-center">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-widest mb-4">ডাটা রিস্টোর হচ্ছে...</h2>
            <p className="text-primary-200 text-sm font-bold uppercase tracking-widest max-w-md">
                দয়া করে অপেক্ষা করুন। আপনার ব্যাকআপ ফাইল থেকে ডাটা ইমপোর্ট করা হচ্ছে। এই প্রক্রিয়াটি সম্পন্ন হতে কয়েক সেকেন্ড সময় নিতে পারে।
            </p>
            <div className="mt-8 flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
            </div>
        </div>
      )}
      {/* Backup Status Toast */}
      {backupStatus && (
        <div className={`fixed bottom-6 right-6 z-[9999] p-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 flex items-center space-x-3 ${
          backupStatus.type === 'success' ? 'bg-green-50 border-green-100 text-green-800' :
          backupStatus.type === 'error' ? 'bg-red-50 border-red-100 text-red-800' :
          'bg-primary-50 border-primary-100 text-primary-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            backupStatus.type === 'success' ? 'bg-green-500' :
            backupStatus.type === 'error' ? 'bg-red-500' :
            'bg-primary-500 animate-pulse'
          }`} />
          <span className="text-xs font-black uppercase tracking-widest">{backupStatus.message}</span>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
