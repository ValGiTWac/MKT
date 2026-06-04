import axios, { AxiosInstance, AxiosError } from 'axios';
import { ApiResponse } from '@/types';

// Create axios instance with base URL
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Helper function to handle API responses
export const handleApiResponse = async <T>(
  promise: Promise<{ data: ApiResponse<T> }>
): Promise<T> => {
  try {
    const response = await promise;
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error || 'Unknown error');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      throw new Error(
        axiosError.response?.data?.error ||
        axiosError.message ||
        'An error occurred'
      );
    }
    throw error;
  }
};
