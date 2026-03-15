
import React from 'react';
import { PrintOptions } from '../themes';

// Labels interface for localization
export interface InvoiceLabels {
  invoice: string;
  date: string;
  time: string;
  billingTo: string;
  item: string;
  batch: string;
  qty: string;
  rate: string;
  amount: string;
  subTotal: string;
  discount: string;
  netTotal: string;
  paid: string;
  due: string;
  prevDue: string;
  totalOutstanding: string;
  notes: string;
  systemGen: string;
  printed: string;
  thankYou: string;
  authorizedSign: string;
  proprietor: string;
  email: string;
  website: string;
}

interface InvoiceData {
  titlePrefix: string;
  invoiceNumber: string;
  date: string;
  time?: string;
  partyLabel: string;
  partyName?: string;
  originalInvoiceNumber?: string;
  originalInvoiceLabel?: string;
  items: any[];
  subTotal: number;
  discountAmount: number;
  discountPercentage?: number | string;
  taxAmount?: number;
  taxLabel?: string;
  totalAmount: number;
  totalAmountLabel: string;
  amountPaid: number;
  amountPaidLabel: string;
  amountDue: number;
  amountDueLabel: string;
  notes?: string;
  isSale?: boolean;
  isPurchase?: boolean;
  isService?: boolean;
  isReturn?: boolean;
  previousDue?: number;
  totalOutstanding?: number;
}

interface TemplateProps {
  data: InvoiceData;
  settings: {
    appName: string;
    logoUrl: string;
    companyAddress: string;
    companyContact: string;
    proprietor?: string;
    email?: string;
    website?: string;
    footerMessage: string;
  };
  options: PrintOptions;
  labels: InvoiceLabels; // Labels are now required
}

const getPaperSizeStyle = (options: PrintOptions): React.CSSProperties => {
  const { paperSize, customWidth, customHeight, marginTop, marginBottom, marginLeft, marginRight } = options;
  let sizeStyle: React.CSSProperties = {};
  
  switch (paperSize) {
    case 'A5': sizeStyle = { width: '148mm', minHeight: '210mm' }; break;
    case 'Letter': sizeStyle = { width: '216mm', minHeight: '279mm' }; break;
    case 'Thermal80': sizeStyle = { width: '80mm' }; break;
    case 'Custom': sizeStyle = { width: `${customWidth || 210}mm`, minHeight: `${customHeight || 297}mm` }; break;
    case 'A4':
    default: sizeStyle = { width: '210mm', minHeight: '297mm' }; break;
  }

  return {
    ...sizeStyle,
    paddingTop: `${marginTop || 0}mm`,
    paddingBottom: `${marginBottom || 0}mm`,
    paddingLeft: `${marginLeft || 0}mm`,
    paddingRight: `${marginRight || 0}mm`,
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
  };
};

const getScaleStyle = (scale: number): React.CSSProperties => {
  const scaleFactor = (scale || 100) / 100;
  return {
    transform: `scale(${scaleFactor})`,
    transformOrigin: 'top left',
    width: `${100 / scaleFactor}%`, 
    boxSizing: 'border-box'
  };
};

