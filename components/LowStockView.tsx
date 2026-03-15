
import React, { useMemo, useState } from 'react';
import { MedicationItem, Supplier, PurchaseOrder } from '../types';
import { db } from '../db';
import WarningIcon from './icons/WarningIcon';
import PrinterIcon from './icons/PrinterIcon';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import ShareIcon from './icons/ShareIcon';
import ChatBubbleLeftIcon from './icons/ChatBubbleLeftIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import { useTranslations } from '../hooks/useTranslations';
import { useSettings } from '../contexts/SettingsContext';
import { getTotalQuantityForMedication } from '../utils/formatUtils';
import { exportToCSV } from '../utils/exportUtils';
import SearchableSelect from './SearchableSelect';
import MedicationSelector from './MedicationSelector';
import Modal from './Modal';
import OrderSheetDetailModal from './OrderSheetDetailModal';

interface LowStockViewProps {
  medications: MedicationItem[];
  suppliers: Supplier[];
}

interface OrderItem {
  medicationId: string;
  name: string;
  genericName: string;
  strength: string;
  currentStock: number;
  orderQty: number;
}

const ITEMS_PER_PAGE = 50;

const LowStockView: React.FC<LowStockViewProps> = ({ medications, suppliers }) => {
  const { t, currentLanguage } = useTranslations();
  const { appName, logoUrl } = useSettings();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isOrderSheetModalOpen, setIsOrderSheetModalOpen] = useState(false);
  const [isOrderSheetModalMinimized, setIsOrderSheetModalMinimized] = useState(false);
  const [orderSheetSupplierId, setOrderSheetSupplierId] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDetailModalMinimized, setIsDetailModalMinimized] = useState(false);

  const lowStockItems = useMemo(() => {
    return medications.filter(m => {
      if (m.isActive === false) return false;
      // User requested: only products that have been in stock (at least one batch)
      if (m.batches.length === 0) return false;
      
      const totalQty = getTotalQuantityForMedication(m);
      return totalQty <= m.lowStockThreshold;
    }).map(m => ({
        ...m,
        currentStock: getTotalQuantityForMedication(m)
    })).sort((a, b) => a.currentStock - b.currentStock); // Sort by lowest stock first
  }, [medications]);

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItemIds(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedItemIds.size === lowStockItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(lowStockItems.map(item => item.id)));
    }
  };

  const handleCreateOrderSheet = () => {
    const itemsToOrder = lowStockItems
      .filter(item => selectedItemIds.has(item.id))
      .map(item => ({
        medicationId: item.id,
        name: item.name,
        genericName: item.genericName,
        strength: item.strength,
        currentStock: item.currentStock,
        orderQty: 10 // Default order qty
      }));
    
    setOrderItems(itemsToOrder);
    setIsOrderSheetModalOpen(true);
  };

  const handleRemoveFromOrder = (id: string) => {
    setOrderItems(orderItems.filter(item => item.medicationId !== id));
  };

  const handleUpdateOrderQty = (id: string, qty: number) => {
    setOrderItems(orderItems.map(item => 
      item.medicationId === id ? { ...item, orderQty: qty } : item
    ));
  };

  const handleAddItemToOrder = (medicationId: string) => {
    if (!medicationId) return;
    
    const med = medications.find(m => m.id === medicationId);
    if (!med) return;

    // Check if already in order
    if (orderItems.some(item => item.medicationId === medicationId)) {
      alert(currentLanguage === 'bn' ? 'এই আইটেমটি ইতিমধ্যে অর্ডার তালিকায় আছে।' : 'This item is already in the order list.');
      return;
    }

    const newItem: OrderItem = {
      medicationId: med.id,
      name: med.name,
      genericName: med.genericName,
      strength: med.strength,
      currentStock: getTotalQuantityForMedication(med),
      orderQty: 10
    };

    setOrderItems(prev => [newItem, ...prev]);
  };

  const handleExportOrderSheet = () => {
    const supplier = suppliers.find(s => s.id === orderSheetSupplierId);
    const data = orderItems.map(item => ({
        'Product Name': item.name,
        'Generic Name': item.genericName,
        'Strength': item.strength,
        'Current Stock': item.currentStock,
        'Order Quantity': item.orderQty
    }));
    exportToCSV(data, `Order_Sheet_${supplier?.name || 'General'}_${new Date().toISOString().split('T')[0]}`);
  };

  const handleSaveOrderSheet = async () => {
    if (orderItems.length === 0) return;
    
    try {
        const orderNumber = `PO-${Date.now().toString().slice(-6)}`;
        const newOrder: PurchaseOrder = {
            id: crypto.randomUUID(),
            orderNumber,
            date: new Date().toISOString(),
            supplierId: orderSheetSupplierId || undefined,
            supplierName: suppliers.find(s => s.id === orderSheetSupplierId)?.name,
            items: orderItems.map(item => ({
                medicationId: item.medicationId,
                name: item.name,
                genericName: item.genericName,
                strength: item.strength,
                currentStock: item.currentStock,
                orderQty: item.orderQty
            })),
            status: 'pending'
        };

        await db.purchaseOrders.add(newOrder);
        alert(currentLanguage === 'bn' ? 'অর্ডার শিট সফলভাবে সংরক্ষিত হয়েছে!' : 'Order sheet saved successfully!');
        setIsOrderSheetModalOpen(false);
    } catch (error) {
        console.error('Failed to save order sheet:', error);
        alert(currentLanguage === 'bn' ? 'সংরক্ষণ করতে সমস্যা হয়েছে' : 'Failed to save order sheet');
    }
  };

  const handleShareOrderSheet = () => {
    const supplier = suppliers.find(s => s.id === orderSheetSupplierId);
    let text = `*Order Sheet - ${appName}*\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    if (supplier) text += `Supplier: ${supplier.name}\n`;
    text += `--------------------------\n`;
    
    orderItems.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.strength})\n`;
      text += `   Order Qty: ${item.orderQty}\n`;
    });
    
    text += `--------------------------\n`;
    text += `Sent via ${appName}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleShareMessenger = () => {
    const supplier = suppliers.find(s => s.id === orderSheetSupplierId);
    let text = `*Order Sheet - ${appName}*\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n`;
    if (supplier) text += `Supplier: ${supplier.name}\n`;
    text += `--------------------------\n`;
    
    orderItems.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.strength})\n`;
      text += `   Order Qty: ${item.orderQty}\n`;
    });
    
    text += `--------------------------\n`;
    text += `Sent via ${appName}`;

    // Messenger doesn't support direct text sharing via URL like WhatsApp
    // So we copy to clipboard first, then open Messenger
    navigator.clipboard.writeText(text).then(() => {
        alert(t('common.success') + ": " + (currentLanguage === 'bn' ? 'অর্ডার শিট কপি করা হয়েছে! মেসেঞ্জারে পেস্ট করুন।' : 'Order sheet copied! Paste it in Messenger.'));
        window.open('https://www.facebook.com/messages/t/', '_blank');
    }).catch(err => {
        console.error('Clipboard error:', err);
        window.open('https://www.facebook.com/messages/t/', '_blank');
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const data = lowStockItems.map(item => ({
        'Product Name': item.name,
        'Generic Name': item.genericName,
        'Strength': item.strength,
        'Form': item.form,
        'Current Stock': item.currentStock,
        'Alert Limit': item.lowStockThreshold,
        'Location': item.location,
        'Manufacturer': item.manufacturer
    }));
    exportToCSV(data, 'Low_Stock_Report');
  };

  // Pagination Logic
  const totalPages = Math.ceil(lowStockItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = lowStockItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const today = new Date().toLocaleDateString('en-CA');

  return (
    <div className="bg-white shadow-xl rounded-[32px] border border-gray-100 flex flex-col h-[calc(100vh-140px)] overflow-hidden">
      
      {/* Header Section */}
      <div className="p-6 sm:p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/30 rounded-t-[32px]">
        <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                <WarningIcon className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">{t('reports.lowStockList')}</h2>
                <p className="text-xs font-medium text-gray-500 mt-1">
                    {t('reports.totalFound')}: <span className="font-bold text-orange-600">{lowStockItems.length}</span>
                </p>
            </div>
        </div>
        
        <div className="flex space-x-3 print:hidden">
            {selectedItemIds.size > 0 && (
                <button 
                    onClick={handleCreateOrderSheet}
                    className="flex items-center px-5 py-2.5 bg-primary-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-200 active:scale-95"
                >
                    <PlusIcon className="w-4 h-4 mr-2" /> {t('reports.createOrderSheet')} ({selectedItemIds.size})
                </button>
            )}
            <button 
                onClick={handleExport}
                className="flex items-center px-5 py-2.5 bg-white border border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm active:scale-95"
            >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> {t('common.exportCSV')}
            </button>
            <button 
                onClick={handlePrint}
                className="flex items-center px-5 py-2.5 bg-orange-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-orange-700 transition-all shadow-md shadow-orange-200 active:scale-95"
            >
                <PrinterIcon className="w-4 h-4 mr-2" /> {t('common.printList')}
            </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        <div className="print-area">
            {/* Print Only Header */}
            <div className="hidden print:block mb-6 text-center">
                {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 mx-auto mb-2 object-contain"/>}
                <h1 className="text-2xl font-black uppercase text-gray-900">{appName}</h1>
                <h2 className="text-lg font-bold text-gray-600 uppercase mt-2">{t('reports.lowStockInventoryReport')}</h2>
                <p className="text-sm text-gray-500">{t('reports.generatedOn')}: {today}</p>
            </div>

            {lowStockItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 opacity-60">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                        <WarningIcon className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 uppercase tracking-widest">{t('reports.stockHealthy')}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-2">{t('reports.stockHealthyDesc')}</p>
                </div>
            ) : (
                <>
                    <table className="min-w-full divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-4 text-center print:hidden">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedItemIds.size === lowStockItems.length && lowStockItems.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                </th>
                                <th className="px-4 py-4 text-left text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">{t('purchaseInvoiceForm.item.medication')}</th>
                                <th className="px-4 py-4 text-left text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">{t('reports.genericType')}</th>
                                <th className="px-4 py-4 text-left text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">{t('productForm.locationLabel')}</th>
                                <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">{t('productForm.thresholdLabel')}</th>
                                <th className="px-4 py-4 text-right text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">{t('purchaseInvoiceForm.item.quantity')}</th>
                                <th className="px-4 py-4 text-center text-[9px] font-black uppercase tracking-[0.1em] text-gray-400">{t('settings.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-50">
                            {currentItems.map((item, idx) => (
                                <tr key={item.id} className={`hover:bg-orange-50/30 transition-colors ${selectedItemIds.has(item.id) ? 'bg-primary-50/30' : ''}`}>
                                    <td className="px-4 py-3 text-center print:hidden">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedItemIds.has(item.id)}
                                            onChange={() => toggleSelection(item.id)}
                                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            <span className="text-gray-400 font-mono text-[10px] mr-3">{startIndex + idx + 1}.</span>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800 uppercase">{item.name}</p>
                                                <p className="text-[10px] text-gray-500">{item.strength}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="text-xs font-medium text-gray-600">{item.genericName}</p>
                                        <p className="text-[10px] text-gray-400">{item.form}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-mono text-gray-500">
                                        {item.location || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs font-bold text-gray-400">
                                        {item.lowStockThreshold}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className={`text-sm font-black ${item.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                            {item.currentStock}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {item.currentStock === 0 ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-800 tracking-wide">
                                                {t('productStatus.outOfStock')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-orange-100 text-orange-800 tracking-wide">
                                                {t('productStatus.lowStock')}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {lowStockItems.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-6 mt-4 rounded-xl print:hidden">
                            <div className="flex flex-1 justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {t('common.previous')}
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {t('common.next')}
                                </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-xs text-gray-700">
                                        {t('common.showing')} <span className="font-bold">{startIndex + 1}</span> {t('common.to')} <span className="font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, lowStockItems.length)}</span> {t('common.of')} <span className="font-bold">{lowStockItems.length}</span> {t('common.results')}
                                    </p>
                                </div>
                                <div>
                                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                        >
                                            <span className="sr-only">{t('common.previous')}</span>
                                            <ChevronDownIcon className="h-4 w-4 rotate-90" aria-hidden="true" />
                                        </button>
                                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                                            {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                        >
                                            <span className="sr-only">{t('common.next')}</span>
                                            <ChevronUpIcon className="h-4 w-4 rotate-90" aria-hidden="true" />
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
      </div>

      {/* Order Sheet Modal */}
      <Modal
        isOpen={isOrderSheetModalOpen}
        onClose={() => { setIsOrderSheetModalOpen(false); setIsOrderSheetModalMinimized(false); }}
        title={t('reports.orderSheet')}
        size="4xl"
        onMinimize={() => setIsOrderSheetModalMinimized(true)}
        isMinimized={isOrderSheetModalMinimized}
      >
        <div className="flex flex-col h-full bg-white">
            <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{t('reports.selectSupplier')}</label>
                        <SearchableSelect 
                            options={suppliers.map(s => ({ id: s.id, label: s.name, subLabel: s.contact }))}
                            selectedId={orderSheetSupplierId}
                            onSelect={setOrderSheetSupplierId}
                            placeholder={t('reports.chooseSupplier')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-primary-400 tracking-widest ml-1">
                            {currentLanguage === 'bn' ? 'অর্ডার তালিকায় নতুন আইটেম যোগ করুন' : 'Add New Item to Order List'}
                        </label>
                        <MedicationSelector 
                            medications={medications}
                            selectedId=""
                            onSelect={handleAddItemToOrder}
                            placeholder={currentLanguage === 'bn' ? 'আইটেম খুঁজুন...' : 'Search item to add...'}
                            showStock={true}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-3">
                        <button 
                            onClick={handleExportOrderSheet}
                            className="flex items-center px-5 py-3 bg-white border border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> {t('common.export')}
                        </button>
                        <button 
                            onClick={handleShareOrderSheet}
                            className="flex items-center px-5 py-3 bg-green-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                        >
                            <ShareIcon className="w-4 h-4 mr-2" /> {t('reports.sendWhatsApp')}
                        </button>
                        <button 
                            onClick={handleShareMessenger}
                            className="flex items-center px-5 py-3 bg-blue-600 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                        >
                            <ChatBubbleLeftIcon className="w-4 h-4 mr-2" /> {t('reports.sendMessenger')}
                        </button>
                        <button 
                            onClick={handleSaveOrderSheet}
                            className="flex items-center px-5 py-3 bg-gray-900 text-white font-bold uppercase text-[10px] tracking-widest rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                        >
                            <ClipboardDocumentListIcon className="w-4 h-4 mr-2" /> {currentLanguage === 'bn' ? 'সংরক্ষণ করুন' : 'Save Order'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-[3fr_2fr_1fr_1fr_0.5fr] gap-4 px-4 py-3 bg-gray-900 rounded-xl text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <div>{t('purchaseInvoiceForm.item.medication')}</div>
                            <div>{t('reports.genericType')}</div>
                            <div className="text-center">{t('dashboard.stockLabel')}</div>
                            <div className="text-center">{t('reports.orderQty')}</div>
                            <div></div>
                        </div>

                        <div className="space-y-2">
                            {orderItems.map((item) => (
                                <div key={item.medicationId} className="grid grid-cols-[3fr_2fr_1fr_1fr_0.5fr] gap-4 items-center p-4 border border-gray-100 rounded-2xl bg-white hover:border-primary-200 transition-all">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 uppercase">{item.name}</p>
                                        <p className="text-[10px] text-gray-500">{item.strength}</p>
                                    </div>
                                    <div className="text-xs text-gray-600">{item.genericName}</div>
                                    <div className="text-center text-xs font-bold text-orange-600">{item.currentStock}</div>
                                    <div>
                                        <input 
                                            type="number" 
                                            value={item.orderQty}
                                            onChange={(e) => handleUpdateOrderQty(item.medicationId, Number(e.target.value))}
                                            className="w-full p-2 border border-gray-100 rounded-xl text-xs font-black text-center focus:ring-2 focus:ring-primary-500/20"
                                        />
                                    </div>
                                    <div className="flex justify-end">
                                        <button 
                                            onClick={() => handleRemoveFromOrder(item.medicationId)}
                                            className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {orderItems.length === 0 && (
                                <div className="py-10 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                    {t('reports.noItemsInOrderSheet')}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            
                    <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
                        <button 
                            onClick={() => setIsOrderSheetModalOpen(false)}
                            className="px-8 py-3 bg-white border border-gray-200 text-gray-600 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-gray-50 transition-all"
                        >
                            {t('common.cancel')}
                        </button>
                        <button 
                            onClick={() => {
                                if (orderItems.length === 0) {
                                    alert(currentLanguage === 'bn' ? 'অর্ডার তালিকায় কোনো আইটেম নেই!' : 'No items in order list!');
                                    return;
                                }
                                setIsDetailModalOpen(true);
                            }}
                            className="px-8 py-3 bg-primary-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200"
                        >
                            {currentLanguage === 'bn' ? 'ফাইনাল ও প্রিভিউ' : 'Finalize & Preview'}
                        </button>
                    </div>
                </div>
          </Modal>

          <OrderSheetDetailModal 
            isOpen={isDetailModalOpen}
            onClose={() => { setIsDetailModalOpen(false); setIsDetailModalMinimized(false); }}
            onMinimize={() => setIsDetailModalMinimized(true)}
            isMinimized={isDetailModalMinimized}
            data={{
                supplierName: suppliers.find(s => s.id === orderSheetSupplierId)?.name || '',
                date: new Date().toLocaleDateString('en-CA'),
                items: orderItems
            }}
            zIndex={120}
          />

      {isOrderSheetModalMinimized && (
        <div className="fixed bottom-6 right-6 z-[110] animate-in slide-in-from-right-5 duration-300">
            <button 
                onClick={() => setIsOrderSheetModalMinimized(false)}
                className="flex items-center space-x-3 px-6 py-4 bg-primary-600 text-white rounded-2xl shadow-2xl hover:bg-primary-700 transition-all active:scale-95 group border-2 border-white/20"
            >
                <ClipboardDocumentListIcon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {currentLanguage === 'bn' ? 'অর্ডার শিট পুনরায় চালু করুন' : 'Resume Order Sheet'}
                </span>
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse ml-2"></div>
            </button>
        </div>
      )}

      {isDetailModalMinimized && (
        <div className="fixed bottom-6 right-6 z-[110] animate-in slide-in-from-right-5 duration-300">
            <button 
                onClick={() => setIsDetailModalMinimized(false)}
                className="flex items-center space-x-3 px-6 py-4 bg-indigo-600 text-white rounded-2xl shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 group border-2 border-white/20"
            >
                <ClipboardDocumentListIcon className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {currentLanguage === 'bn' ? 'বিস্তারিত অর্ডার শিট পুনরায় চালু করুন' : 'Resume Detail Order Sheet'}
                </span>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse ml-2"></div>
            </button>
        </div>
      )}
    </div>
  );
};

export default LowStockView;

