
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslations } from '../hooks/useTranslations';
import { PrintOptions } from '../themes';

interface OrderSheetItem {
  medicationId: string;
  name: string;
  genericName: string;
  strength: string;
  currentStock: number;
  orderQty: number;
}

interface OrderSheetTemplateProps {
  data: {
    supplierName: string;
    date: string;
    items: OrderSheetItem[];
  };
  options: PrintOptions;
}

export const OrderSheetTemplate: React.FC<OrderSheetTemplateProps> = ({ data, options }) => {
  const { 
    appNameBn, appNameEn, 
    companyAddressBn, companyAddressEn, 
    companyContactBn, companyContactEn,
    logoUrl 
  } = useSettings();
  const { t, currentLanguage } = useTranslations();

  const appName = currentLanguage === 'bn' ? appNameBn : appNameEn;
  const companyAddress = currentLanguage === 'bn' ? companyAddressBn : companyAddressEn;
  const companyContact = currentLanguage === 'bn' ? companyContactBn : companyContactEn;

  const getPaperSizeStyle = (): React.CSSProperties => {
    const { paperSize, customWidth, customHeight, marginTop, marginBottom, marginLeft, marginRight } = options;
    let sizeStyle: React.CSSProperties = {};
    
    switch (paperSize) {
      case 'A5': sizeStyle = { width: '148mm', minHeight: '210mm' }; break;
      case 'Letter': sizeStyle = { width: '216mm', minHeight: '279mm' }; break;
      case 'Custom': sizeStyle = { width: `${customWidth || 210}mm`, minHeight: `${customHeight || 297}mm` }; break;
      case 'A4':
      default: sizeStyle = { width: '210mm', minHeight: '297mm' }; break;
    }

    return {
      ...sizeStyle,
      paddingTop: `${marginTop || 10}mm`,
      paddingBottom: `${marginBottom || 10}mm`,
      paddingLeft: `${marginLeft || 10}mm`,
      paddingRight: `${marginRight || 10}mm`,
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
    };
  };

  const getScaleStyle = (): React.CSSProperties => {
    const scaleFactor = (options.contentScale || 100) / 100;
    return {
      transform: `scale(${scaleFactor})`,
      transformOrigin: 'top left',
      width: `${100 / scaleFactor}%`, 
      boxSizing: 'border-box'
    };
  };

  return (
    <div 
      className="bg-white text-black font-sans mx-auto shadow-sm"
      style={getPaperSizeStyle()}
    >
      <div style={getScaleStyle()}>
        {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-900 pb-6 mb-8">
        <div className="flex items-center space-x-4">
          {logoUrl && <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain" referrerPolicy="no-referrer" />}
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter">{appName}</h1>
            <p className="text-xs font-bold text-gray-600 max-w-xs">{companyAddress}</p>
            <p className="text-xs font-black text-gray-900 mt-1">{companyContact}</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-black uppercase tracking-widest text-gray-300 mb-1">{t('reports.orderSheet')}</h2>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-gray-400">{t('print.date')}: <span className="text-gray-900">{data.date}</span></p>
          </div>
        </div>
      </div>

      {/* Supplier Info */}
      <div className="mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">{t('reports.supplier')}</p>
        <p className="text-lg font-black text-gray-900 uppercase">{data.supplierName || t('common.notAvailable')}</p>
      </div>

      {/* Items Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="bg-gray-900 text-white">
            <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest w-12">#</th>
            <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest">{t('purchaseInvoiceForm.item.medication')}</th>
            <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest w-32">{t('reports.orderQty')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 border-b border-gray-100">
          {data.items.map((item, index) => (
            <tr key={item.medicationId} className="hover:bg-gray-50 transition-colors">
              <td className="py-4 px-4 text-xs font-black text-gray-400">{index + 1}</td>
              <td className="py-4 px-4">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-black text-gray-900 uppercase">{item.name}</span>
                  <span className="text-[10px] font-bold text-gray-500">{item.strength}</span>
                </div>
              </td>
              <td className="py-4 px-4 text-right text-sm font-black text-gray-900">{item.orderQty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-auto pt-20">
        <div className="flex justify-between items-end">
          <div className="space-y-4">
            <div className="h-px w-48 bg-gray-300"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{t('print.authorizedSign')}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t('print.systemGen')}</p>
            <p className="text-[9px] font-bold text-gray-300 italic">Generated via {appNameEn}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
