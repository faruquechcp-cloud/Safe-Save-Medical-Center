
import React from 'react';
import { ServiceItemDefinition } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import { useTranslations } from '../hooks/useTranslations';

interface ServiceDefinitionRowProps {
  item: ServiceItemDefinition;
  onEdit: (item: ServiceItemDefinition) => void;
  onDelete: (id: string) => void;
}

const ServiceDefinitionRow: React.FC<ServiceDefinitionRowProps> = ({ item, onEdit, onDelete }) => {
  const { t } = useTranslations();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  return (
    <tr className="bg-white hover:bg-gray-50 transition-colors duration-150">
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{item.name}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{item.category}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-right">Tk. {item.price.toFixed(2)}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{item.notes || '-'}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(item.dateAdded)}</td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onEdit(item)}
            className="text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)] transition-colors"
            title={t('edit', "Edit")}
          >
            <EditIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-500 hover:text-red-700 transition-colors"
            title={t('delete', "Delete")}
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default ServiceDefinitionRow;
