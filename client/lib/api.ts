/**
 * API Integration Helper
 * Use these functions in your React components to call backend APIs
 */

import type { ApiResponse, ApiListResponse, Party, Product, Account, Invoice, Purchase, DailyReport, InventoryItem, PartyLedger } from "@shared/api";

const API_BASE = import.meta.env.VITE_API_BASE || "/api";

// Generic fetch wrapper
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
    // Token expired — clear and redirect to login
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!response.ok) throw new Error(data.message || "API request failed");
  return data;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) =>
    apiCall<ApiResponse<any>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: async () =>
    apiCall<ApiResponse<null>>("/auth/logout", { method: "POST" }),
};

// Party API
export const partyAPI = {
  getAll: (page = 1, pageSize = 10, type?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (type) params.append("type", type);
    return apiCall<ApiListResponse<Party>>(`/parties?${params}`);
  },
  get: (id: string) => apiCall<ApiResponse<Party>>(`/parties/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Party>>("/parties", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<Party>>(`/parties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/parties/${id}`, { method: "DELETE" }),
};

// Product API
export const productAPI = {
  getAll: (page = 1, pageSize = 10, category?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (category) params.append("category", category);
    return apiCall<ApiListResponse<Product>>(`/products?${params}`);
  },
  get: (id: string) => apiCall<ApiResponse<Product>>(`/products/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Product>>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<Product>>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/products/${id}`, { method: "DELETE" }),
};

// Account API
export const accountAPI = {
  getAll: (page = 1, pageSize = 10) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiCall<ApiListResponse<Account>>(`/accounts?${params}`);
  },
  get: (id: string) => apiCall<ApiResponse<Account>>(`/accounts/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Account>>("/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<Account>>(`/accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/accounts/${id}`, { method: "DELETE" }),
};

// Sales API
export const salesAPI = {
  getAll: (page = 1, pageSize = 10, status?: string, partyId?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.append("status", status);
    if (partyId) params.append("partyId", partyId);
    return apiCall<ApiListResponse<Invoice>>(`/sales?${params}`);
  },
  get: (id: string) => apiCall<ApiResponse<Invoice>>(`/sales/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Invoice>>("/sales", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, status: string) =>
    apiCall<ApiResponse<Invoice>>(`/sales/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/sales/${id}`, { method: "DELETE" }),
};

// Purchase API
export const purchaseAPI = {
  getAll: (page = 1, pageSize = 10, status?: string, supplierId?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.append("status", status);
    if (supplierId) params.append("supplierId", supplierId);
    return apiCall<ApiListResponse<Purchase>>(`/purchases?${params}`);
  },
  get: (id: string) => apiCall<ApiResponse<Purchase>>(`/purchases/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<Purchase>>("/purchases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, status: string) =>
    apiCall<ApiResponse<Purchase>>(`/purchases/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/purchases/${id}`, { method: "DELETE" }),
};

// Daily Report API
export const dailyReportAPI = {
  getAll: (page = 1, pageSize = 10, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return apiCall<ApiListResponse<DailyReport>>(`/daily-reports?${params}`);
  },
  getByDate: (date: string) => apiCall<ApiResponse<DailyReport>>(`/daily-reports/${date}`),
  create: (data: any) =>
    apiCall<ApiResponse<DailyReport>>("/daily-reports", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (date: string, data: any) =>
    apiCall<ApiResponse<DailyReport>>(`/daily-reports/${date}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (date: string) =>
    apiCall<ApiResponse<null>>(`/daily-reports/${date}`, { method: "DELETE" }),
};

// Inventory API
export const inventoryAPI = {
  getAll: (page = 1, pageSize = 10, date?: string, productId?: string) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (date) params.append("date", date);
    if (productId) params.append("productId", productId);
    return apiCall<ApiListResponse<InventoryItem>>(`/inventory?${params}`);
  },
  get: (id: string) => apiCall<ApiResponse<InventoryItem>>(`/inventory/${id}`),
  create: (data: any) =>
    apiCall<ApiResponse<InventoryItem>>("/inventory", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    apiCall<ApiResponse<InventoryItem>>(`/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/inventory/${id}`, { method: "DELETE" }),
};

// Ledger API
export const ledgerAPI = {
  getAll: (page = 1, pageSize = 10) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiCall<ApiListResponse<PartyLedger>>(`/ledger?${params}`);
  },
  getPartyLedger: (partyId: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    return apiCall<ApiResponse<PartyLedger>>(`/ledger/${partyId}?${params}`);
  },
  create: (data: any) =>
    apiCall<ApiResponse<any>>("/ledger", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    apiCall<ApiResponse<null>>(`/ledger/${id}`, { method: "DELETE" }),
};
