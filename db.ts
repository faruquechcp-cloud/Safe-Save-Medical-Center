
import { Dexie, type Table } from 'dexie';
import {
  MedicationItem, SaleInvoice, PurchaseInvoice, Customer, Supplier, CashTransaction,
  CustomTransactionCategorySetting, User, LanguageCode, HeldInvoice,
  ServiceItemDefinition, ServiceInvoice, SaleReturnInvoice, PurchaseReturnInvoice,
  NotificationSettings, LicenseInfo, BackupSettings, ExpiredProductStockOut, PurchaseOrder
} from './types';
import { defaultSettings as appDefaultSettings, PrintTemplateType, PrintOptions } from './themes';

export interface AppSettingsDexie {
  id: number; 
  themeKey: string;
  appNameBn: string;
  appNameEn: string;
  proprietorBn: string;
  proprietorEn: string;
  logoUrl: string;
  appIconUrl: string;
  fontFamily: string;
  fontSize: string;
  accentPhotoUrl: string;
  language: LanguageCode;
  isCustomSolidActive: boolean;
  customSolidColor: string;
  isGradientThemeActive: boolean;
  activeGradientThemeKey: string | null;
  currentUserId?: string | null; 
  printTemplate: PrintTemplateType;
  companyAddressBn: string;
  companyAddressEn: string;
  companyContactBn: string;
  companyContactEn: string;
  companyEmail: string;
  companyWebsite: string;
  printFooterMessage: string;
  defaultPrintOptions: PrintOptions;
  notificationSettings: NotificationSettings;
  backupSettings?: BackupSettings;
  vatPercentage: number;
  initialCashBalance: number;
  license?: LicenseInfo;
  lastSystemDate?: string;
  systemId: string; 
}

export const defaultBackupSettings: BackupSettings = {
  googleDriveEnabled: false,
  backupIntervalHours: 24,
  autoBackupEnabled: false
};

export const defaultNotificationSettings: NotificationSettings = {
  emailEnabled: false,
  smsEnabled: false,
  whatsappEnabled: true,
  messengerEnabled: false,
  smsGatewayUrl: '',
  smsApiKey: '',
  smsSenderId: '',
  emailServiceId: '',
  emailTemplateId: '',
  emailPublicKey: '',
  alertOnSale: true,
  alertOnDuePayment: true,
  useSmartAI: false
};

const initialCategories: Omit<CustomTransactionCategorySetting, 'id'>[] = [
    { name: 'Shop Rent', type: 'expense' },
    { name: 'Electricity Bill', type: 'expense' },
    { name: 'Employee Salary', type: 'expense' },
    { name: 'Investment', type: 'income' },
    { name: 'Other Income', type: 'income' }
];

export class AppDB extends Dexie {
  declare public medications: Table<MedicationItem, string>;
  declare public saleInvoices: Table<SaleInvoice, string>;
  declare public purchaseInvoices: Table<PurchaseInvoice, string>;
  declare public customers: Table<Customer, string>;
  declare public suppliers: Table<Supplier, string>;
  declare public cashTransactions: Table<CashTransaction, string>;
  declare public customTransactionCategories: Table<CustomTransactionCategorySetting, string>;
  declare public users: Table<User, string>;
  declare public appSettings: Table<AppSettingsDexie, number>;
  declare public heldInvoices: Table<HeldInvoice, string>;
  declare public serviceItemDefinitions: Table<ServiceItemDefinition, string>; 
  declare public serviceInvoices: Table<ServiceInvoice, string>; 
  declare public saleReturnInvoices: Table<SaleReturnInvoice, string>; 
  declare public purchaseReturnInvoices: Table<PurchaseReturnInvoice, string>;
  declare public expiredProductStockOuts: Table<ExpiredProductStockOut, string>;
  declare public purchaseOrders: Table<PurchaseOrder, string>;

