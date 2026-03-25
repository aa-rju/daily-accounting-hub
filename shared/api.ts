/**
 * MHIS Accounting — Shared Types & API Client
 * CA-reviewed + Production-ready
 * Matches schema.prisma exactly
 */

const API_BASE = "/api";

// ─────────────────────────────────────────────
//  GENERIC API HELPERS
// ─────────────────────────────────────────────
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

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─────────────────────────────────────────────
//  AUTH TYPES
// ─────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: { id: string; email: string; name: string; role: string; orgId: string };
  token?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  orgName: string;
}

// ─────────────────────────────────────────────
//  ORGANISATION TYPES
// ─────────────────────────────────────────────
export interface Organisation {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  logo?: string;
  currency: string;
  fiscalYear: string;
  plan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
//  SETTINGS TYPES
// ─────────────────────────────────────────────
export interface Settings {
  id: string;
  orgId: string;
  invoicePrefix: string;
  purchasePrefix: string;
  defaultTaxRate: number;
  enableStock: boolean;
  enableLedger: boolean;
  enableDailyReport: boolean;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  invoicePrefix?: string;
  purchasePrefix?: string;
  defaultTaxRate?: number;
  enableStock?: boolean;
  enableLedger?: boolean;
  enableDailyReport?: boolean;
  lowStockThreshold?: number;
}

// ─────────────────────────────────────────────
//  PARTY TYPES
// ─────────────────────────────────────────────
export interface Party {
  id: string;
  orgId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: "customer" | "supplier" | "both";
  openingBalance: number;
  currentBalance: number; // live running balance
  creditLimit?: number;
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartyRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  type: "customer" | "supplier" | "both";
  openingBalance?: number;
  creditLimit?: number;
  notes?: string;
}

export type UpdatePartyRequest = Partial<CreatePartyRequest> & {
  status?: "active" | "inactive";
};

// ─────────────────────────────────────────────
//  PRODUCT TYPES
// ─────────────────────────────────────────────
export interface Product {
  id: string;
  orgId: string;
  name: string;
  sku?: string;
  category: string;
  unit: string;
  salePrice: number;
  costPrice: number;
  trackStock: boolean;
  currentStock: number;
  lowStockQty: number;
  taxRate: number;
  notes?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku?: string;
  category: string;
  unit: string;
  salePrice: number;
  costPrice?: number;
  trackStock?: boolean;
  currentStock?: number;
  lowStockQty?: number;
  taxRate?: number;
  notes?: string;
}

export type UpdateProductRequest = Partial<CreateProductRequest> & {
  status?: "active" | "inactive";
};

// ─────────────────────────────────────────────
//  ACCOUNT TYPES
// ─────────────────────────────────────────────
export interface Account {
  id: string;
  orgId: string;
  name: string;
  type: "cash" | "bank" | "mobile_wallet" | "credit_card" | "other";
  accountNumber?: string;
  bankName?: string;
  openingBalance: number;
  balance: number; // current running balance
  currency: string;
  status: "active" | "inactive";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequest {
  name: string;
  type: "cash" | "bank" | "mobile_wallet" | "credit_card" | "other";
  openingBalance?: number;
  accountNumber?: string;
  bankName?: string;
  currency?: string;
  notes?: string;
}

export type UpdateAccountRequest = Partial<CreateAccountRequest> & {
  status?: "active" | "inactive";
};

// ─────────────────────────────────────────────
//  INVOICE (SALES) TYPES
// ─────────────────────────────────────────────
export interface InvoiceItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  costPrice?: number;
  discount?: number;
  taxRate?: number;
  amount: number;
}

export interface Invoice {
  id: string;
  orgId: string;
  billNumber: string;
  partyId: string;
  partyName: string;
  date: string;
  dueDate?: string;
  subtotal: number;
  discountAmt: number;
  taxAmt: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  notes?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  billNumber?: string; // auto-generated if omitted
  partyId: string;
  date: string;
  dueDate?: string;
  items: InvoiceItem[];
  paymentMethod: string;
  discountAmt?: number;
  taxPercentage?: number;
  notes?: string;
}

// ─────────────────────────────────────────────
//  PURCHASE TYPES
// ─────────────────────────────────────────────
export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  rate: number;
  discount?: number;
  taxRate?: number;
  amount: number;
}

