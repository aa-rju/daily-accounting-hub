/**
 * Professional API Client with interceptors, error handling, and auth
 * Location: client/services/apiClient.ts
 */

import type { ApiResponse, ApiListResponse } from "@shared/api";

interface RequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private defaultTimeout = 30000; // 30 seconds

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE || "/api";
    this.loadAuthToken();
  }

  /**
   * Load auth token from localStorage
   */
  private loadAuthToken(): void {
    try {
      const token = localStorage.getItem("authToken");
      if (token) {
        this.authToken = token;
      }
    } catch (error) {
      console.error("Failed to load auth token:", error);
    }
  }

  /**
   * Set auth token (called after login)
   */
  setAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem("authToken", token);
  }

  /**
   * Clear auth token (called on logout)
   */
  clearAuthToken(): void {
    this.authToken = null;
    localStorage.removeItem("authToken");
  }

  /**
   * Get authorization header
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    return headers;
  }

  /**
   * Handle response errors
   */
  private async handleError(response: Response, body: any): Promise<never> {
    const error: ApiError = new Error(body.message || "API request failed");
    error.status = response.status;
    error.code = body.code;
    error.details = body.details;

    // Handle specific status codes
    switch (response.status) {
      case 401:
        // Unauthorized - clear token and redirect to login
        this.clearAuthToken();
        window.location.href = "/login";
        break;
      case 403:
        // Forbidden
        throw new Error("You do not have permission to access this resource");
      case 404:
        // Not found
        throw new Error(body.message || "Resource not found");
      case 429:
        // Rate limited
        throw new Error("Too many requests. Please try again later");
      case 500:
        // Server error
        console.error("Server error:", body);
        throw new Error("Server error. Please try again later");
    }

    throw error;
  }

  /**
   * Make API request with error handling and retry logic
   */
  async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { timeout = this.defaultTimeout, retries = 2, ...options } = config;

    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          headers: this.getHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        // Check response status
        if (!response.ok) {
          await this.handleError(response, data);
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on auth errors or client errors
        if (
          error instanceof TypeError ||
          (error instanceof Error && error.message.includes("401"))
        ) {
          throw lastError;
        }

        // Retry on network errors
        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError || new Error("Failed to complete API request");
  }

  /**
   * GET request
   */
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Hook for using API client in React components
 */
export function useApi() {
  return {
    get: apiClient.get.bind(apiClient),
    post: apiClient.post.bind(apiClient),
    put: apiClient.put.bind(apiClient),
    delete: apiClient.delete.bind(apiClient),
    patch: apiClient.patch.bind(apiClient),
    setAuthToken: apiClient.setAuthToken.bind(apiClient),
    clearAuthToken: apiClient.clearAuthToken.bind(apiClient),
  };
}
