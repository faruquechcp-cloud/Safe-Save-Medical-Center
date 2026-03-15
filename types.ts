
export interface BatchDetail {
  id: string; 
  batchNumber: string;
  expiryDate: string; 
  quantityInStock: number;
  costPrice: number; 
  dateAdded: string; 
  purchaseInvoiceItemId?: string; 
}

export interface MedicationItem {
  id:string;
  name: string; 
  genericName: string;
  strength: string; 
  form: string; 
  manufacturer: string;
  unitOfMeasure: string; 
  sellingPrice: number; 
  location: string; 
  lowStockThreshold: number; 
  dateAdded: string; 
  notes?: string;
  isActive?: boolean; 
  batches: BatchDetail[]; 
}

export type SortableMedicationKeys = 
  | 'name' 
  | 'genericName' 
  | 'strength' 
  | 'form' 
  | 'manufacturer' 
  | 'location'
  | 'totalQuantityInStock'
  | 'soonestExpiryDate'
  | 'isActive';


export interface SortConfig { 
  key: SortableMedicationKeys;
  direction: 'ascending' | 'descending';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string; 
  email?: string; 
  address?: string; 
  openingBalance: number; 
  totalDueAmount: number; 
  dateAdded: string; 
}

export interface Supplier {
  id: string;
  name: string;
  contact?: string; 
  email?: string; 
  totalAmountOwed: number; 
  dateAdded: string; 
}

export interface SaleItem {
  medicationId: string;
  medicationName: string; 
  batchNumber: string; // Will store concatenated batch numbers if multiple used
  quantity: number;
  unitPrice: number; 
  discount?: number; 
  costPriceAtSale: number; 
  totalPrice: number;
  batchDeductions?: { batchNumber: string; quantity: number }[]; // For detailed audit
}

export interface SaleItemFormData extends Omit<SaleItem, 'costPriceAtSale' | 'quantity' | 'unitPrice' | 'totalPrice' | 'discount'> {
  quantity: number | '';
  unitPrice: number | '';
  discount: number | '';
  totalPrice: number | '';
}


export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  date: string; 
  items: SaleItem[];
  subTotalAmount: number; 
  discountPercentage?: number;
  discountAmount?: number;
  totalAmount: number; 
  customerId?: string; 
  customerName?: string; 
  amountPaid: number;
  amountDue: number; 
  notes?: string;
}

export interface PurchaseItem {
  medicationId: string;
  medicationName: string; 
  quantity: number;
  unitCost: number; 
  totalCost: number;
  batchNumber: string; 
  expiryDate: string; 
}

export interface PurchaseItemFormData extends Omit<PurchaseItem, 'quantity' | 'unitCost' | 'totalCost'> {
  quantity: number | '';
  unitCost: number | '';
  totalCost: number | '';
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string; 
  items: PurchaseItem[];
  subTotalAmount: number; 
  discountPercentage?: number;
  discountAmount?: number;
  totalAmount: number; 
  supplierId?: string; 
  supplierName?: string; 
  amountPaid: number;
  amountDue: number; 
  notes?: string;
}

export interface ServiceItemDefinition {
  id: string;
  name: string;
  category: string;
  price: number;
  notes?: string;
  dateAdded: string;
}

export type SortableServiceItemDefinitionKeys = keyof Pick<ServiceItemDefinition, 'name' | 'category' | 'price' | 'dateAdded'>;

export interface ServiceInvoiceItem {
  serviceItemDefinitionId: string; 
  serviceItemName: string; 
  quantity: number;
  unitPrice: number; 
  totalPrice: number;
}

export interface ServiceInvoiceItemFormData extends Omit<ServiceInvoiceItem, 'quantity' | 'unitPrice' | 'totalPrice'> {
  quantity: number | '';
  unitPrice: number | '';
  totalPrice: number | '';
}

export interface ServiceInvoice {
  id: string;
  invoiceNumber: string; 
  date: string;
  items: ServiceInvoiceItem[];
  subTotalAmount: number;
  discountPercentage?: number;
  discountAmount?: number;
  totalAmount: number;
  customerId?: string;
  customerName?: string;
  amountPaid: number;
  amountDue: number; 
  notes?: string;
}

export type SortableServiceInvoiceKeys = keyof Pick<ServiceInvoice, 'invoiceNumber' | 'date' | 'totalAmount' | 'customerName' | 'amountDue'>;


export type CashTransactionType = 'income' | 'expense';
export type CashTransactionCategory = string;

export interface CustomTransactionCategorySetting {
  id: string;
  name: string;
  type: 'income' | 'expense'; 
}

export interface CashTransaction {
  id: string;
  timestamp: number; 
  date: string; 
  type: CashTransactionType;
  category: CashTransactionCategory; 
  description: string;
  amount: number;
  relatedInvoiceId?: string; 
  relatedInvoiceType?: 'sale' | 'purchase' | 'service' | 'saleReturn' | 'purchaseReturn'; 
  relatedCustomerId?: string;
  relatedSupplierId?: string;
}

