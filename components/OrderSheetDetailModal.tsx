
import React, { useRef, useState, useEffect } from 'react';
import Modal from './Modal';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import PrinterIcon from './icons/PrinterIcon';
import CogIcon from './icons/CogIcon';
import CloseIcon from './icons/CloseIcon';
import PhotoIcon from './icons/PhotoIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import ShareIcon from './icons/ShareIcon';
import MessengerIcon from './icons/MessengerIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import { OrderSheetTemplate } from './OrderSheetTemplate';
import { PrintOptions, PaperSize, defaultSettings } from '../themes';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { toJpeg, toBlob } from 'html-to-image';
import { exportToCSV } from '../utils/exportUtils';

interface OrderSheetItem {
  medicationId: string;
  name: string;
  genericName: string;
  strength: string;
  currentStock: number;
  orderQty: number;
}

interface OrderSheetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    supplierName: string;
    date: string;
    items: OrderSheetItem[];
  };
  zIndex?: number;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

const OrderSheetDetailModal: React.FC<OrderSheetDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  data, 
  zIndex,
  onMinimize,
  isMinimized = false
}) => {
  const { defaultPrintOptions, setDefaultPrintOptions, appName } = useSettings();
  const { t, currentLanguage } = useTranslations();
  const printHiddenRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
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

  const handlePrint = () => {
    const element = printHiddenRef.current;
    if (!element) return;

    const styleId = 'print-page-size-style';
    let existingStyle = document.getElementById(styleId);
    if (existingStyle) existingStyle.remove();

    const style = document.createElement('style');
    style.id = styleId;
    let pageSize = 'A4 portrait';
    if (options.paperSize === 'A5') pageSize = 'A5 portrait';
    else if (options.paperSize === 'Letter') pageSize = 'letter portrait';
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

    const pdfFormat = options.paperSize === 'Custom' 
      ? [options.customWidth || 210, options.customHeight || 297] 
      : options.paperSize.toLowerCase();

    const originalPosition = element.style.position;
    const originalLeft = element.style.left;
    element.style.position = 'relative';
    element.style.left = '0';

    const opt = {
      margin: 0,
      filename: `Order_Sheet_${data.supplierName || 'General'}_${data.date}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
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

  const handleSaveImage = () => {
    const element = printHiddenRef.current;
    if (!element) return;
    setIsGeneratingImage(true);

    const originalPosition = element.style.position;
    const originalLeft = element.style.left;
    element.style.position = 'relative';
    element.style.left = '0';

    toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Order_Sheet_${data.supplierName || 'General'}_${data.date}.jpg`;
        link.href = dataUrl;
        link.click();
        setIsGeneratingImage(false);
        element.style.position = originalPosition;
        element.style.left = originalLeft;
      })
      .catch((err) => {
        console.error('Image generation failed', err);
        setIsGeneratingImage(false);
        element.style.position = originalPosition;
        element.style.left = originalLeft;
      });
  };

  const handleShare = async () => {
    const element = printHiddenRef.current;
    if (!element || typeof navigator === 'undefined' || !('share' in navigator)) {
        alert("Sharing is not supported on this browser/device.");
        return;
    }
    
    setIsSharing(true);
    try {
        const blob = await toBlob(element, { quality: 0.95, backgroundColor: '#ffffff' });
        if (!blob) throw new Error("Failed to generate image");

        const file = new File([blob], `Order_Sheet_${data.date}.jpg`, { type: 'image/jpeg' });
        
        const nav = navigator as any;
        if (nav.canShare && nav.canShare({ files: [file] })) {
            await nav.share({
                files: [file],
                title: 'Order Sheet',
                text: `Order Sheet for ${data.supplierName || 'General'} - ${data.date}`,
            });
        } else {
            // Fallback to text share if file share not supported
            await nav.share({
                title: 'Order Sheet',
                text: `Order Sheet for ${data.supplierName || 'General'} - ${data.date}`,
                url: window.location.href
            });
        }
    } catch (error) {
        console.error('Sharing failed', error);
    } finally {
        setIsSharing(false);
    }
  };

  const handleMessengerShare = () => {
    let text = `*Order Sheet - ${appName}*\n`;
    text += `Date: ${data.date}\n`;
    if (data.supplierName) text += `Supplier: ${data.supplierName}\n`;
    text += `--------------------------\n`;
    
    data.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.strength})\n`;
      text += `   Order Qty: ${item.orderQty}\n`;
    });
    
    text += `--------------------------\n`;
    text += `Sent via ${appName}`;

    navigator.clipboard.writeText(text).then(() => {
        alert(t('common.success') + ": " + (currentLanguage === 'bn' ? 'অর্ডার শিট কপি করা হয়েছে! মেসেঞ্জারে পেস্ট করুন।' : 'Order sheet copied! Paste it in Messenger.'));
        window.open('https://www.facebook.com/messages/t/', '_blank');
    }).catch(err => {
        console.error('Clipboard error:', err);
        window.open('https://www.facebook.com/messages/t/', '_blank');
    });
  };

  const handleWhatsAppShare = () => {
    let text = `*Order Sheet - ${appName}*\n`;
    text += `Date: ${data.date}\n`;
    if (data.supplierName) text += `Supplier: ${data.supplierName}\n`;
    text += `--------------------------\n`;
    
    data.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} (${item.strength})\n`;
      text += `   Order Qty: ${item.orderQty}\n`;
    });
    
    text += `--------------------------\n`;
    text += `Sent via ${appName}`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleExportCSV = () => {
    const csvData = data.items.map(item => ({
      'Product Name': item.name,
      'Strength': item.strength,
      'Order Quantity': item.orderQty
    }));
    exportToCSV(csvData, `Order_Sheet_${data.supplierName || 'General'}_${data.date}`);
  };

  const updateNumericOption = (key: keyof PrintOptions, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    setOptions(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`${t('reports.orderSheet')} ${t('common.details')}`} 
      size="5xl" 
      zIndex={zIndex}
      onMinimize={onMinimize}
      isMinimized={isMinimized}
    >
      <div className="flex flex-col h-[calc(100vh-100px)] sm:h-[88vh] overflow-hidden bg-gray-100 relative">
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
          {/* Sidebar Settings */}
          <aside className={`print:hidden bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shrink-0 ${showPrintOptions ? 'w-full md:w-80 translate-x-0' : 'w-0 -translate-x-full md:w-0 overflow-hidden'}`}>
            <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('print.settings')}</span>
              <button onClick={() => setShowPrintOptions(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <CloseIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-10">
              <section className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('print.actions')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={handlePrint} 
                    className="flex items-center justify-center px-4 py-3 bg-teal-600 text-white rounded-xl shadow-md hover:bg-teal-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest"
                  >
                    <PrinterIcon className="w-4 h-4 mr-2" /> {t('common.print')}
                  </button>
                  <button 
                    onClick={handleSavePdf} 
                    disabled={isGeneratingPdf}
                    className="flex items-center justify-center px-4 py-3 bg-primary-600 text-white rounded-xl shadow-md hover:bg-primary-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-2" /> {isGeneratingPdf ? '...' : t('common.pdf')}
                  </button>
                  <button 
                    onClick={handleSaveImage} 
                    disabled={isGeneratingImage}
                    className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-xl shadow-md hover:bg-orange-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    <PhotoIcon className="w-4 h-4 mr-2" /> {isGeneratingImage ? '...' : t('common.jpg')}
                  </button>
                  <button 
                    onClick={handleExportCSV} 
                    className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-xl shadow-md hover:bg-gray-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest"
                  >
                    <ClipboardDocumentListIcon className="w-4 h-4 mr-2" /> {t('common.csv')}
                  </button>
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button 
                        onClick={handleShare} 
                        disabled={isSharing}
                        className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                        <ShareIcon className="w-4 h-4 mr-2" /> {isSharing ? '...' : t('common.share')}
                    </button>
                  )}
                  <button 
                    onClick={handleMessengerShare} 
                    className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest"
                  >
                    <MessengerIcon className="w-4 h-4 mr-2" /> Messenger
                  </button>
                  <button 
                    onClick={handleWhatsAppShare} 
                    className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 transition-all active:scale-95 text-[10px] font-black uppercase tracking-widest"
                  >
                    <WhatsAppIcon className="w-4 h-4 mr-2" /> WhatsApp
                  </button>
                </div>
              </section>

              <div className="h-px bg-gray-100"></div>

              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('print.scaling')}</label>
                  <span className="text-xs font-black text-primary-600">{(options.contentScale || 100)}%</span>
                </div>
                <input 
                  type="range" min="50" max="150" value={options.contentScale || 100} 
                  onChange={(e) => updateNumericOption('contentScale', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </section>

              <section className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('print.margins')}</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">{t('print.top')}</label>
                    <input type="number" value={options.marginTop} onChange={(e) => updateNumericOption('marginTop', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">{t('print.bottom')}</label>
                    <input type="number" value={options.marginBottom} onChange={(e) => updateNumericOption('marginBottom', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">{t('print.left')}</label>
                    <input type="number" value={options.marginLeft} onChange={(e) => updateNumericOption('marginLeft', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-400 uppercase">{t('print.right')}</label>
                    <input type="number" value={options.marginRight} onChange={(e) => updateNumericOption('marginRight', e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm font-bold" />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('print.paperFormat')}</label>
                <select value={options.paperSize} onChange={(e) => setOptions({...options, paperSize: e.target.value as PaperSize})} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold outline-none">
                  <option value="A4">A4 (210x297mm)</option>
                  <option value="A5">A5 (148x210mm)</option>
                  <option value="Letter">Letter (8.5x11in)</option>
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
                {saveStatus ? t('print.saved') : t('print.saveDefault')}
              </button>
            </div>
          </aside>

          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-10 custom-scrollbar bg-gray-200/50 flex flex-col items-center relative">
            {!showPrintOptions && (
              <button onClick={() => setShowPrintOptions(true)} className="fixed left-4 top-20 z-40 p-3 bg-white shadow-xl rounded-full border border-gray-200 text-gray-500 hover:text-primary-600 transition-all">
                <CogIcon className="w-6 h-6" />
              </button>
            )}
            
            <div className="shadow-2xl ring-1 ring-black/5 bg-white origin-top transition-transform duration-200 print:hidden mb-12" style={{ width: 'fit-content' }}>
              <OrderSheetTemplate data={data} options={options} />
            </div>

            <div ref={printHiddenRef} className="absolute left-[-9999px] top-0 bg-white overflow-visible text-black" style={{ color: 'black' }}>
              <OrderSheetTemplate data={data} options={options} />
            </div>
          </div>
        </div>

        <div className="hidden sm:flex shrink-0 p-4 bg-white border-t border-gray-200 justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all active:scale-95"
          >
            {t('modal.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderSheetDetailModal;
