
import React from 'react';
import { MedicationItem } from '../types';
import { EXPIRY_WARNING_DAYS, CRITICAL_EXPIRY_DAYS } from '../constants';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import DocumentDuplicateIcon from './icons/DocumentDuplicateIcon';
import AlertBadge from './AlertBadge';
import { getTotalQuantityForMedication, getSoonestExpiryDateForMedication } from '../utils/formatUtils'; 
import { useTranslations } from '../hooks/useTranslations';

interface MedicationRowProps {
  item: MedicationItem;
  onEdit: (item: MedicationItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: MedicationItem) => void;
  isSelected?: boolean;
  onClick?: () => void;
}

const MedicationRow: React.FC<MedicationRowProps> = ({ item, onEdit, onDelete, onDuplicate, isSelected, onClick }) => {
  const { t } = useTranslations();
  const totalQuantityInStock = getTotalQuantityForMedication(item);
  const soonestExpiryDate = getSoonestExpiryDateForMedication(item);

  const isLowStock = totalQuantityInStock <= item.lowStockThreshold;
  
  const today = new Date();
  today.setHours(0,0,0,0); 
  
  let isExpired = false;
  let daysUntilExpiry = Infinity; 
  let isSoonToExpire = false;
  let isCriticallyExpiring = false;
  let displayExpiryDate = "N/A";

  if (soonestExpiryDate) {
    const expiry = new Date(soonestExpiryDate);
    displayExpiryDate = new Date(expiry.getTime() + expiry.getTimezoneOffset() * 60000).toLocaleDateString('en-CA');
    isExpired = expiry < today;
    if (!isExpired) {
        daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
        isSoonToExpire = daysUntilExpiry <= EXPIRY_WARNING_DAYS;
        isCriticallyExpiring = daysUntilExpiry <= CRITICAL_EXPIRY_DAYS;
    }
  }

  // Base row class
  let rowClass = "transition-colors duration-150 cursor-pointer border-b border-gray-50 last:border-b-0";
  
  // Selection and Color logic
  if (isSelected) {
      rowClass += " bg-primary-100 ring-1 ring-inset ring-primary-300";
  } else if (item.isActive === false) {
      rowClass += " bg-gray-100 text-gray-400 opacity-75 hover:bg-gray-200";
  } else if (isExpired) {
    rowClass += " bg-red-50 hover:bg-red-100";
  } else if (isCriticallyExpiring) {
    rowClass += " bg-orange-50 hover:bg-orange-100";
  } else {
    rowClass += " bg-white hover:bg-gray-50";
  }

  return (
    <tr 
        className={rowClass}
        onClick={onClick}
        onDoubleClick={() => onEdit(item)}
    >
      <td className="px-4 py-3 text-sm font-bold whitespace-nowrap flex items-center gap-2">
          {item.name}
          {item.isActive === false && <span className="text-[8px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-black uppercase">Inactive</span>}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{item.genericName}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{item.strength}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{item.form}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{item.manufacturer}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap text-center">{totalQuantityInStock}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{displayExpiryDate}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">{item.location}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <div className="flex flex-col space-y-1">
          {isExpired && <AlertBadge type="critical" message={t('productStatus.expired')} />}
          {isCriticallyExpiring && !isExpired && <AlertBadge type="critical" message={t('productStatus.expiring', { days: daysUntilExpiry })} />}
          {isSoonToExpire && !isCriticallyExpiring && !isExpired && <AlertBadge type="warning" message={t('productStatus.expiring', { days: daysUntilExpiry })} />}
          {isLowStock && totalQuantityInStock > 0 && <AlertBadge type="warning" message={t('productStatus.lowStock')} />}
          {totalQuantityInStock <= 0 && <AlertBadge type="critical" message={t('productStatus.outOfStock')} />}
        </div>
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(item); }}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
            title={t('common.duplicate', 'Copy Product')}
          >
            <DocumentDuplicateIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(item); }}
            className="p-1.5 text-gray-400 hover:text-[var(--color-primary-600)] hover:bg-blue-50 rounded-lg transition-all"
            title={t('common.edit', 'Edit')}
          >
            <EditIcon className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
            title={t('common.delete', 'Delete')}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default MedicationRow;
