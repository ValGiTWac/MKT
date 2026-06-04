import api, { handleApiResponse } from './api';
import { LoginCredentials, AuthResponse, User, ApiResponse } from '@/types';

const AUTH_ENDPOINT = '/auth';

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return handleApiResponse<AuthResponse>(
      api.post(`${AUTH_ENDPOINT}/login`, credentials)
    );
  },

  // Register user (admin only)
  register: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User> => {
    return handleApiResponse<User>(
      api.post(`${AUTH_ENDPOINT}/register`, userData)
    );
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    return handleApiResponse<User>(api.get(`${AUTH_ENDPOINT}/me`));
  },

  // Update user profile
  updateProfile: async (userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> => {
    return handleApiResponse<User>(api.put(`${AUTH_ENDPOINT}/me`, userData));
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
    return handleApiResponse<void>(api.put(`${AUTH_ENDPOINT}/change-password`, data));
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<void> => {
    return handleApiResponse<void>(api.post(`${AUTH_ENDPOINT}/forgot-password`, { email }));
  },

  // Reset password
  resetPassword: async (data: { token: string; newPassword: string }): Promise<void> => {
    return handleApiResponse<void>(api.post(`${AUTH_ENDPOINT}/reset-password`, data));
  },

  // Logout
  logout: async (): Promise<void> => {
    return handleApiResponse<void>(api.post(`${AUTH_ENDPOINT}/logout`));
  },

  // Get all users (admin only)
  getAllUsers: async (): Promise<User[]> => {
    return handleApiResponse<User[]>(api.get(`${AUTH_ENDPOINT}/users`));
  },

  // Update user role (admin only)
  updateUserRole: async (userId: string, role: string): Promise<User> => {
    return handleApiResponse<User>(api.put(`${AUTH_ENDPOINT}/users/${userId}/role`, { role }));
  },

  // Delete user (admin only)
  deleteUser: async (userId: string): Promise<void> => {
    return handleApiResponse<void>(api.delete(`${AUTH_ENDPOINT}/users/${userId}`));
  },
};
