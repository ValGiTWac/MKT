import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response) {
      const { status } = error.response;

      switch (status) {
        case 401:
          // Token expired - try to refresh
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            // Attempt to refresh token
            return axios
              .post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, {
                refreshToken,
              })
              .then((refreshResponse) => {
                const { token, refreshToken: newRefreshToken } = refreshResponse.data.data;
                localStorage.setItem('token', token);
                localStorage.setItem('refreshToken', newRefreshToken);
                
                // Retry original request with new token
                if (error.config) {
                  const originalRequest = error.config;
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                  return axios(originalRequest);
                }
                return Promise.reject(error);
              })
              .catch(() => {
                // Refresh failed - logout
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(error);
              });
          } else {
            // No refresh token - logout
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
          break;
        case 403:
          // Forbidden - redirect to access denied
          window.location.href = '/access-denied';
          break;
        case 404:
          // Not found
          console.error('Resource not found:', error.response.data);
          break;
        case 500:
          // Server error
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Other error
      console.error('Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;

// Helper functions
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    if (axiosError.response) {
      return (
        axiosError.response.data?.error ||
        axiosError.response.data?.message ||
        'Une erreur est survenue'
      );
    }
    return axiosError.message || 'Erreur réseau';
  }
  return 'Une erreur inconnue est survenue';
};

export const isApiError = (error: unknown): error is AxiosError<ApiResponse<unknown>> => {
  return axios.isAxiosError(error);
};
