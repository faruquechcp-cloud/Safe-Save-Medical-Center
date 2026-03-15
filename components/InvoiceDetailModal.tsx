
import React, { useRef, useState, useEffect } from 'react'; 
import { 
  SaleInvoice, PurchaseInvoice, 
  ServiceInvoice, 
  SaleReturnInvoice, 
  PurchaseReturnInvoice,
  Customer
} from '../types';
import Modal from './Modal';
import { useSettings } from '../contexts/SettingsContext'; 
import { useTranslations } from '../hooks/useTranslations';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import PrinterIcon from './icons/PrinterIcon';
import CogIcon from './icons/CogIcon';
import EditIcon from './icons/EditIcon';
import CloseIcon from './icons/CloseIcon';
import { StandardTemplate, ThermalTemplate, ProfessionalTemplate, ModernTemplate, MinimalistTemplate } from './InvoiceTemplates';
import { PrintOptions, PaperSize, defaultSettings } from '../themes';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SaleInvoice | PurchaseInvoice | ServiceInvoice | SaleReturnInvoice | PurchaseReturnInvoice | null;
  invoiceType: 'sale' | 'purchase' | 'service' | 'saleReturn' | 'purchaseReturn';
  onEdit?: (type: 'sale' | 'purchase' | 'service' | 'saleReturn' | 'purchaseReturn') => void;
  customers?: Customer[]; // Added to calculate total outstanding
  // Added missing zIndex property to support layered modals
  zIndex?: number;
  autoPrint?: boolean; // New prop for auto printing
}

