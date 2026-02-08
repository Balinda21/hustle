import storage from './storage';
import { API_BASE_URL } from '../config/api';

/**
 * API Response Types
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: any;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

/**
 * Request Options
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  skipAuth?: boolean;
}

/**
 * API Client Class
 */
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await storage.getItem('auth_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.baseURL}${endpoint}`;

    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      url += `?${queryString}`;
    }

    return url;
  }

  private async buildHeaders(options?: RequestOptions): Promise<HeadersInit> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    };

    if (!options?.skipAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;
    try {
      if (isJson) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (error) {
      throw new Error('Failed to parse response');
    }

    if (!response.ok) {
      const error: ApiError = {
        message: data.message || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data: data,
      };
      throw error;
    }

    // Normalize backend response format
    if (data && typeof data === 'object' && 'status' in data && !('success' in data)) {
      return {
        success: data.status === 'success',
        message: data.message || '',
        data: data.data,
        error: data.status === 'error' ? data : undefined,
      };
    }

    return data;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options?: RequestOptions & { body?: any }
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options?.params);
      const headers = await this.buildHeaders(options);

      const fetchOptions: RequestInit = {
        method,
        headers,
        ...(options?.body && { body: JSON.stringify(options.body) }),
      };

      const response = await fetch(url, fetchOptions);
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        message: error.message || 'Network error. Please check your connection.',
        status: 0,
        data: null,
      } as ApiError;
    }
  }

  async get<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  async post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, { ...options, body });
  }

  async put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { ...options, body });
  }

  async patch<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { ...options, body });
  }

  async delete<T = any>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }

  async upload<T = any>(
    endpoint: string,
    formData: FormData,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint, options?.params);
      const token = await this.getAuthToken();

      const headers: Record<string, string> = {};
      if (token && !options?.skipAuth) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      Object.assign(headers, options?.headers || {});

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error.status) {
        throw error;
      }
      throw {
        message: error.message || 'Upload failed',
        status: 0,
        data: null,
      } as ApiError;
    }
  }
}

// Create and export singleton instance
export const api = new ApiClient(API_BASE_URL);

export default ApiClient;
