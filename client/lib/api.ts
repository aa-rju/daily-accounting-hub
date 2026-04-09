/**
 * client/lib/api.ts
 * Complete API client including reportsAPI and settingsAPI
 * which were missing from the original file.
 */

import type {
  ApiResponse, ApiListResponse,
  Party, Product, Account, Invoice, Purchase,
  DailyReport, InventoryItem, PartyLedger,
} from "@shared/api";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!response.ok) throw new Error(data.message || "API request failed");
  return data;
}

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (email: string, password: string) =>
    apiCall<ApiResponse<any>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: any) =>
    apiCall<ApiResponse<any>>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () =>
    apiCall<ApiResponse<null>>("/auth/logout", { method: "POST" }),
  me: () =>
    apiCall<ApiResponse<any>>("/auth/me"),
};

// ── Parties ───────────────────────────────────────────────────
export const partyAPI = {
  getAll: (page = 1, pageSize = 50, type?: string) => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (type && type !== "all") p.append("type", type);
    return apiCall<ApiListResponse<Party>>(`/parties?${p}`);
  },
  get: (id: string) => apiCall<ApiResponse<Party>>(`/parties/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Party>>("/parties", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<Party>>(`/parties/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/parties/${id}`, { method: "DELETE" }),
};

// ── Products ──────────────────────────────────────────────────
export const productAPI = {
  getAll: (page = 1, pageSize = 50, category?: string) => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (category) p.append("category", category);
    return apiCall<ApiListResponse<Product>>(`/products?${p}`);
  },
  get: (id: string) => apiCall<ApiResponse<Product>>(`/products/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Product>>("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<Product>>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/products/${id}`, { method: "DELETE" }),
};

// ── Accounts ──────────────────────────────────────────────────
export const accountAPI = {
  getAll: (page = 1, pageSize = 50) => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiCall<ApiListResponse<Account>>(`/accounts?${p}`);
  },
  get: (id: string) => apiCall<ApiResponse<Account>>(`/accounts/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Account>>("/accounts", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<Account>>(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/accounts/${id}`, { method: "DELETE" }),
};

// ── Sales (Invoices) ──────────────────────────────────────────
export const salesAPI = {
  getAll: (page = 1, pageSize = 50, status?: string, partyId?: string) => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status && status !== "all") p.append("status", status);
    if (partyId) p.append("partyId", partyId);
    return apiCall<ApiListResponse<Invoice>>(`/sales?${p}`);
  },
  get: (id: string) => apiCall<ApiResponse<Invoice>>(`/sales/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Invoice>>("/sales", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<Invoice>>(`/sales/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/sales/${id}`, { method: "DELETE" }),
};

// ── Purchases ─────────────────────────────────────────────────
export const purchaseAPI = {
  getAll: (page = 1, pageSize = 50, status?: string, supplierId?: string) => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status && status !== "all") p.append("status", status);
    if (supplierId) p.append("supplierId", supplierId);
    return apiCall<ApiListResponse<Purchase>>(`/purchases?${p}`);
  },
  get: (id: string) => apiCall<ApiResponse<Purchase>>(`/purchases/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Purchase>>("/purchases", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<Purchase>>(`/purchases/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/purchases/${id}`, { method: "DELETE" }),
};

// ── Daily Reports ─────────────────────────────────────────────
export const dailyReportAPI = {
  getAll: (page = 1, pageSize = 31, startDate?: string, endDate?: string) => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (startDate) p.append("startDate", startDate);
    if (endDate) p.append("endDate", endDate);
    return apiCall<ApiListResponse<DailyReport>>(`/daily-reports?${p}`);
  },
  getByDate: (date: string) =>
    apiCall<ApiResponse<DailyReport>>(`/daily-reports/${date}`),
  create: (data: any) =>
    apiCall<ApiResponse<DailyReport>>("/daily-reports", { method: "POST", body: JSON.stringify(data) }),
  update: (date: string, data: any) =>
    apiCall<ApiResponse<DailyReport>>(`/daily-reports/${date}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (date: string) =>
    apiCall<ApiResponse<null>>(`/daily-reports/${date}`, { method: "DELETE" }),
};

// ── Inventory ─────────────────────────────────────────────────
export const inventoryAPI = {
  getAll: (page = 1, pageSize = 50, date?: string, productId?: string) => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (date) p.append("date", date);
    if (productId) p.append("productId", productId);
    return apiCall<ApiListResponse<InventoryItem>>(`/inventory?${p}`);
  },
  get: (id: string) => apiCall<ApiResponse<InventoryItem>>(`/inventory/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<InventoryItem>>("/inventory", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<InventoryItem>>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/inventory/${id}`, { method: "DELETE" }),
};

// ── Ledger ────────────────────────────────────────────────────
export const ledgerAPI = {
  getAll: (page = 1, pageSize = 50) => {
    const p = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiCall<ApiListResponse<PartyLedger>>(`/ledger?${p}`);
  },
  getPartyLedger: (partyId: string, startDate?: string, endDate?: string) => {
    const p = new URLSearchParams();
    if (startDate) p.append("startDate", startDate);
    if (endDate) p.append("endDate", endDate);
    return apiCall<ApiResponse<PartyLedger>>(`/ledger/${partyId}?${p}`);
  },
  create: (data: any) =>
    apiCall<ApiResponse<any>>("/ledger", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/ledger/${id}`, { method: "DELETE" }),
};

// ── Reports ← THIS WAS MISSING ───────────────────────────────
export const reportsAPI = {
  getDashboard: () =>
    apiCall<ApiResponse<any>>("/reports/dashboard"),
  getProfitLoss: (startDate?: string, endDate?: string) => {
    const p = new URLSearchParams();
    if (startDate) p.append("startDate", startDate);
    if (endDate) p.append("endDate", endDate);
    return apiCall<ApiResponse<any>>(`/reports/profit-loss?${p}`);
  },
  getBalanceSheet: () =>
    apiCall<ApiResponse<any>>("/reports/balance-sheet"),
  getCashFlow: (startDate?: string, endDate?: string) => {
    const p = new URLSearchParams();
    if (startDate) p.append("startDate", startDate);
    if (endDate) p.append("endDate", endDate);
    return apiCall<ApiResponse<any>>(`/reports/cash-flow?${p}`);
  },
};

// ── Settings ──────────────────────────────────────────────────
export const settingsAPI = {
  get: () => apiCall<ApiResponse<any>>("/settings"),
  update: (data: any) =>
    apiCall<ApiResponse<any>>("/settings", { method: "PUT", body: JSON.stringify(data) }),
};