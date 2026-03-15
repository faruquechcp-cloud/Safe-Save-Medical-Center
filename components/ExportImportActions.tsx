
import React, { useState } from 'react';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import ChevronDownIcon from './icons/ChevronDownIcon';
import DocumentChartBarIcon from './icons/DocumentChartBarIcon';
import { MedicationItem, BatchDetail, Customer, Supplier } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import * as XLSX from 'xlsx';

interface ExportImportActionsProps {
  data: any[];
  filename: string;
  onImport?: (data: any[]) => Promise<void> | void;
  entityType?: 'product' | 'customer' | 'supplier';
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
  onBackup?: () => void;
  onRestore?: (content: string) => void;
}

const ExportImportActions: React.FC<ExportImportActionsProps> = ({ 
  data, filename, onImport, entityType = 'product', onSuccess, onError, onBackup, onRestore
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useTranslations();

  const handleExportCSV = () => {
    exportToCSV(data, filename);
    setShowDropdown(false);
  };

  const handleExportJSON = () => {
    exportToJSON(data, filename);
    setShowDropdown(false);
  };

  const handlePrint = () => {
    window.print();
    setShowDropdown(false);
  };

  const handleDownloadTemplate = () => {
    let templateData: any[] = [];

    if (entityType === 'customer') {
        templateData = [{
            'Name': 'John Doe',
            'Phone': '01700000000',
            'Email': 'john@example.com',
            'Address': 'Dhaka, Bangladesh',
            'Opening Balance': 0
        }];
    } else if (entityType === 'supplier') {
        templateData = [{
            'Name': 'ABC Pharma',
            'Contact': '01800000000',
            'Email': 'contact@abcpharma.com',
            'Total Owed': 0
        }];
    } else {
        // Product Template
        templateData = [{
            'Name': 'Napa Extra',
            'Generic Name': 'Paracetamol + Caffeine',
            'Strength': '500mg+65mg',
            'Form': 'Tablet',
            'Manufacturer': 'Beximco',
            'Price': 2.50,
            'Cost': 2.00,
            'Batch': 'BATCH001',
            'Expiry': '2026-12-31',
            'Quantity': 500,
            'Location': 'Rack A1',
            'Threshold': 50,
            'Notes': 'Pain killer'
        }];
    }
    
    exportToCSV(templateData, `${filename}_Template`);
    setShowDropdown(false);
  };

  const processSpreadsheetData = (rows: any[]): any[] => {
    const getValue = (row: any, keys: string[]) => {
        const normalize = (str: string) => String(str).toLowerCase().trim().replace(/[\s\-_.]/g, '');
        const foundKey = Object.keys(row).find(k => {
            const normalizedK = normalize(k);
            return keys.some(searchKey => normalizedK === normalize(searchKey));
        });
        return foundKey ? row[foundKey] : undefined;
    };

    if (entityType === 'customer') {
        return rows.map(row => {
            const name = getValue(row, ['name', 'Customer Name', 'Customer', 'নাম', 'গ্রাহকের নাম', 'ক্রেতা']);
            if (!name) return null;
            
            const openingBal = parseFloat(String(getValue(row, ['openingBalance', 'Opening Balance', 'Balance', 'Due', 'বকেয়া', 'সাবেক বকেয়া', 'ব্যালেন্স']) || '0'));
            
            return {
                id: getValue(row, ['id', 'ID']) || crypto.randomUUID(),
                name: String(name).trim(),
                phone: String(getValue(row, ['phone', 'Mobile', 'Contact', 'Cell', 'ফোন', 'মোবাইল', 'নম্বর']) || ''),
                email: String(getValue(row, ['email', 'E-mail', 'ইমেইল']) || ''),
                address: String(getValue(row, ['address', 'Location', 'ঠিকানা', 'বাসা']) || ''),
                openingBalance: openingBal,
                totalDueAmount: openingBal,
                dateAdded: new Date().toISOString()
            } as Customer;
        }).filter(Boolean);
    }

    if (entityType === 'supplier') {
        return rows.map(row => {
            const name = getValue(row, ['name', 'Supplier Name', 'Company', 'Brand', 'সাপ্লায়ার', 'কোম্পানি', 'প্রতিষ্ঠান']);
            if (!name) return null;

            return {
                id: getValue(row, ['id', 'ID']) || crypto.randomUUID(),
                name: String(name).trim(),
                contact: String(getValue(row, ['contact', 'Phone', 'Mobile', 'Contact Person', 'যোগাযোগ', 'মোবাইল']) || ''),
                email: String(getValue(row, ['email', 'E-mail', 'ইমেইল']) || ''),
                totalAmountOwed: parseFloat(String(getValue(row, ['totalAmountOwed', 'Total Owed', 'Owed', 'Balance', 'Due', 'পাওনা', 'বকেয়া']) || '0')),
                dateAdded: new Date().toISOString()
            } as Supplier;
        }).filter(Boolean);
    }

    // Default: Product Import Logic
    const productMap = new Map<string, MedicationItem>();

    rows.forEach((row) => {
      const name = getValue(row, ['name', 'Name', 'Product Name', 'Brand Name', 'Brand', 'নাম', 'পণ্যের নাম']);
      if (!name) return;

      const strength = getValue(row, ['strength', 'Strength', 'Dose', 'Power', 'শক্তি', 'পাওয়ার', 'ডোজ']) || 'N/A';
      const form = getValue(row, ['form', 'Form', 'Type', 'Dosage Form', 'ধরণ']) || 'Tablet';
      
      const key = `${String(name).trim()}-${String(strength).trim()}-${String(form).trim()}`.toLowerCase();

      let product = productMap.get(key);

      if (!product) {
        product = {
          id: getValue(row, ['id', 'ID', 'ProductId']) || crypto.randomUUID(),
          name: String(name).trim(),
          genericName: String(getValue(row, ['genericName', 'Generic Name', 'Generic', 'GenericName', 'জেনেরিক', 'ফর্মুলা']) || ''),
          strength: String(strength),
          form: String(form),
          manufacturer: String(getValue(row, ['manufacturer', 'Manufacturer', 'Company', 'Brand', 'কোম্পানি', 'প্রস্তুতকারক']) || ''),
          unitOfMeasure: String(getValue(row, ['unitOfMeasure', 'Unit', 'UOM', 'UnitOfMeasure', 'ইউনিট']) || 'Pcs'),
          sellingPrice: parseFloat(String(getValue(row, ['sellingPrice', 'Selling Price', 'Price', 'MRP', 'Sales Price', 'মূল্য', 'বিক্রয় মূল্য', 'দাম']) || '0')),
          location: String(getValue(row, ['location', 'Location', 'Shelf', 'Rack', 'সেলফ', 'র‍্যাক', 'অবস্থান']) || ''),
          lowStockThreshold: parseInt(String(getValue(row, ['lowStockThreshold', 'Threshold', 'LowStock', 'MinStock', 'Alert Qty', 'সতর্কতা সীমা']) || '10')),
          dateAdded: new Date().toISOString(),
          notes: String(getValue(row, ['notes', 'Notes', 'Description', 'Comments', 'নোট', 'বিবরণ']) || ''),
          batches: []
        };
        productMap.set(key, product);
      }

      const batchNumber = getValue(row, ['Batch', 'Batch Number', 'BatchNo', 'Lot', 'ব্যাচ নং', 'লট']);
      const qty = parseInt(String(getValue(row, ['Quantity', 'Stock', 'Qty', 'Amount', 'পরিমাণ', 'মজুদ']) || '0'));
      
      if (batchNumber || qty > 0) {
        let expiryDate = getValue(row, ['expiryDate', 'Expiry', 'Expiry Date', 'ExpDate', 'Exp', 'মেয়াদ', 'এক্সপায়ারি']) || '';
        
        if (typeof expiryDate === 'number') {
             const date = new Date((expiryDate - (25567 + 2)) * 86400 * 1000); 
             try {
                expiryDate = date.toISOString().split('T')[0];
             } catch (e) {
                expiryDate = ''; 
             }
        } else if (expiryDate instanceof Date) {
             expiryDate = expiryDate.toISOString().split('T')[0];
        }

        const batch: BatchDetail = {
          id: crypto.randomUUID(),
          batchNumber: String(batchNumber || 'INIT-STOCK'),
          expiryDate: String(expiryDate),
          quantityInStock: qty,
          costPrice: parseFloat(String(getValue(row, ['costPrice', 'Cost', 'Purchase Price', 'CostPrice', 'Buying Price', 'Rate', 'কেনা দাম', 'ক্রয় মূল্য']) || '0')),
          dateAdded: new Date().toISOString()
        };
        
        product.batches.push(batch);
      }
    });

    return Array.from(productMap.values());
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'json') {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            await onImport(parsed);
            const msg = t('exportImport.success', 'JSON Data imported successfully!', { extension: 'JSON', count: parsed.length });
            if (onSuccess) onSuccess(msg);
            else alert(msg);
          } else {
            const msg = t('exportImport.jsonError', "Invalid JSON format. Expected an array.");
            if (onError) onError(msg);
            else alert(msg);
          }
        } catch (err: any) {
          const msg = t('exportImport.error', "Import failed.") + " " + err.message;
          if (onError) onError(msg);
          else alert(msg);
        }
      };
      reader.readAsText(file);
    } else if (['xlsx', 'xls', 'csv'].includes(fileExtension || '')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          // @ts-ignore
          const workbook = XLSX.read(data, { type: 'array', cellDates: true }); 
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          // @ts-ignore
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (Array.isArray(jsonData) && jsonData.length > 0) {
            const processedData = processSpreadsheetData(jsonData);
            await onImport(processedData);
            const msg = t('exportImport.success', 'Data imported successfully!', { extension: fileExtension?.toUpperCase(), count: processedData.length });
            if (onSuccess) onSuccess(msg);
            else alert(msg);
          } else {
            const msg = t('exportImport.empty', "The file seems to be empty or has no valid rows.");
            if (onError) onError(msg);
            else alert(msg);
          }
        } catch (err: any) {
          console.error(err);
          const msg = t('exportImport.error', "Import failed.") + " " + err.message;
          if (onError) onError(msg);
          else alert(msg);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file format. Please use JSON, Excel (xlsx/xls), or CSV.");
    }
    
    e.target.value = '';
  };

  return (
    <div className="relative inline-flex items-center space-x-2">
      <div className="relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-200 transition-all"
        >
          <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
          {t('common.export')}
          <ChevronDownIcon className="ml-2 w-3 h-3" />
        </button>
        
        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {onImport && (
                <button onClick={handleDownloadTemplate} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 hover:bg-primary-100 border-b border-gray-50 flex items-center">
                    <DocumentChartBarIcon className="w-4 h-4 mr-2"/> {t('exportImport.template', 'Download Template')}
                </button>
            )}
            <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 border-b border-gray-50">{t('exportImport.csv')}</button>
            <button onClick={handleExportJSON} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 border-b border-gray-50">{t('exportImport.json')}</button>
            <button onClick={handlePrint} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-teal-600 hover:bg-teal-50">{t('exportImport.print')}</button>
            {onBackup && <button onClick={() => { onBackup(); setShowDropdown(false); }} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 border-t border-gray-50">{t('exportImport.backup', 'Backup System')}</button>}
            {onRestore && <label className="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-green-600 hover:bg-green-50 border-t border-gray-50 cursor-pointer">{t('exportImport.restore', 'Restore System')}<input type="file" accept=".json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (event) => { onRestore(event.target?.result as string); }; reader.readAsText(file); } setShowDropdown(false); }} /></label>}
          </div>
        )}
      </div>

      {onImport && (
        <label className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-gray-50 cursor-pointer transition-all">
          <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
          {t('common.import')}
          <input type="file" accept=".json,.xlsx,.xls,.csv" className="hidden" onChange={handleFileImport} />
        </label>
      )}
    </div>
  );
};

export default ExportImportActions;