// --- STANDARD TEMPLATE ---
export const StandardTemplate: React.FC<TemplateProps> = ({ data, settings, options, labels }) => {
  return (
    <div style={getPaperSizeStyle(options)} className="bg-white mx-auto overflow-hidden shadow-sm">
      <div style={getScaleStyle(options.contentScale)} className="standard-print text-sm box-border">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-gray-100 pb-6">
          <div className="flex-1 pr-4">
            {settings.logoUrl && (
              <div className="mb-4">
                <img src={settings.logoUrl} alt="Logo" className="h-20 w-auto object-contain print:h-16" />
              </div>
            )}
            <h1 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tighter">{settings.appName}</h1>
            {settings.proprietor && <p className="text-xs font-black text-gray-700 uppercase mt-1">{labels.proprietor}: {settings.proprietor}</p>}
            <p className="text-gray-500 whitespace-pre-wrap text-xs mt-2 leading-relaxed font-bold uppercase">{settings.companyAddress}</p>
            <p className="text-gray-500 text-xs mt-1 font-bold">{settings.companyContact}</p>
            {(settings.email || settings.website) && (
              <p className="text-gray-400 text-[10px] mt-1 font-bold">
                {settings.email && <span>{labels.email}: {settings.email} </span>}
                {settings.website && <span>| {labels.website}: {settings.website}</span>}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-4">{data.titlePrefix}</h2>
            <div className="space-y-1 text-gray-600 text-sm">
              <p className="font-bold"># <span className="text-gray-900 font-black">{data.invoiceNumber}</span></p>
              <p className="font-bold">{labels.date}: <span className="text-gray-900 font-black">{data.date}</span></p>
              {data.time && <p className="font-bold">{labels.time}: <span className="text-gray-900 font-black">{data.time}</span></p>}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mb-8">
            <h3 className="text-gray-400 font-black uppercase text-[11px] tracking-widest mb-1">{labels.billingTo}</h3>
            <p className="text-xl font-black text-gray-900 uppercase break-words">{data.partyName || 'CASH CUSTOMER'}</p>
        </div>

        {/* Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200">
                <th className="px-4 py-3 text-left text-xs font-black text-gray-500 uppercase tracking-widest">{labels.item}</th>
                {options.showBatch && <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest">{labels.batch}</th>}
                <th className="px-4 py-3 text-center text-xs font-black text-gray-500 uppercase tracking-widest">{labels.qty}</th>
                {options.showUnitPrice && <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-widest">{labels.rate}</th>}
                {options.showTotal && <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase tracking-widest">{labels.amount}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map((item, idx) => (
                <tr key={idx} className="bg-white">
                  <td className="px-4 py-3 text-gray-900 font-bold uppercase text-sm">
                    {item.medicationName || item.serviceItemName}
                    {options.showReason && item.reason && <div className="text-[10px] text-gray-400 italic font-medium">Reason: {item.reason}</div>}
                  </td>
                  {options.showBatch && (
                    <td className="px-4 py-3 text-center text-gray-500 font-mono text-sm">
                      {item.batchNumber || '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-center text-gray-700 font-bold">{item.quantity || item.quantityReturned}</td>
                  {options.showUnitPrice && <td className="px-4 py-3 text-right text-gray-600">
                    {(Number(item.unitPrice || item.unitCost || item.unitPriceAtReturn || item.unitCostAtReturn || 0)).toFixed(2)}
                  </td>}
                  {options.showTotal && <td className="px-4 py-3 text-right text-gray-900 font-black">
                    {(Number(item.totalPrice || item.totalCost || item.totalAmount || 0)).toFixed(2)}
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-6">
          <div className="w-full sm:w-72 space-y-2 border-t-4 border-gray-900 pt-4">
            <div className="flex justify-between items-center text-gray-500 font-bold text-xs uppercase tracking-widest">
              <span>{labels.subTotal}</span>
              <span className="text-gray-900">Tk. {(data.subTotal || 0).toFixed(2)}</span>
            </div>
            {(data.discountAmount || 0) > 0 && (
              <div className="flex justify-between items-center text-red-500 font-bold text-xs uppercase tracking-widest">
                <span>{labels.discount}</span>
                <span>- Tk. {(data.discountAmount || 0).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-gray-900 pt-2 border-t border-gray-100">
              <span className="font-black text-sm uppercase tracking-tighter">{labels.netTotal}</span>
              <span className="font-black text-xl whitespace-nowrap">Tk. {(data.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-green-600 font-bold text-xs uppercase tracking-widest">
              <span>{labels.paid}</span>
              <span>Tk. {(data.amountPaid || 0).toFixed(2)}</span>
            </div>
            {(data.amountDue || 0) > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-red-600">
                <span className="font-black text-sm uppercase tracking-tighter">{labels.due}</span>
                <span className="font-black text-xl whitespace-nowrap">Tk. {(data.amountDue || 0).toFixed(2)}</span>
              </div>
            )}
            
            {/* Previous Due Section */}
            {data.isSale && (data.totalOutstanding || 0) > 0 && (
               <div className="pt-2 mt-2 border-t border-dashed border-gray-300">
                   {(data.previousDue || 0) > 0 && (
                       <>
                           <div className="flex justify-between items-center text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">
                               <span>{labels.prevDue}</span>
                               <span>Tk. {(data.previousDue || 0).toFixed(2)}</span>
                           </div>
                           <div className="border-b border-gray-300 border-dashed mb-1"></div>
                       </>
                   )}
                   <div className="flex justify-between items-center text-gray-800 font-black text-sm uppercase tracking-widest mt-1">
                       <span>{labels.totalOutstanding}</span>
                       <span className={(data.totalOutstanding || 0) > 0 ? 'text-red-700' : 'text-green-700'}>
                           Tk. {(data.totalOutstanding || 0).toFixed(2)}
                       </span>
                   </div>
               </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 text-center">
          {data.notes && <div className="mb-4 p-3 bg-gray-50 rounded-xl text-left text-[10px] text-gray-600 font-bold uppercase leading-relaxed border-l-4 border-gray-300">
            <strong className="block text-[8px] text-gray-400 mb-1">{labels.notes}</strong>
            {data.notes}
          </div>}
          
          <div className="flex justify-between items-end mb-6 mt-8 px-10">
              <div className="text-center">
                  <div className="h-px w-32 bg-gray-400 mb-2"></div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Received By</p>
              </div>
              <div className="text-center">
                  <div className="h-px w-32 bg-gray-400 mb-2"></div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">{labels.authorizedSign}</p>
              </div>
          </div>
          <p className="text-gray-900 font-black text-xs uppercase tracking-widest">{settings.footerMessage}</p>
          <div className="mt-4 flex justify-between items-center text-[8px] text-gray-300 uppercase tracking-widest font-black border-t border-gray-50 pt-3">
            <p>{labels.systemGen}</p>
            <p>{labels.printed} {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PROFESSIONAL TEMPLATE ---
export const ProfessionalTemplate: React.FC<TemplateProps> = ({ data, settings, options, labels }) => {
  return (
    <div style={getPaperSizeStyle(options)} className="bg-white mx-auto border-t-[12px] border-gray-900 shadow-xl overflow-hidden">
      <div style={getScaleStyle(options.contentScale)} className="professional-print text-sm box-border">
        <div className="flex justify-between items-start mb-12">
          <div className="flex-1 pr-6">
            {settings.logoUrl && (
              <div className="mb-6">
                <img src={settings.logoUrl} alt="Logo" className="h-24 w-auto object-contain" />
              </div>
            )}
            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter mb-4">{settings.appName}</h1>
            <div className="space-y-1 text-xs font-bold text-gray-500 uppercase tracking-widest">
               {settings.proprietor && <p className="text-gray-700 font-black">{labels.proprietor}: {settings.proprietor}</p>}
               <p className="text-gray-900">{settings.companyAddress}</p>
               <p>{settings.companyContact}</p>
               {settings.email && <p>{labels.email}: {settings.email}</p>}
               {settings.website && <p>{labels.website}: {settings.website}</p>}
            </div>
          </div>
          <div className="text-right shrink-0 bg-gray-900 text-white p-8">
            <h2 className="text-4xl font-black uppercase tracking-tighter">{data.titlePrefix}</h2>
            <div className="mt-6 space-y-2 font-black text-[10px] tracking-[0.2em] opacity-80">
              <p>REF: {data.invoiceNumber}</p>
              <p>{labels.date.toUpperCase()}: {data.date}</p>
              {data.time && <p>{labels.time.toUpperCase()}: {data.time}</p>}
            </div>
          </div>
        </div>

        <div className="mb-12 p-8 border-l-[16px] border-gray-100 bg-gray-50/50">
          <h3 className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] mb-2">{labels.billingTo}</h3>
          <p className="text-3xl font-black text-gray-900 uppercase tracking-tighter break-words">{data.partyName || 'CASH CUSTOMER'}</p>
        </div>

        <table className="w-full mb-12 border-collapse">
          <thead className="border-b-4 border-gray-900">
            <tr>
              <th className="px-4 py-4 text-left font-black uppercase tracking-widest text-xs text-gray-400">{labels.item}</th>
              {options.showBatch && <th className="px-4 py-4 text-center font-black uppercase tracking-widest text-xs text-gray-400">{labels.batch}</th>}
              <th className="px-4 py-4 text-center font-black uppercase tracking-widest text-xs text-gray-400">{labels.qty}</th>
              {options.showUnitPrice && <th className="px-4 py-4 text-right font-black uppercase tracking-widest text-xs text-gray-400">{labels.rate}</th>}
              {options.showTotal && <th className="px-4 py-4 text-right font-black uppercase tracking-widest text-xs text-gray-400">{labels.amount}</th>}
            </tr>
          </thead>
          <tbody className="border-b-2 border-gray-100">
            {data.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="px-4 py-5 font-black text-gray-900 uppercase text-sm tracking-tight">
                  {item.medicationName || item.serviceItemName}
                </td>
                {options.showBatch && <td className="px-4 py-5 text-center font-mono text-gray-500 font-bold">{item.batchNumber || '-'}</td>}
                <td className="px-4 py-5 text-center font-black text-gray-700 text-sm">{item.quantity || item.quantityReturned}</td>
                {options.showUnitPrice && <td className="px-4 py-5 text-right font-bold text-gray-500">{(Number(item.unitPrice || item.unitCost || item.unitPriceAtReturn || item.unitCostAtReturn || 0)).toFixed(2)}</td>}
                {options.showTotal && <td className="px-4 py-5 text-right font-black text-gray-900 text-sm">{(Number(item.totalPrice || item.totalCost || item.totalAmount || 0)).toFixed(2)}</td>}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="w-full sm:w-80 bg-gray-50 p-8 space-y-4">
            <div className="flex justify-between items-center text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">
              <span>{labels.subTotal}</span>
              <span className="text-gray-900">Tk. {(data.subTotal || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between items-center text-gray-900 font-black">
              <span className="text-xs uppercase tracking-widest">{labels.netTotal}</span>
              <span className="text-3xl tracking-tighter">Tk. {(data.totalAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-red-600 font-black bg-white p-3 border-2 border-red-50 mt-2">
              <span className="text-[10px] uppercase tracking-widest">{labels.due}</span>
              <span className="text-2xl tracking-tighter">Tk. {(data.amountDue || 0).toFixed(2)}</span>
            </div>
            
            {data.isSale && (data.totalOutstanding || 0) > 0 && (
                <div className="bg-gray-200 p-4 mt-2">
                    {(data.previousDue || 0) > 0 && (
                        <>
                            <div className="flex justify-between items-center text-gray-600 font-bold text-[10px] uppercase tracking-widest mb-2">
                                <span>{labels.prevDue}</span>
                                <span>Tk. {(data.previousDue || 0).toFixed(2)}</span>
                            </div>
                            <div className="border-b border-gray-400 mb-2"></div>
                        </>
                    )}
                    <div className="flex justify-between items-center text-gray-900 font-black">
                        <span className="text-[10px] uppercase tracking-widest">{labels.totalOutstanding}</span>
                        <span className="text-xl tracking-tighter">Tk. {(data.totalOutstanding || 0).toFixed(2)}</span>
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-12 text-center">
          <p className="font-black text-gray-900 uppercase tracking-[0.3em] mb-4 text-xs">{settings.footerMessage}</p>
          <span className="text-[9px] text-gray-300 font-black tracking-widest uppercase">Verified System Invoice | Safe & Save Medical</span>
        </div>
      </div>
    </div>
  );
};

// --- MODERN TEMPLATE ---
export const ModernTemplate: React.FC<TemplateProps> = ({ data, settings, options, labels }) => {
  return (
    <div style={getPaperSizeStyle(options)} className="bg-white mx-auto shadow-2xl overflow-hidden border border-gray-100">
      <div style={getScaleStyle(options.contentScale)} className="modern-print p-0 text-sm box-border">
        <div className="h-6 bg-gray-900 w-full"></div>
        <div className="p-12">
          <div className="flex justify-between mb-20">
            <div className="flex-1 pr-10">
              {settings.logoUrl && (
                <div className="mb-8">
                  <img src={settings.logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
                </div>
              )}
              <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">{settings.appName}</h1>
              <div className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] space-y-2">
                {settings.proprietor && <p className="text-gray-600">{labels.proprietor}: {settings.proprietor}</p>}
                <p>{settings.companyAddress}</p>
                <p className="text-[var(--color-primary-600)]">{settings.companyContact}</p>
                {settings.email && <p>{labels.email}: {settings.email}</p>}
                {settings.website && <p>{labels.website}: {settings.website}</p>}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-8 py-3 bg-[var(--color-primary-600)] text-white text-xl font-black rounded-full mb-6 uppercase tracking-widest shadow-xl">{data.titlePrefix}</span>
              <div className="space-y-1">
                <p className="text-3xl font-black text-gray-900 tracking-tighter">#{data.invoiceNumber}</p>
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">{data.date}</p>
                {data.time && <p className="text-gray-400 font-black text-[10px] uppercase tracking-widest">{data.time}</p>}
              </div>
            </div>
          </div>

          <div className="mb-20">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4 border-b border-gray-100 pb-4">{labels.billingTo}</h3>
            <p className="text-4xl text-gray-900 font-black tracking-tighter break-words uppercase">{data.partyName || 'Private Customer'}</p>
          </div>

          <table className="w-full mb-20 border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-6 text-left font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">{labels.item}</th>
                {options.showBatch && <th className="px-4 py-6 text-center font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">{labels.batch}</th>}
                <th className="px-4 py-6 text-center font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">{labels.qty}</th>
                {options.showUnitPrice && <th className="px-4 py-6 text-right font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">{labels.rate}</th>}
                {options.showTotal && <th className="px-4 py-6 text-right font-black text-gray-400 uppercase text-[10px] tracking-[0.3em]">{labels.subTotal}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-8 px-4 font-black text-gray-800 text-lg tracking-tight uppercase">
                    {item.medicationName || item.serviceItemName}
                  </td>
                  {options.showBatch && <td className="py-8 px-4 text-center font-mono text-xs text-gray-400 font-bold">{item.batchNumber || '-'}</td>}
                  <td className="py-8 px-4 text-center text-gray-600 font-black text-lg">{item.quantity || item.quantityReturned}</td>
                  {options.showUnitPrice && <td className="py-8 px-4 text-right font-bold text-gray-500 text-lg">{(Number(item.unitPrice || item.unitCost || item.unitPriceAtReturn || item.unitCostAtReturn || 0)).toFixed(2)}</td>}
                  {options.showTotal && <td className="py-8 px-4 text-right font-black text-gray-900 text-xl tracking-tighter">{(Number(item.totalPrice || item.totalCost || item.totalAmount || 0)).toFixed(2)}</td>}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div className="bg-[var(--color-primary-50)]/30 p-10 rounded-3xl border-2 border-dashed border-[var(--color-primary-100)]">
                <span className="text-[10px] font-black text-[var(--color-primary-600)] uppercase tracking-widest block mb-4">{labels.notes}</span>
              <p className="text-gray-600 text-xs font-bold leading-relaxed uppercase">{data.notes || 'No administrative notes recorded.'}</p>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                  <span className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{labels.netTotal}</span>
                  <span className="text-[var(--color-primary-600)] text-5xl font-black tracking-tighter whitespace-nowrap">Tk. {(data.totalAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-red-50 p-6 rounded-3xl mt-4 border border-red-100">
                  <span className="text-red-700 text-[10px] font-black uppercase tracking-[0.3em]">{labels.due}</span>
                  <span className="text-red-600 text-3xl font-black tracking-tighter whitespace-nowrap">Tk. {(data.amountDue || 0).toFixed(2)}</span>
              </div>
              
              {data.isSale && (data.totalOutstanding || 0) > 0 && (
                  <div className="flex justify-between items-center bg-gray-100 p-6 rounded-3xl mt-2 border border-gray-200">
                      <div className="flex flex-col w-full">
                          {(data.previousDue || 0) > 0 && (
                              <>
                                <div className="flex justify-between w-full mb-2">
                                    <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{labels.prevDue}</span>
                                    <span className="text-[12px] font-bold text-gray-600">Tk. {(data.previousDue || 0).toFixed(2)}</span>
                                </div>
                                <div className="w-full h-px bg-gray-300 mb-2"></div>
                              </>
                          )}
                          <div className="flex justify-between items-center w-full">
                              <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">{labels.totalOutstanding}</span>
                              <span className="text-gray-800 text-2xl font-black tracking-tighter whitespace-nowrap">Tk. {(data.totalOutstanding || 0).toFixed(2)}</span>
                          </div>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MINIMALIST TEMPLATE ---
export const MinimalistTemplate: React.FC<TemplateProps> = ({ data, settings, options, labels }) => {
    return (
        <div style={getPaperSizeStyle(options)} className="bg-white mx-auto">
            <div style={getScaleStyle(options.contentScale)} className="minimalist-print text-sm box-border p-8 font-mono">
                <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-2xl font-bold uppercase mb-2">{settings.appName}</h1>
                    {settings.proprietor && <p className="text-xs font-bold">{labels.proprietor}: {settings.proprietor}</p>}
                    <p className="text-xs">{settings.companyAddress}</p>
                    <p className="text-xs">{settings.companyContact}</p>
                    {settings.email && <p className="text-xs">{labels.email}: {settings.email}</p>}
                    {settings.website && <p className="text-xs">{labels.website}: {settings.website}</p>}
                </div>
                
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase">{labels.billingTo}:</p>
                        <p className="text-lg font-bold">{data.partyName || 'Walk-in Customer'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold uppercase">{data.titlePrefix}</p>
                        <p className="text-sm">#{data.invoiceNumber}</p>
                        <p className="text-sm">{data.date}</p>
                        {data.time && <p className="text-sm">{data.time}</p>}
                    </div>
                </div>

                <table className="w-full mb-8 border-collapse">
                    <thead className="border-b-2 border-black">
                        <tr>
                            <th className="text-left py-2 font-bold uppercase">{labels.item}</th>
                            {options.showBatch && <th className="text-center py-2 font-bold uppercase">{labels.batch}</th>}
                            <th className="text-center py-2 font-bold uppercase">{labels.qty}</th>
                            {options.showUnitPrice && <th className="text-right py-2 font-bold uppercase">{labels.rate}</th>}
                            {options.showTotal && <th className="text-right py-2 font-bold uppercase">{labels.amount}</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {data.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="py-2">{item.medicationName || item.serviceItemName}</td>
                                {options.showBatch && <td className="text-center py-2">{item.batchNumber || '-'}</td>}
                                <td className="text-center py-2">{item.quantity || item.quantityReturned}</td>
                                {options.showUnitPrice && <td className="text-right py-2">{(Number(item.unitPrice || item.unitCost || item.unitPriceAtReturn || item.unitCostAtReturn || 0)).toFixed(2)}</td>}
                                {options.showTotal && <td className="text-right py-2">{(Number(item.totalPrice || item.totalCost || item.totalAmount || 0)).toFixed(2)}</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-8">
                    <div className="w-64 text-right space-y-1">
                        <div className="flex justify-between font-bold">
                            <span>{labels.subTotal}:</span>
                            <span>{(data.subTotal || 0).toFixed(2)}</span>
                        </div>
                        {(data.discountAmount || 0) > 0 && (
                            <div className="flex justify-between">
                                <span>{labels.discount}:</span>
                                <span>- {(data.discountAmount || 0).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold border-t border-black pt-1">
                            <span>{labels.netTotal}:</span>
                            <span>{(data.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>{labels.paid}:</span>
                            <span>{(data.amountPaid || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold">
                            <span>{labels.due}:</span>
                            <span>{(data.amountDue || 0).toFixed(2)}</span>
                        </div>
                        
                        {data.isSale && (data.totalOutstanding || 0) > 0 && (
                            <>
                                {(data.previousDue || 0) > 0 && (
                                    <>
                                        <div className="flex justify-between text-gray-500">
                                            <span>{labels.prevDue}:</span>
                                            <span>{(data.previousDue || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="border-b border-gray-400 border-dashed my-1"></div>
                                    </>
                                )}
                                <div className="flex justify-between font-bold border-t border-dashed border-gray-400 pt-1 mt-1">
                                    <span>{labels.totalOutstanding}:</span>
                                    <span>{(data.totalOutstanding || 0).toFixed(2)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {data.notes && (
                    <div className="mb-8 border p-2">
                        <p className="text-xs font-bold uppercase mb-1">{labels.notes}:</p>
                        <p className="text-xs">{data.notes}</p>
                    </div>
                )}

                <div className="text-center text-xs mt-8 pt-4 border-t border-gray-200">
                    <p>{settings.footerMessage}</p>
                </div>
            </div>
        </div>
    );
};

// --- THERMAL TEMPLATE ---
export const ThermalTemplate: React.FC<TemplateProps> = ({ data, settings, options, labels }) => {
  return (
    <div style={getPaperSizeStyle(options)} className="bg-white mx-auto font-mono text-[10px] leading-tight">
      <div className="p-2">
        <div className="text-center mb-2">
          <h1 className="text-sm font-bold uppercase">{settings.appName}</h1>
          {settings.proprietor && <p className="text-[8px]">{labels.proprietor}: {settings.proprietor}</p>}
          <p>{settings.companyAddress}</p>
          <p>{settings.companyContact}</p>
          {settings.email && <p className="text-[8px]">{labels.email}: {settings.email}</p>}
          {settings.website && <p className="text-[8px]">{labels.website}: {settings.website}</p>}
        </div>
        
        <div className="border-b border-black border-dashed mb-2 pb-1">
          <div className="flex justify-between">
            <span>{labels.date}: {data.date}</span>
            <span>#{data.invoiceNumber}</span>
          </div>
          {data.time && <div className="flex justify-between"><span>{labels.time}: {data.time}</span></div>}
          <div>To: {data.partyName}</div>
        </div>

        <table className="w-full mb-2">
          <thead>
            <tr className="border-b border-black border-dashed text-left">
              <th className="py-1">{labels.item}</th>
              <th className="py-1 text-center">{labels.qty}</th>
              {options.showUnitPrice && <th className="py-1 text-right">{labels.rate}</th>}
              <th className="py-1 text-right">{labels.amount}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 pr-1 truncate max-w-[80px]">{item.medicationName || item.serviceItemName}</td>
                <td className="py-1 text-center">{item.quantity || item.quantityReturned}</td>
                {options.showUnitPrice && <td className="py-1 text-right">{(Number(item.unitPrice || item.unitCost || item.unitPriceAtReturn || item.unitCostAtReturn || 0)).toFixed(2)}</td>}
                <td className="py-1 text-right">{(Number(item.totalPrice || item.totalCost || item.totalAmount || 0)).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-black border-dashed pt-1 space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>{labels.netTotal}:</span>
            <span>{data.totalAmount.toFixed(2)}</span>
          </div>
          {(data.discountAmount || 0) > 0 && (
             <div className="flex justify-between">
               <span>{labels.discount}:</span>
               <span>-{data.discountAmount.toFixed(2)}</span>
             </div>
          )}
          <div className="flex justify-between">
            <span>{labels.paid}:</span>
            <span>{data.amountPaid.toFixed(2)}</span>
          </div>
          {(data.amountDue || 0) > 0 && (
             <div className="flex justify-between font-bold">
               <span>{labels.due}:</span>
               <span>{data.amountDue.toFixed(2)}</span>
             </div>
          )}
          
          {data.isSale && (data.totalOutstanding || 0) > 0 && (
             <div className="border-t border-dotted border-gray-400 pt-1 mt-1">
               {(data.previousDue || 0) > 0 && (
                   <>
                       <div className="flex justify-between mb-1">
                           <span>{labels.prevDue}:</span>
                           <span>{(data.previousDue || 0).toFixed(2)}</span>
                       </div>
                       <div className="border-b border-black border-dashed my-1"></div>
                   </>
               )}
               <div className="flex justify-between font-bold">
                   <span>{labels.totalOutstanding}:</span>
                   <span>{(data.totalOutstanding || 0).toFixed(2)}</span>
               </div>
             </div>
          )}
        </div>

        <div className="text-center mt-3 pt-2 border-t border-black border-dashed">
          <p>{settings.footerMessage}</p>
          <p className="mt-1 text-[8px]">{labels.thankYou}</p>
        </div>
      </div>
    </div>
  );
};
