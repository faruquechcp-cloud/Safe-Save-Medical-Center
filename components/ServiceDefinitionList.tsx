
import React, { useState } from 'react';
import { ServiceItemDefinition, GenericSortConfig, SortableServiceItemDefinitionKeys } from '../types';
import ServiceDefinitionRow from './ServiceDefinitionRow';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import { useTranslations } from '../hooks/useTranslations';

interface ServiceDefinitionListProps {
  serviceDefinitions: ServiceItemDefinition[]; 
  onEdit: (item: ServiceItemDefinition) => void;
  onDelete: (id: string) => void;
  onSort: (key: SortableServiceItemDefinitionKeys) => void;
  sortConfig: GenericSortConfig<SortableServiceItemDefinitionKeys> | null;
}

const ITEMS_PER_PAGE = 20;

const TableHeader: React.FC<{ 
    label: string; 
    sortKey: SortableServiceItemDefinitionKeys; 
    onSort: (key: SortableServiceItemDefinitionKeys) => void; 
    sortConfig: GenericSortConfig<SortableServiceItemDefinitionKeys> | null;
    className?: string;
}> = ({ label, sortKey, onSort, sortConfig, className = "" }) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = sortConfig?.direction;

  return (
    <th 
        scope="col" 
        className={`px-4 py-3.5 text-left text-sm font-semibold text-[var(--theme-text-900,theme(colors.gray.900))] cursor-pointer hover:bg-[var(--theme-bg-100,theme(colors.gray.100))] ${className}`}
        onClick={() => onSort(sortKey)}
        aria-sort={isSorted ? (direction === 'ascending' ? 'ascending' : 'descending') : 'none'}
    >
      <div className="flex items-center">
        {label}
        {isSorted && (
            direction === 'ascending' ? 
            <ChevronUpIcon className="ml-1 w-4 h-4 text-[var(--theme-text-600,theme(colors.gray.600))]" /> : 
            <ChevronDownIcon className="ml-1 w-4 h-4 text-[var(--theme-text-600,theme(colors.gray.600))]" />
        )}
      </div>
    </th>
  );
};


const ServiceDefinitionList: React.FC<ServiceDefinitionListProps> = ({ serviceDefinitions, onEdit, onDelete, onSort, sortConfig }) => {
  const { t } = useTranslations();
  const [currentPage, setCurrentPage] = useState(1);

  if (serviceDefinitions.length === 0) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow">
        <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-[var(--theme-text-900,theme(colors.gray.900))]">{t('serviceDefinitionList.noServiceDefinitions', 'No service definitions found.')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('serviceDefinitionList.getStarted', 'Get started by adding a new service definition.')}</p>
      </div>
    );
  }

  // Pagination Logic
  const totalPages = Math.ceil(serviceDefinitions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = serviceDefinitions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="shadow-lg rounded-lg bg-white flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[var(--theme-bg-50,theme(colors.gray.50))]">
            <tr>
              <TableHeader label={t('serviceDefinitionForm.nameLabel', "Service Name")} sortKey="name" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader label={t('serviceDefinitionForm.categoryLabel', "Category")} sortKey="category" onSort={onSort} sortConfig={sortConfig} />
              <TableHeader label={t('serviceDefinitionForm.priceLabel', "Price")} sortKey="price" onSort={onSort} sortConfig={sortConfig} className="text-right"/>
              <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-[var(--theme-text-900,theme(colors.gray.900))]">{t('serviceDefinitionForm.notesLabel', "Notes")}</th>
              <TableHeader label={t('consolidatedLedger.column.date', "Date Added")} sortKey="dateAdded" onSort={onSort} sortConfig={sortConfig} />
              <th scope="col" className="px-4 py-3.5 text-left text-sm font-semibold text-[var(--theme-text-900,theme(colors.gray.900))]">{t('serviceDefinitionList.actions', "Actions")}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((item) => (
              <ServiceDefinitionRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {serviceDefinitions.length > ITEMS_PER_PAGE && (
        <div className="shrink-0 py-3 px-6 border-t border-gray-100 flex items-center justify-between bg-gray-50 rounded-b-lg">
            <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs text-gray-700">
                        Showing <span className="font-bold">{startIndex + 1}</span> to <span className="font-bold">{Math.min(startIndex + ITEMS_PER_PAGE, serviceDefinitions.length)}</span> of <span className="font-bold">{serviceDefinitions.length}</span> results
                    </p>
                </div>
                <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                            <span className="sr-only">Previous</span>
                            <ChevronDownIcon className="h-4 w-4 rotate-90" />
                        </button>
                        <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-xs font-black text-gray-700 uppercase tracking-widest">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                            <span className="sr-only">Next</span>
                            <ChevronUpIcon className="h-4 w-4 rotate-90" />
                        </button>
                    </nav>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDefinitionList;
