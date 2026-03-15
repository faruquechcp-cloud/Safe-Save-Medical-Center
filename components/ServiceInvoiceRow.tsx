
import React from 'react';
import { ServiceInvoice } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface ServiceInvoiceRowProps {
  invoice: ServiceInvoice;
  onViewDetails: (invoice: ServiceInvoice) => void;
}

const ServiceInvoiceRow: React.FC<ServiceInvoiceRowProps> = ({ invoice, onViewDetails }) => {
  const { t } = useTranslations();
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{invoice.invoiceNumber}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatDate(invoice.date)}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{invoice.customerName || 'N/A'}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-center">{invoice.items.length}</td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap text-right">Tk. {invoice.totalAmount.toFixed(2)}</td>
      <td className={`px-4 py-3 text-sm whitespace-nowrap text-right ${invoice.amountDue > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
          Tk. {invoice.amountDue.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-sm whitespace-nowrap">
        <button
          onClick={() => onViewDetails(invoice)}
          className="text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)] transition-colors"
          title={t('edit', "View Details")} 
        >
          {t('edit', "Details")}
        </button>
      </td>
    </tr>
  );
};

export default ServiceInvoiceRow;
