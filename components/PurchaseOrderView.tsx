
import React, { useState, useMemo } from 'react';
import { db } from '../db';
import { PurchaseOrder, SortablePurchaseOrderKeys, GenericSortConfig } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import SearchIcon from './icons/SearchIcon';
import TrashIcon from './icons/TrashIcon';
import EyeIcon from './icons/EyeIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import OrderSheetDetailModal from './OrderSheetDetailModal';
import { useLiveQuery } from 'dexie-react-hooks';

const PurchaseOrderView: React.FC = () => {
    const { t, currentLanguage } = useTranslations();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig] = useState<GenericSortConfig<SortablePurchaseOrderKeys>>({
        key: 'date',
        direction: 'descending'
    });

    const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const purchaseOrders = useLiveQuery(() => db.purchaseOrders.toArray()) || [];

    const filteredOrders = useMemo(() => {
        let result = [...purchaseOrders];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            result = result.filter(o => 
                o.orderNumber.toLowerCase().includes(lowerSearch) ||
                (o.supplierName || '').toLowerCase().includes(lowerSearch)
            );
        }

        result.sort((a, b) => {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';

            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });

        return result;
    }, [purchaseOrders, searchTerm, sortConfig]);

    const handleDelete = async (id: string) => {
        if (window.confirm(currentLanguage === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this order?')) {
            await db.purchaseOrders.delete(id);
        }
    };

    const handleViewDetail = (order: PurchaseOrder) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const getStatusBadge = (status: PurchaseOrder['status']) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            ordered: 'bg-blue-100 text-blue-700 border-blue-200',
            received: 'bg-green-100 text-green-700 border-green-200',
            cancelled: 'bg-red-100 text-red-700 border-red-200'
        };

        const labels = {
            pending: currentLanguage === 'bn' ? 'অপেক্ষমান' : 'Pending',
            ordered: currentLanguage === 'bn' ? 'অর্ডার করা হয়েছে' : 'Ordered',
            received: currentLanguage === 'bn' ? 'গৃহীত' : 'Received',
            cancelled: currentLanguage === 'bn' ? 'বাতিল' : 'Cancelled'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {currentLanguage === 'bn' ? 'পার্সেস অর্ডার তালিকা' : 'Purchase Order List'}
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        {currentLanguage === 'bn' ? 'সংরক্ষিত সকল অর্ডার শিট এখানে দেখুন' : 'View all saved order sheets here'}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 bg-gray-50/30">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            placeholder={currentLanguage === 'bn' ? 'অর্ডার নম্বর বা সরবরাহকারী দিয়ে খুঁজুন...' : 'Search by order number or supplier...'}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.date')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.orderNo')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('suppliers.supplier')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.items')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.status')}</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredOrders.length > 0 ? (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">{new Date(order.date).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-primary-600">{order.orderNumber}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-700">{order.supplierName || 'General'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-700">{order.items.length}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(order.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleViewDetail(order)}
                                                    className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
                                                    title={t('common.view')}
                                                >
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(order.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                    title={t('common.delete')}
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                <ClipboardDocumentListIcon className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-sm font-bold text-gray-400">
                                                {currentLanguage === 'bn' ? 'কোনো অর্ডার পাওয়া যায়নি' : 'No orders found'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedOrder && (
                <OrderSheetDetailModal 
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    data={{
                        supplierName: selectedOrder.supplierName || '',
                        date: selectedOrder.date,
                        items: selectedOrder.items
                    }}
                    zIndex={120}
                />
            )}
        </div>
    );
};

export default PurchaseOrderView;