const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ isOpen, onClose, invoice, invoiceType, onEdit, customers = [], zIndex, autoPrint = false }) => {
  const { 
    appNameBn, appNameEn, 
    companyAddressBn, companyAddressEn, 
    companyContactBn, companyContactEn,
    proprietorBn, proprietorEn,
    companyEmail, companyWebsite,
    logoUrl, printTemplate, printFooterMessage, defaultPrintOptions, setDefaultPrintOptions 
  } = useSettings(); 
  const { t } = useTranslations();
  const printHiddenRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPrintOptions, setShowPrintOptions] = useState(window.innerWidth > 768);
  const [saveStatus, setSaveStatus] = useState<boolean>(false);
  
  const [options, setOptions] = useState<PrintOptions>({
    ...defaultSettings.defaultPrintOptions,
    ...(defaultPrintOptions || {})
  });

  useEffect(() => {
    if (isOpen) {
      setOptions({
        ...defaultSettings.defaultPrintOptions,
        ...(defaultPrintOptions || {})
      });
      setShowPrintOptions(window.innerWidth > 768);
    }
  }, [isOpen, defaultPrintOptions]);

  // Handle Auto Print
  useEffect(() => {
    if (isOpen && autoPrint) {
        // Small delay to ensure rendering completes
        const timer = setTimeout(() => {
            handlePrint();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint]);

  if (!invoice) return null;

  const currentInvoice = invoice as any; 
  const formatDateForPrint = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Use localized date string based on current language
    return date.toLocaleDateString(t('language.current') === 'bn' ? 'bn-BD' : 'en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const formatTimeForPrint = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const lang = t('language.current');
    
    let timeStr = date.toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });

    if (lang === 'bn') {
      // Manually replace AM/PM if the locale string doesn't handle it as expected
      return timeStr.replace('AM', 'পূর্বাহ্ণ').replace('PM', 'অপরাহ্ণ');
    }
    return timeStr;
  };

  let titlePrefix = '';
  let partyName: string | undefined = '';
  let items: any[] = [];
  let invoiceNumber = currentInvoice.invoiceNumber || currentInvoice.returnInvoiceNumber || 'N/A';
  
  // Calculate Outstanding Balances for Sales
  let previousDue = 0;
  let totalOutstanding = 0;

  if (invoiceType === 'sale' && currentInvoice.customerId) {
      const customer = customers.find(c => c.id === currentInvoice.customerId);
      if (customer) {
          totalOutstanding = customer.totalDueAmount;
          // Previous due is total outstanding minus current invoice due (approximation based on current state)
          previousDue = totalOutstanding - (currentInvoice.amountDue || 0);
      }
  }
  
  if (invoiceType === 'sale') {
    titlePrefix = t('reports.saleInvoice', 'Sale Invoice');
    partyName = (currentInvoice as SaleInvoice).customerName;
    items = (currentInvoice as SaleInvoice).items || [];
  } else if (invoiceType === 'purchase') {
    titlePrefix = t('reports.purchaseInvoice', 'Purchase Invoice');
    partyName = (currentInvoice as PurchaseInvoice).supplierName;
    items = (currentInvoice as PurchaseInvoice).items || [];
  } else if (invoiceType === 'service') {
    titlePrefix = t('reports.serviceInvoice', 'Service Invoice');
    partyName = (currentInvoice as ServiceInvoice).customerName;
    items = (currentInvoice as ServiceInvoice).items || [];
  } else if (invoiceType === 'saleReturn') {
    titlePrefix = t('reports.saleReturn', 'Sale Return');
    partyName = (currentInvoice as SaleReturnInvoice).customerName;
    items = (currentInvoice as SaleReturnInvoice).items || [];
  } else if (invoiceType === 'purchaseReturn') {
    titlePrefix = t('reports.purchaseReturn', 'Purchase Return');
    partyName = (currentInvoice as PurchaseReturnInvoice).supplierName;
    items = (currentInvoice as PurchaseReturnInvoice).items || [];
  }

  // Create localized labels map
  const labels = {
    invoice: t('print.invoice', 'Invoice'),
    date: t('print.date', 'Date'),
    time: t('print.time', 'Time'),
    billingTo: t('print.billingTo', 'Billing To'),
    item: t('print.item', 'Description'),
    batch: t('print.batch', 'Batch'),
    qty: t('print.qty', 'Qty'),
    rate: t('print.rate', 'Rate'),
    amount: t('print.amount', 'Amount'),
    subTotal: t('saleInvoiceForm.summary.subtotal', 'Gross Total'),
    discount: t('saleInvoiceForm.summary.discountAmount', 'Discount'),
    netTotal: t('saleInvoiceForm.summary.netPayable', 'Net Payable'),
    paid: t('saleInvoiceForm.summary.amountPaid', 'Paid'),
    due: t('saleInvoiceForm.summary.amountDue', 'Current Due'),
    prevDue: t('saleInvoiceForm.summary.prevDue', 'Previous Due'),
    totalOutstanding: t('saleInvoiceForm.summary.totalOutstanding', 'Total Outstanding'),
    notes: t('productForm.notesLabel', 'Notes'),
    systemGen: t('print.systemGen', 'System Generated Document'),
    printed: t('print.printed', 'Printed:'),
    thankYou: t('print.thankYou', 'Thank You!'),
    authorizedSign: t('print.authorizedSign', 'Authorized Signature'),
    proprietor: t('print.proprietor', 'Proprietor'),
    email: t('print.email', 'Email'),
    website: t('print.website', 'Website')
  };

  const templateData = {
    titlePrefix,
    invoiceNumber,
    date: formatDateForPrint(currentInvoice.date),
    time: formatTimeForPrint(currentInvoice.date),
    partyLabel: invoiceType.toLowerCase().includes('purchase') ? t('header.suppliers') : t('header.customers'),
    partyName: partyName || t('reports.walkInCustomer', 'CASH CUSTOMER'),
    items: items.map(item => ({
      ...item,
      batchNumber: item.batchNumber || '-', 
      unitPrice: Number(item.unitPrice || item.unitCost || item.unitPriceAtReturn || item.unitCostAtReturn || 0),
      totalPrice: Number(item.totalPrice || item.totalCost || item.totalAmount || 0)
    })),
    subTotal: Number(currentInvoice.subTotalAmount || 0),
    discountAmount: Number(currentInvoice.discountAmount || 0),
    totalAmount: Number(currentInvoice.totalAmount || currentInvoice.totalRefundAmount || currentInvoice.totalCreditAmount || 0),
    amountPaid: Number(currentInvoice.amountPaid || currentInvoice.refundIssued || currentInvoice.refundReceived || 0),
    amountDue: Number(currentInvoice.amountDue || 0),
    // Deprecated labels below, use props.labels instead in templates
    amountPaidLabel: 'Amount Paid', 
    totalAmountLabel: 'Net Total',
    amountDueLabel: 'Balance Due',
    notes: currentInvoice.notes || '',
    isSale: invoiceType === 'sale',
    previousDue: previousDue,
    totalOutstanding: totalOutstanding
  };

  const templateSettings = {
    appName: t('language.current') === 'bn' ? appNameBn : appNameEn,
    logoUrl,
    companyAddress: t('language.current') === 'bn' ? companyAddressBn : companyAddressEn,
    companyContact: t('language.current') === 'bn' ? companyContactBn : companyContactEn,
    proprietor: t('language.current') === 'bn' ? proprietorBn : proprietorEn,
    email: companyEmail,
    website: companyWebsite,
    footerMessage: printFooterMessage,
  };

  const renderSelectedTemplate = () => {
    const props = { data: templateData, settings: templateSettings, options, labels };
    switch (printTemplate) {
      case 'thermal': return <ThermalTemplate {...props} />;
      case 'professional': return <ProfessionalTemplate {...props} />;
      case 'modern': return <ModernTemplate {...props} />;
      case 'minimalist': return <MinimalistTemplate {...props} />;
      default: return <StandardTemplate {...props} />;
    }
  };

  const handlePrint = () => {
    const element = printHiddenRef.current;
    if (!element) return;
    
    // Ensure styles for print are applied
    const styleId = 'print-page-size-style';
    let existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    let pageSize = 'A4 portrait';
    if (options.paperSize === 'A5') pageSize = 'A5 portrait';
    else if (options.paperSize === 'Letter') pageSize = 'letter portrait';
    else if (options.paperSize === 'Thermal80') pageSize = '80mm 200mm';
    else if (options.paperSize === 'Custom') pageSize = `${options.customWidth}mm ${options.customHeight}mm`;

    style.innerHTML = `@media print { @page { size: ${pageSize}; margin: 0; } }`;
    document.head.appendChild(style);

    element.classList.add('print-area-target');
    setTimeout(() => {
        window.print();
        element.classList.remove('print-area-target');
    }, 300); 
  };

  const handleSavePdf = () => {
    const element = printHiddenRef.current;
    if (!element) return;
    setIsGeneratingPdf(true);
    
    const pdfFormat = options.paperSize === 'Custom' ? [options.customWidth, options.customHeight] : 
                      options.paperSize === 'Thermal80' ? [80, 250] :
                      options.paperSize.toLowerCase();

    // Momentarily unhide for the library to capture it correctly
    const originalPosition = element.style.position;
    const originalLeft = element.style.left;
    element.style.position = 'relative';
    element.style.left = '0';

    const opt = {
      margin: 0,
      filename: `Invoice_${invoiceNumber}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      // Cast format to any to bypass strict type checking compatibility with Html2PdfOptions
      jsPDF: { unit: 'mm', format: pdfFormat as any, orientation: 'portrait' as const }
    };

    if (html2pdf) {
      html2pdf().set(opt).from(element).save().then(() => {
        setIsGeneratingPdf(false);
        element.style.position = originalPosition;
        element.style.left = originalLeft;
      }).catch((err: any) => {
        console.error(err);
        setIsGeneratingPdf(false);
        element.style.position = originalPosition;
        element.style.left = originalLeft;
      });
    } else {
      setIsGeneratingPdf(false);
      element.style.position = originalPosition;
      element.style.left = originalLeft;
      alert("PDF library not loaded correctly.");
    }
  };

  const updateNumericOption = (key: keyof PrintOptions, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    setOptions(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  return (
    // Fixed: Added zIndex prop to Modal component
    <Modal isOpen={isOpen} onClose={onClose} title={`${titlePrefix} Details: #${invoiceNumber}`} size="5xl" zIndex={zIndex}>
      <div className="flex flex-col h-[calc(100vh-100px)] sm:h-[88vh] overflow-hidden bg-gray-100 relative">
        
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Sidebar Settings */}
          <aside className={`print:hidden bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0 ${showPrintOptions ? 'w-full md:w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 overflow-hidden'}`}>
            <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Settings & Actions</span>
              <button onClick={() => setShowPrintOptions(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <CloseIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-10">
              
              <section className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Document Actions</label>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={handlePrint} 
                        className="flex items-center justify-center px-4 py-3 bg-teal-600 text-white rounded-xl shadow-md hover:bg-teal-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest"
                    >
                        <PrinterIcon className="w-4 h-4 mr-2" /> Print
                    </button>
                    <button 
                        onClick={handleSavePdf} 
                        disabled={isGeneratingPdf}
                        className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-xl shadow-md hover:bg-primary-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> {isGeneratingPdf ? '...' : 'PDF'}
                    </button>
                </div>
                {onEdit && (
                    <button 
                        onClick={() => onEdit(invoiceType)} 
                        className="w-full flex items-center justify-center px-4 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-all text-[10px] font-black uppercase tracking-widest"
                    >
                        <EditIcon className="w-4 h-4 mr-2" /> Edit Invoice
                    </button>
                )}
              </section>

              <div className="h-px bg-gray-100"></div>

              <section className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Visibility</label>
                <div className="grid grid-cols-1 gap-2">
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                        <input type="checkbox" checked={options.showBatch} onChange={() => setOptions({...options, showBatch: !options.showBatch})} className="rounded text-[var(--color-primary-600)]" />
                        <span className="text-xs font-bold text-gray-600">Batch / Serial #</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                        <input type="checkbox" checked={options.showUnitPrice} onChange={() => setOptions({...options, showUnitPrice: !options.showUnitPrice})} className="rounded text-[var(--color-primary-600)]" />
                        <span className="text-xs font-bold text-gray-600">Show Unit Price</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                        <input type="checkbox" checked={options.showTotal} onChange={() => setOptions({...options, showTotal: !options.showTotal})} className="rounded text-[var(--color-primary-600)]" />
                        <span className="text-xs font-bold text-gray-600">Show Line Totals</span>
                    </label>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Scaling (Zoom)</label>
                    <span className="text-xs font-black text-[var(--color-primary-600)]">{(options.contentScale || 100)}%</span>
                </div>
                <input 
                  type="range" min="50" max="150" value={options.contentScale || 100} 
                  onChange={(e) => updateNumericOption('contentScale', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-600)]"
                />
              </section>

              <section className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Margins (mm)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Top</label>
                    <input type="number" value={options.marginTop} onChange={(e) => updateNumericOption('marginTop', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Bottom</label>
                    <input type="number" value={options.marginBottom} onChange={(e) => updateNumericOption('marginBottom', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Left</label>
                    <input type="number" value={options.marginLeft} onChange={(e) => updateNumericOption('marginLeft', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">Right</label>
                    <input type="number" value={options.marginRight} onChange={(e) => updateNumericOption('marginRight', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Paper Format</label>
                <select value={options.paperSize} onChange={(e) => setOptions({...options, paperSize: e.target.value as PaperSize})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none">
                  <option value="A4">A4 (210x297mm)</option>
                  <option value="Print">A (105x297mm)</option>
                  <option value="A5">A5 (148x210mm)</option>
                  <option value="Letter">Letter (8.5x11in)</option>
                  <option value="Thermal80">Thermal 80mm</option>
                  <option value="Custom">Custom Size...</option>
                </select>
                {options.paperSize === 'Custom' && (
                   <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Width (mm)</label>
                            <input type="number" value={options.customWidth} onChange={(e) => updateNumericOption('customWidth', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-gray-400 uppercase">Height (mm)</label>
                            <input type="number" value={options.customHeight} onChange={(e) => updateNumericOption('customHeight', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                        </div>
                   </div>
                )}
              </section>

              <button onClick={() => { setDefaultPrintOptions(options); setSaveStatus(true); setTimeout(() => setSaveStatus(false), 2000); }} className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 ${saveStatus ? 'bg-green-50 text-white' : 'bg-gray-900 text-white hover:bg-black'}`}>
                {saveStatus ? 'Settings Saved!' : 'Save as Default'}
              </button>
            </div>
          </aside>

          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-10 custom-scrollbar bg-gray-200/50 flex flex-col items-center relative">
            {!showPrintOptions && (
                <button onClick={() => setShowPrintOptions(true)} className="fixed left-4 top-20 z-40 p-3 bg-white shadow-xl rounded-full border border-gray-200 text-gray-500 hover:text-[var(--color-primary-600)] transition-all">
                    <CogIcon className="w-6 h-6" />
                </button>
            )}
            
            <div className="shadow-2xl ring-1 ring-black/5 bg-white origin-top transition-transform duration-200 print:hidden mb-12" style={{ width: 'fit-content' }}>
              {renderSelectedTemplate()}
            </div>

            <div ref={printHiddenRef} className="absolute left-[-9999px] top-0 bg-white overflow-visible text-black" style={{ color: 'black' }}>
              {renderSelectedTemplate()}
            </div>
          </div>
        </div>

        {/* Minimal Footer for closing on desktop */}
        <div className="hidden sm:flex shrink-0 p-4 bg-white border-t border-gray-200 justify-end">
          <button 
              onClick={onClose} 
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceDetailModal;