export interface Purchase {
  id: string;
  orgId: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate?: string;
  subtotal: number;
  discountAmt: number;
  taxAmt: number;
  total: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: string;
  status: "unpaid" | "partial" | "paid" | "cancelled";
  notes?: string;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequest {
  purchaseNumber?: string;
  supplierId: string;
  date: string;
  dueDate?: string;
  items: PurchaseItem[];
  paymentMethod: string;
  discountAmt?: number;
  taxPercentage?: number;
  notes?: string;
}

// ─────────────────────────────────────────────
//  PAYMENT TYPES
// ─────────────────────────────────────────────
export interface Payment {
  id: string;
  orgId: string;
  partyId?: string;
  partyName?: string;
  invoiceId?: string;
  purchaseId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  date: string;
  amount: number;
  type: "receipt" | "payment" | "transfer" | "expense";
  method: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  partyId?: string;
  invoiceId?: string;
  purchaseId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  date: string;
  amount: number;
  type: "receipt" | "payment" | "transfer" | "expense";
  method: string;
  reference?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
//  EXPENSE TYPES
// ─────────────────────────────────────────────
export interface Expense {
  id: string;
  orgId: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  accountId?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  date: string;
  category: string;
  description: string;
  amount: number;
  accountId?: string;
  reference?: string;
  notes?: string;
}

// ─────────────────────────────────────────────
//  DAILY REPORT TYPES
// ─────────────────────────────────────────────
export interface DailyReport {
  id: string;
  orgId: string;
  date: string;
  openingCashBalance: number;
  cashSales: number;
  bankSales: number;
  creditSales: number;
  totalSales: number;
  cashPurchases: number;
  bankPurchases: number;
  totalPurchases: number;
  totalExpenses: number;
  cashReceived: number;
  cashPaid: number;
  bankDeposits: number;
  bankWithdrawals: number;
  closingCashBalance: number;
  netProfit: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyReportRequest {
  date: string;
  openingCashBalance: number;
  cashSales?: number;
  bankSales?: number;
  creditSales?: number;
  cashPurchases?: number;
  bankPurchases?: number;
  totalExpenses?: number;
  cashReceived?: number;
  cashPaid?: number;
  bankDeposits?: number;
  bankWithdrawals?: number;
  notes?: string;
}

// ─────────────────────────────────────────────
//  STOCK MOVEMENT TYPES
// ─────────────────────────────────────────────
export interface StockMovement {
  id: string;
  orgId: string;
  productId: string;
  productName: string;
  date: string;
  type: "purchase" | "sale" | "adjustment" | "return" | "production";
  quantity: number;
  balanceQty: number;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateStockAdjustmentRequest {
  productId: string;
  date: string;
  quantity: number; // positive = add, negative = remove
  notes?: string;
}

// ─────────────────────────────────────────────
//  LEDGER TYPES
// ─────────────────────────────────────────────
export interface LedgerEntry {
  id: string;
  orgId: string;
  partyId?: string;
  partyName?: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  type: "invoice" | "purchase" | "payment" | "expense" | "journal";
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface PartyLedger {
  partyId: string;
  partyName: string;
  openingBalance: number;
  entries: LedgerEntry[];
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

// ─────────────────────────────────────────────
//  REPORT TYPES
// ─────────────────────────────────────────────
export interface ProfitLossReport {
  fromDate: string;
  toDate: string;
  totalSales: number;
  totalPurchases: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
}

export interface BalanceSheetReport {
  asOf: string;
  totalAssets: number;    // cash + bank + receivables + stock value
  totalLiabilities: number; // payables + loans
  netWorth: number;
}

export interface CashFlowReport {
  fromDate: string;
  toDate: string;
  openingBalance: number;
  cashIn: number;
  cashOut: number;
  closingBalance: number;
}

// ─────────────────────────────────────────────
//  API CLIENT FUNCTIONS
// ─────────────────────────────────────────────

// AUTH
export const authAPI = {
  login: (d: LoginRequest) =>
    request<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify(d) }),
  register: (d: RegisterRequest) =>
    request<LoginResponse>("/auth/register", { method: "POST", body: JSON.stringify(d) }),
  logout: () =>
    request<ApiResponse<null>>("/auth/logout", { method: "POST" }),
  me: () =>
    request<ApiResponse<LoginResponse["user"]>>("/auth/me"),
};

// SETTINGS
export const settingsAPI = {
  get: () =>
    request<ApiResponse<Settings>>("/settings"),
  update: (d: UpdateSettingsRequest) =>
    request<ApiResponse<Settings>>("/settings", { method: "PUT", body: JSON.stringify(d) }),
};

// PARTIES
export const partyAPI = {
  getAll: (page = 1, pageSize = 50, type?: string) =>
    request<ApiListResponse<Party>>(
      `/parties?page=${page}&pageSize=${pageSize}${type ? `&type=${type}` : ""}`
    ),
  getById: (id: string) =>
    request<ApiResponse<Party>>(`/parties/${id}`),
  create: (d: CreatePartyRequest) =>
    request<ApiResponse<Party>>("/parties", { method: "POST", body: JSON.stringify(d) }),
  update: (id: string, d: UpdatePartyRequest) =>
    request<ApiResponse<Party>>(`/parties/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/parties/${id}`, { method: "DELETE" }),
  getLedger: (id: string, from?: string, to?: string) =>
    request<ApiResponse<PartyLedger>>(
      `/parties/${id}/ledger${from ? `?from=${from}&to=${to}` : ""}`
    ),
};

// PRODUCTS
export const productAPI = {
  getAll: (page = 1, pageSize = 50, category?: string) =>
    request<ApiListResponse<Product>>(
      `/products?page=${page}&pageSize=${pageSize}${category ? `&category=${category}` : ""}`
    ),
  getById: (id: string) =>
    request<ApiResponse<Product>>(`/products/${id}`),
  create: (d: CreateProductRequest) =>
    request<ApiResponse<Product>>("/products", { method: "POST", body: JSON.stringify(d) }),
  update: (id: string, d: UpdateProductRequest) =>
    request<ApiResponse<Product>>(`/products/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/products/${id}`, { method: "DELETE" }),
  adjustStock: (d: CreateStockAdjustmentRequest) =>
    request<ApiResponse<StockMovement>>("/products/stock-adjustment", {
      method: "POST",
      body: JSON.stringify(d),
    }),
  getStockMovements: (productId: string) =>
    request<ApiListResponse<StockMovement>>(`/products/${productId}/stock-movements`),
};

// ACCOUNTS
export const accountAPI = {
  getAll: (page = 1, pageSize = 50) =>
    request<ApiListResponse<Account>>(`/accounts?page=${page}&pageSize=${pageSize}`),
  getById: (id: string) =>
    request<ApiResponse<Account>>(`/accounts/${id}`),
  create: (d: CreateAccountRequest) =>
    request<ApiResponse<Account>>("/accounts", { method: "POST", body: JSON.stringify(d) }),
  update: (id: string, d: UpdateAccountRequest) =>
    request<ApiResponse<Account>>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/accounts/${id}`, { method: "DELETE" }),
};

// INVOICES (SALES)
export const invoiceAPI = {
  getAll: (page = 1, pageSize = 50, status?: string, partyId?: string) =>
    request<ApiListResponse<Invoice>>(
      `/invoices?page=${page}&pageSize=${pageSize}` +
      `${status ? `&status=${status}` : ""}` +
      `${partyId ? `&partyId=${partyId}` : ""}`
    ),
  getById: (id: string) =>
    request<ApiResponse<Invoice>>(`/invoices/${id}`),
  create: (d: CreateInvoiceRequest) =>
    request<ApiResponse<Invoice>>("/invoices", { method: "POST", body: JSON.stringify(d) }),
  update: (id: string, d: Partial<CreateInvoiceRequest>) =>
    request<ApiResponse<Invoice>>(`/invoices/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/invoices/${id}`, { method: "DELETE" }),
  recordPayment: (id: string, d: { amount: number; method: string; date: string; reference?: string }) =>
    request<ApiResponse<Invoice>>(`/invoices/${id}/payment`, {
      method: "POST",
      body: JSON.stringify(d),
    }),
};

// PURCHASES
export const purchaseAPI = {
  getAll: (page = 1, pageSize = 50, status?: string, supplierId?: string) =>
    request<ApiListResponse<Purchase>>(
      `/purchases?page=${page}&pageSize=${pageSize}` +
      `${status ? `&status=${status}` : ""}` +
      `${supplierId ? `&supplierId=${supplierId}` : ""}`
    ),
  getById: (id: string) =>
    request<ApiResponse<Purchase>>(`/purchases/${id}`),
  create: (d: CreatePurchaseRequest) =>
    request<ApiResponse<Purchase>>("/purchases", { method: "POST", body: JSON.stringify(d) }),
  update: (id: string, d: Partial<CreatePurchaseRequest>) =>
    request<ApiResponse<Purchase>>(`/purchases/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/purchases/${id}`, { method: "DELETE" }),
  recordPayment: (id: string, d: { amount: number; method: string; date: string; reference?: string }) =>
    request<ApiResponse<Purchase>>(`/purchases/${id}/payment`, {
      method: "POST",
      body: JSON.stringify(d),
    }),
};

// PAYMENTS
export const paymentAPI = {
  getAll: (page = 1, pageSize = 50, type?: string) =>
    request<ApiListResponse<Payment>>(
      `/payments?page=${page}&pageSize=${pageSize}${type ? `&type=${type}` : ""}`
    ),
  create: (d: CreatePaymentRequest) =>
    request<ApiResponse<Payment>>("/payments", { method: "POST", body: JSON.stringify(d) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/payments/${id}`, { method: "DELETE" }),
};

// EXPENSES
export const expenseAPI = {
  getAll: (page = 1, pageSize = 50, category?: string, from?: string, to?: string) =>
    request<ApiListResponse<Expense>>(
      `/expenses?page=${page}&pageSize=${pageSize}` +
      `${category ? `&category=${category}` : ""}` +
      `${from ? `&from=${from}&to=${to}` : ""}`
    ),
  create: (d: CreateExpenseRequest) =>
    request<ApiResponse<Expense>>("/expenses", { method: "POST", body: JSON.stringify(d) }),
  update: (id: string, d: Partial<CreateExpenseRequest>) =>
    request<ApiResponse<Expense>>(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(d) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/expenses/${id}`, { method: "DELETE" }),
};

// DAILY REPORT
export const dailyReportAPI = {
  getAll: (page = 1, pageSize = 31) =>
    request<ApiListResponse<DailyReport>>(`/daily-reports?page=${page}&pageSize=${pageSize}`),
  getByDate: (date: string) =>
    request<ApiResponse<DailyReport>>(`/daily-reports/${date}`),
  createOrUpdate: (d: CreateDailyReportRequest) =>
    request<ApiResponse<DailyReport>>("/daily-reports", { method: "POST", body: JSON.stringify(d) }),
  delete: (id: string) =>
    request<ApiResponse<null>>(`/daily-reports/${id}`, { method: "DELETE" }),
};

// INVENTORY / STOCK
export const inventoryAPI = {
  getMovements: (page = 1, pageSize = 50, productId?: string, type?: string) =>
    request<ApiListResponse<StockMovement>>(
      `/inventory?page=${page}&pageSize=${pageSize}` +
      `${productId ? `&productId=${productId}` : ""}` +
      `${type ? `&type=${type}` : ""}`
    ),
  adjust: (d: CreateStockAdjustmentRequest) =>
    request<ApiResponse<StockMovement>>("/inventory/adjust", {
      method: "POST",
      body: JSON.stringify(d),
    }),
};

// LEDGER
export const ledgerAPI = {
  getAll: (page = 1, pageSize = 50, partyId?: string, from?: string, to?: string) =>
    request<ApiListResponse<LedgerEntry>>(
      `/ledger?page=${page}&pageSize=${pageSize}` +
      `${partyId ? `&partyId=${partyId}` : ""}` +
      `${from ? `&from=${from}&to=${to}` : ""}`
    ),
  getPartyLedger: (partyId: string, from?: string, to?: string) =>
    request<ApiResponse<PartyLedger>>(
      `/ledger/party/${partyId}${from ? `?from=${from}&to=${to}` : ""}`
    ),
};

// REPORTS
export const reportAPI = {
  profitLoss: (from: string, to: string) =>
    request<ApiResponse<ProfitLossReport>>(`/reports/profit-loss?from=${from}&to=${to}`),
  balanceSheet: (asOf: string) =>
    request<ApiResponse<BalanceSheetReport>>(`/reports/balance-sheet?asOf=${asOf}`),
  cashFlow: (from: string, to: string) =>
    request<ApiResponse<CashFlowReport>>(`/reports/cash-flow?from=${from}&to=${to}`),
  dashboard: () =>
    request<ApiResponse<{
      totalSalesToday: number;
      totalPurchasesToday: number;
      totalExpensesToday: number;
      totalReceivables: number;
      totalPayables: number;
      cashBalance: number;
      bankBalance: number;
      lowStockProducts: Product[];
      recentInvoices: Invoice[];
      recentPurchases: Purchase[];
    }>>("/reports/dashboard"),
};