import api, { handleApiError } from './api';
import {
  LoginCredentials,
  RegisterCredentials,
  UserProfile,
  ApiResponse,
} from '@/types';

const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
};

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    try {
      const response = await api.post<ApiResponse<UserProfile>>(
        AUTH_ENDPOINTS.LOGIN,
        credentials
      );
      
      if (!response.data.data) {
        throw new Error('No user data received');
      }
      
      const { token, refreshToken, ...user } = response.data.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Register user
  async register(data: RegisterCredentials): Promise<UserProfile> {
    try {
      const response = await api.post<ApiResponse<UserProfile>>(
        AUTH_ENDPOINTS.REGISTER,
        data
      );
      
      if (!response.data.data) {
        throw new Error('No user data received');
      }
      
      const { token, refreshToken, ...user } = response.data.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      await api.post(AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Continue with local logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login';
    }
  },

  // Get current user
  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const response = await api.get<ApiResponse<UserProfile>>(
        AUTH_ENDPOINTS.ME
      );
      return response.data.data;
    } catch (error) {
      // If token is invalid, clear and return null
      if (handleApiError(error).includes('Unauthorized')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      return null;
    }
  },

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const response = await api.post<ApiResponse<{ token: string; refreshToken: string }>>(
        AUTH_ENDPOINTS.REFRESH,
        { refreshToken }
      );
      return response.data.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    try {
      await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Reset password
  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, { token, password });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Verify email
  async verifyEmail(token: string): Promise<void> {
    try {
      await api.post(AUTH_ENDPOINTS.VERIFY_EMAIL, { token });
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get stored user
  getStoredUser(): UserProfile | null {
    const user = localStorage.getItem('user');
    if (!user) return null;
    
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('token');
  },
};

export default authService;