export type SortableCashTransactionKeys = 
  | 'date'
  | 'category'
  | 'description'
  | 'amount';

export type ViewMode = 
  | 'products' 
  | 'sales' 
  | 'purchases' 
  | 'customers' 
  | 'suppliers' 
  | 'dashboard' 
  | 'reports' 
  | 'profitReport'
  | 'todayDueReport'
  | 'customerDueReport' 
  | 'supplierDueReport'
  | 'stockOnHandReport'
  | 'consolidatedLedgerReport'
  | 'customerSaleReport' 
  | 'accounting'
  | 'serviceDefinitions'
  | 'serviceInvoices'
  | 'saleReturns'      
  | 'purchaseReturns'
  | 'customerTransactionTimelineReport'
  | 'expiryReport'
  | 'expiredProducts'
  | 'lowStock'
  | 'purchaseOrders';

export type AccountingSubViewMode = 
  | 'cashLedger'
  | 'receiveCustomerPayment'
  | 'paySupplierDue'
  | 'manualTransaction';

export type SortableSaleInvoiceKeys = keyof Pick<SaleInvoice, 'invoiceNumber' | 'date' | 'totalAmount' | 'customerName' | 'amountDue'>;
export type SortablePurchaseInvoiceKeys = keyof Pick<PurchaseInvoice, 'invoiceNumber' | 'date' | 'totalAmount' | 'supplierName' | 'amountDue'>;
export type SortableCustomerKeys = keyof Pick<Customer, 'name' | 'totalDueAmount' | 'dateAdded'>;
export type SortableSupplierKeys = keyof Pick<Supplier, 'name' | 'totalAmountOwed' | 'dateAdded'>;


export interface GenericSortConfig<T extends string | number | symbol> {
  key: T;
  direction: 'ascending' | 'descending';
}

export interface BatchProfitReportItem {
  medicationId: string;
  medicationName: string;
  batchNumber: string;
  totalQuantitySold: number;
  totalRevenue: number;
  totalCOGS: number; 
  profit: number;
  profitPercentage: number;
}
export type SortableBatchProfitReportKeys = keyof Pick<BatchProfitReportItem, 'medicationName' | 'batchNumber' | 'totalQuantitySold' | 'totalRevenue' | 'totalCOGS' | 'profit' | 'profitPercentage'>;

export type SortableCustomerDueReportKeys = SortableSaleInvoiceKeys;
export type SortableSupplierDueReportKeys = SortablePurchaseInvoiceKeys;
export type SortableCustomerSaleReportKeys = SortableSaleInvoiceKeys; 

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  username: string;
  password?: string; 
  role: UserRole;
  permissions: ViewMode[];
}

export interface StockOnHandReportItem {
  medicationId: string;
  medicationName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  quantityInStock: number;
  costPrice: number; 
  totalPurchaseValue: number;
}

export type SortableStockOnHandReportKeys = 
  | 'medicationName' 
  | 'genericName' 
  | 'batchNumber' 
  | 'quantityInStock' 
  | 'costPrice' 
  | 'totalPurchaseValue';

export interface ExpiryReportItem {
  medicationId: string;
  medicationName: string;
  genericName: string;
  batchId: string;
  batchNumber: string;
  expiryDate: string;
  quantityInStock: number;
  costPrice: number;
  location: string;
}

export type SortableExpiryReportKeys = keyof ExpiryReportItem;

export interface ConsolidatedLedgerEntry {
  id: string; 
  date: string; 
  timestamp: number; 
  partyName: string; 
  partyType: 'Customer' | 'Supplier' | 'System';
  transactionTypeDisplay: string; 
  reference: string; 
  description: string; 
  debit: number; 
  credit: number; 
}

export type SortableConsolidatedLedgerKeys = 
  | 'date' 
  | 'partyName' 
  | 'transactionTypeDisplay' 
  | 'reference' 
  | 'description' 
  | 'debit' 
  | 'credit';

export type LanguageCode = 'en' | 'bn';

export interface BackupSettings {
  googleDriveEnabled: boolean;
  lastBackupDate?: string;
  backupIntervalHours: number;
  autoBackupEnabled: boolean;
  googleTokens?: any;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  messengerEnabled: boolean;
  smsGatewayUrl: string;
  smsApiKey: string;
  smsSenderId: string;
  emailServiceId: string;
  emailTemplateId: string;
  emailPublicKey: string;
  alertOnSale: boolean;
  alertOnDuePayment: boolean;
  useSmartAI: boolean; 
}

export interface SaleInvoiceFormState {
  invoiceNumber: string;
  date: string;
  selectedCustomerId: string;
  notes: string;
  items: SaleItemFormData[];
  discountPercentage: string; 
  discountAmount: string; 
  amountPaid: string; 
}

export interface PurchaseInvoiceFormState {
  invoiceNumber: string;
  date: string;
  selectedSupplierId: string;
  notes: string;
  items: PurchaseItemFormData[]; 
  discountPercentage: string;
  discountAmount: string;
  amountPaid: string;
}

