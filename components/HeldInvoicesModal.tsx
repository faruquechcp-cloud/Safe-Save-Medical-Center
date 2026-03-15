
import React, { useState } from 'react';
import { HeldInvoice } from '../types';
import Modal from './Modal';
import TrashIcon from './icons/TrashIcon';
import PlayCircleIcon from './icons/PlayCircleIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ConfirmationModal from './ConfirmationModal';
import { useTranslations } from '../hooks/useTranslations';

interface HeldInvoicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  heldInvoices: HeldInvoice[];
  onResume: (invoice: HeldInvoice) => void;
  onDiscard: (id: string) => void;
  // Added missing zIndex property to support layered modals
  zIndex?: number;
}

const HeldInvoicesModal: React.FC<HeldInvoicesModalProps> = ({ 
    isOpen, onClose, heldInvoices, onResume, onDiscard, zIndex 
}) => {
  const { t } = useTranslations();
  const [confirmDiscardId, setConfirmDiscardId] = useState<string | null>(null);
  const [confirmDiscardName, setConfirmDiscardName] = useState<string>('');

  const handleOpenDiscardConfirmation = (invoice: HeldInvoice) => {
    setConfirmDiscardId(invoice.id);
    setConfirmDiscardName(invoice.descriptiveName);
  };

  const handleConfirmDiscard = () => {
    if (confirmDiscardId) {
      onDiscard(confirmDiscardId);
    }
    setConfirmDiscardId(null);
    setConfirmDiscardName('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-CA', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit', hour12: true 
    });
  };

  const getInvoiceTypeDisplay = (type: HeldInvoice['type']) => {
    switch (type) {
      case 'sale': return t('heldInvoices.typeSale', 'Sale');
      case 'purchase': return t('heldInvoices.typePurchase', 'Purchase');
      case 'service': return t('heldInvoices.typeService', 'Service');
      case 'saleReturn': return t('heldInvoices.typeSaleReturn', 'Sale Return');
      case 'purchaseReturn': return t('heldInvoices.typePurchaseReturn', 'Purchase Return');
      default:
        return type;
    }
  };

  return (
    <>
      {/* Fixed: Added zIndex prop to Modal component */}
      <Modal isOpen={isOpen} onClose={onClose} title={t('heldInvoices.modalTitle', "Held Invoices / Suspended Tasks")} size="2xl" zIndex={zIndex}>
        {heldInvoices.length === 0 ? (
          <div className="text-center py-8">
            <ArchiveBoxIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">{t('heldInvoices.noHeldInvoices', "No invoices are currently on hold.")}</p>
            <p className="text-sm text-gray-500 mt-1">{t('heldInvoices.canHoldInstruction', "You can hold an in-progress sale or purchase invoice to resume it later.")}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {heldInvoices.map((invoice) => (
              <div key={invoice.id} className="p-3 border rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-md font-semibold text-[var(--color-primary-700)]">
                      {invoice.descriptiveName || t('heldInvoices.unnamedInvoice', 'Unnamed Held Invoice')}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {t('heldInvoices.typeLabel', "Type:")} <span className="font-medium">{getInvoiceTypeDisplay(invoice.type)}</span> | 
                      {t('heldInvoices.heldAtLabel', " Held at:")} {formatDate(invoice.heldAt)}
                    </p>
                  </div>
                  <div className="flex space-x-2 flex-shrink-0 ml-2">
                    <button
                      onClick={() => onResume(invoice)}
                      className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors"
                      title={t('heldInvoices.resumeButtonTitle', "Resume this invoice")}
                    >
                      <PlayCircleIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenDiscardConfirmation(invoice)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors"
                      title={t('heldInvoices.discardButtonTitle', "Discard this held invoice")}
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
         <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md shadow-sm"
            >
                {t('modal.close', 'Close')}
            </button>
        </div>
      </Modal>

      {confirmDiscardId && (
        <ConfirmationModal
          isOpen={!!confirmDiscardId}
          onClose={() => setConfirmDiscardId(null)}
          onConfirm={handleConfirmDiscard}
          title={t('heldInvoices.discardConfirmTitle', "Confirm Discard")}
          message={
            t('heldInvoices.discardConfirmMessage', "Are you sure you want to discard the held invoice \"{name}\"? This action cannot be undone.", { name: confirmDiscardName })
          }
          confirmButtonText={t('confirmDelete.deleteButton', "Discard")}
        />
      )}
    </>
  );
};

export default HeldInvoicesModal;