  public constructor() {
    super('PharmacyAppDB_V2'); // Changed from PharmacyAppDB to avoid conflict with older versions
    this.version(25).stores({ 
      medications: 'id, name, genericName, manufacturer, *batches.expiryDate, *batches.batchNumber',
      saleInvoices: 'id, invoiceNumber, date, customerId, customerName, totalAmount, amountDue',
      purchaseInvoices: 'id, invoiceNumber, date, supplierId, supplierName, totalAmount, amountDue',
      customers: 'id, name, totalDueAmount, dateAdded', 
      suppliers: 'id, &name, totalAmountOwed, dateAdded', 
      cashTransactions: 'id, date, type, category, timestamp, relatedInvoiceId, relatedCustomerId, relatedSupplierId',
      customTransactionCategories: 'id, &[name+type]', 
      users: 'id, &username, role', 
      appSettings: 'id', 
      heldInvoices: 'id, type, heldAt, descriptiveName',
      serviceItemDefinitions: 'id, &name, category, price', 
      serviceInvoices: 'id, invoiceNumber, date, customerId, customerName, totalAmount, amountDue', 
      saleReturnInvoices: 'id, returnInvoiceNumber, date, customerId, customerName, totalRefundAmount', 
      purchaseReturnInvoices: 'id, returnInvoiceNumber, date, supplierId, supplierName, totalCreditAmount', 
      expiredProductStockOuts: 'id, date, medicationId, medicationName, batchNumber',
      purchaseOrders: 'id, orderNumber, date, supplierId, supplierName, status',
    });
  }

  async seed() {
    try {
        const userCount = await this.users.count();
        if (userCount === 0) {
          await this.users.add({ 
            id: 'admin-user', 
            username: 'admin', 
            password: '123', 
            role: 'admin', 
            permissions: ['dashboard', 'products', 'sales', 'purchases', 'customers', 'suppliers', 'accounting', 'reports'] 
          });
          console.log("Seeded default admin user.");
        }

        const settings = await this.appSettings.get(0);
        if (!settings) {
          await this.appSettings.put({
            id: 0, 
            ...appDefaultSettings, 
            systemId: 'SYS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            language: 'bn',
            vatPercentage: 0,
            initialCashBalance: 0,
            notificationSettings: { ...defaultNotificationSettings },
            backupSettings: { ...defaultBackupSettings },
            license: { key: 'TRIAL', type: 'TRIAL', expiryDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(), activationDate: new Date().toISOString(), isValid: true }
          });
          console.log("Seeded default settings.");
        }

        const catCount = await this.customTransactionCategories.count();
        if (catCount === 0) {
            for(const cat of initialCategories) {
                await this.customTransactionCategories.add({ id: crypto.randomUUID(), ...cat });
            }
            console.log("Seeded default categories.");
        }
    } catch (err) {
        console.error("Seeding failed:", err);
    }
  }
}

export const db = new AppDB();

export async function updateAppSettings(updates: Partial<Omit<AppSettingsDexie, 'id'>>) {
  return db.appSettings.update(0, updates);
}

db.on('blocked', () => {
    console.warn("Database is blocked by another tab. Please close other tabs.");
    alert("সফটওয়্যারটির অন্য একটি ট্যাব খোলা আছে। দয়া করে অন্য ট্যাবটি বন্ধ করে এটি রিফ্রেশ করুন।");
});

db.on('ready', () => {
    return db.seed();
});

db.open().catch(async (err: any) => {
  console.error("Could not open DB:", err);
  // If it's a version or schema error, or if it's just stuck, we try to clear it
  if (err.name === 'VersionError' || err.name === 'SchemaError' || err.name === 'OpenFailedError') {
    console.warn("Attempting to fix DB error by deleting and reloading...");
    try {
        await Dexie.delete('PharmacyAppDB'); // Clear old DB if it exists
        await db.delete();
        window.location.reload();
    } catch (e) {
        console.error("Failed to delete DB:", e);
    }
  }
});