export interface ServiceInvoiceFormState {
  invoiceNumber: string;
  date: string;
  selectedCustomerId: string;
  notes: string;
  items: ServiceInvoiceItemFormData[];
  discountPercentage: string;
  discountAmount: string;
  amountPaid: string;
}

export interface SaleReturnItem {
  medicationId: string;
  medicationName: string;
  batchNumber: string;
  quantityReturned: number;
  unitPriceAtReturn: number;
  totalAmount: number; 
  reason?: string;
}

export interface SaleReturnItemFormData extends Omit<SaleReturnItem, 'quantityReturned' | 'unitPriceAtReturn' | 'totalAmount'> {
  quantityReturned: number | '';
  unitPriceAtReturn: number | '';
  totalAmount: number | '';
}

export interface SaleReturnInvoice {
  id: string;
  returnInvoiceNumber: string; 
  originalSaleInvoiceNumber?: string; 
  date: string;
  items: SaleReturnItem[];
  subTotalAmount: number; 
  restockingFee?: number;
  totalRefundAmount: number; 
  customerId?: string;
  customerName?: string;
  refundIssued: number; 
  notes?: string;
}

export interface SaleReturnInvoiceFormState {
  returnInvoiceNumber: string;
  originalSaleInvoiceNumber: string;
  date: string;
  selectedCustomerId: string;
  notes: string;
  items: SaleReturnItemFormData[];
  restockingFee: string; 
  refundIssued: string; 
}

export type SortableSaleReturnInvoiceKeys = keyof Pick<SaleReturnInvoice, 'returnInvoiceNumber' | 'date' | 'totalRefundAmount' | 'customerName'>;

export interface PurchaseReturnItem {
  medicationId: string;
  medicationName: string;
  batchNumber: string;
  quantityReturned: number;
  unitCostAtReturn: number;
  totalAmount: number; 
  reason?: string;
}

export interface PurchaseReturnItemFormData extends Omit<PurchaseReturnItem, 'quantityReturned' | 'unitCostAtReturn' | 'totalAmount'> {
  quantityReturned: number | '';
  unitCostAtReturn: number | '';
  totalAmount: number | '';
}

export interface PurchaseReturnInvoice {
  id: string;
  returnInvoiceNumber: string; 
  originalPurchaseInvoiceNumber?: string; 
  date: string;
  items: PurchaseReturnItem[];
  subTotalAmount: number; 
  shippingFee?: number; 
  totalCreditAmount: number; 
  supplierId?: string;
  supplierName?: string;
  refundReceived: number; 
  notes?: string;
}

export interface PurchaseReturnInvoiceFormState {
  returnInvoiceNumber: string;
  originalPurchaseInvoiceNumber: string;
  date: string;
  selectedSupplierId: string;
  notes: string;
  items: PurchaseReturnItemFormData[];
  shippingFee: string; 
  refundReceived: string; 
}

export type SortablePurchaseReturnInvoiceKeys = keyof Pick<PurchaseReturnInvoice, 'returnInvoiceNumber' | 'date' | 'totalCreditAmount' | 'supplierName'>;


export interface HeldInvoice {
  id: string; 
  type: 'sale' | 'purchase' | 'service' | 'saleReturn' | 'purchaseReturn';
  heldAt: string; 
  descriptiveName: string; 
  formData: SaleInvoiceFormState | PurchaseInvoiceFormState | ServiceInvoiceFormState | SaleReturnInvoiceFormState | PurchaseReturnInvoiceFormState;
  originalInvoiceNumber?: string; 
}

export interface CustomerTransactionTimelineEntry {
  id: string;
  date: string;
  timestamp: number;
  typeDisplay: string;
  description: string;
  reference: string;
  billedAmount: number;
  paidOrCreditedAmount: number;
  balance: number;
}

export type SortableCustomerTransactionTimelineKeys = keyof Pick<CustomerTransactionTimelineEntry, 'date' | 'typeDisplay' | 'description' | 'reference' | 'billedAmount' | 'paidOrCreditedAmount' | 'balance'>;

export interface ExpiredProductStockOut {
  id: string;
  date: string;
  medicationId: string;
  medicationName: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  totalLoss: number;
  notes?: string;
}

export type SortableExpiredProductStockOutKeys = keyof ExpiredProductStockOut;

export type LicenseDuration = '1Y' | '2Y' | '3Y' | '5Y' | '10Y' | 'LIFETIME' | 'TRIAL';

export interface LicenseInfo {
  key: string;
  type: LicenseDuration;
  expiryDate: string | null; 
  activationDate: string;
  isValid: boolean;
}

export interface PurchaseOrderItem {
  medicationId: string;
  name: string;
  genericName: string;
  strength: string;
  currentStock: number;
  orderQty: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  supplierId?: string;
  supplierName?: string;
  items: PurchaseOrderItem[];
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  notes?: string;
}

export type SortablePurchaseOrderKeys = keyof Pick<PurchaseOrder, 'orderNumber' | 'date' | 'supplierName' | 'status'>;
