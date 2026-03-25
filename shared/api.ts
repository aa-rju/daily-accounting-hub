/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: { id: string; email: string; name: string };
}

// Party Types (Customers & Suppliers)
export interface Party {
  id: string;
  name: string;
  phone: string;
  address: string;
  type: "customer" | "supplier" | "both";
  openingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartyRequest {
  name: string;
  phone: string;
  address: string;
  type: "customer" | "supplier" | "both";
  openingBalance: number;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  trackStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  unit: string;
  price: number;
  trackStock: boolean;
}

// Account Types
export interface Account {
  id: string;
  name: string;
  type: "cash" | "bank" | "wallet";
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: "cash" | "bank" | "wallet";
  openingBalance: number;
  currency: string;
}

// Sales/Invoice Types
export interface Invoice {
  id: string;
  billNumber: string;
  partyId: string;
  partyName: string;
  date: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: "draft" | "sent" | "paid";
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface CreateInvoiceRequest {
  billNumber: string;
  partyId: string;
  date: string;
  items: InvoiceItem[];
  paymentMethod: string;
  taxPercentage?: number;
}

// Purchase Types
export interface Purchase {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  status: "draft" | "received" | "paid";
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface CreatePurchaseRequest {
  purchaseNumber: string;
  supplierId: string;
  date: string;
  items: PurchaseItem[];
  paymentMethod: string;
  taxPercentage?: number;
}

// Daily Report Types
export interface DailyReport {
  id: string;
  date: string;
  openingCashBalance: number;
  bankDeposits: number;
  expenses: DailyExpense[];
  advancesPaid: number;
  cashReceived: number;
  onlineBankTransfer: number;
  creditSales: number;
  totalExpenses: number;
  totalIncome: number;
  closingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface DailyExpense {
  description: string;
  amount: number;
  category: string;
}

export interface CreateDailyReportRequest {
  date: string;
  openingCashBalance: number;
  bankDeposits: number;
  expenses: DailyExpense[];
  advancesPaid: number;
  cashReceived: number;
  onlineBankTransfer: number;
  creditSales: number;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  openingStock: number;
  production: number;
  sales: number;
  closingStock: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryRequest {
  productId: string;
  openingStock: number;
  production: number;
  sales: number;
}

// Ledger Types
export interface LedgerEntry {
  id: string;
  partyId: string;
  partyName: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: "invoice" | "purchase" | "payment" | "manual";
  createdAt: string;
}

export interface PartyLedger {
  partyId: string;
  partyName: string;
  entries: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
