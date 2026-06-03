import { useEffect, useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { authState } from '@/store/atoms';
import { authService } from '@/services/authService';
import { User, LoginCredentials, RegisterCredentials, UserProfile } from '@/types';

export const useAuth = () => {
  const [auth, setAuth] = useRecoilState(authState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');

      if (token && user) {
        try {
          const parsedUser = JSON.parse(user) as User;
          setAuth({
            user: parsedUser,
            token,
            refreshToken: refreshToken || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch {
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setAuth({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } else {
        setAuth({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    };

    initializeAuth();
  }, [setAuth]);

  // Login
  const login = useCallback(
    async (credentials: LoginCredentials): Promise<UserProfile> => {
      setAuth((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const userProfile = await authService.login(credentials);
        setAuth({
          user: userProfile,
          token: userProfile.token,
          refreshToken: userProfile.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return userProfile;
      } catch (error) {
        setAuth((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Login failed',
        }));
        throw error;
      }
    },
    [setAuth]
  );

  // Register
  const register = useCallback(
    async (data: RegisterCredentials): Promise<UserProfile> => {
      setAuth((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const userProfile = await authService.register(data);
        setAuth({
          user: userProfile,
          token: userProfile.token,
          refreshToken: userProfile.refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return userProfile;
      } catch (error) {
        setAuth((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        }));
        throw error;
      }
    },
    [setAuth]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Continue with local logout
    } finally {
      setAuth({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, [setAuth]);

  // Refresh token
  const refreshToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const { token, refreshToken: newRefreshToken } = await authService.refreshToken(
        refreshToken
      );

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);

      setAuth((prev) => ({
        ...prev,
        token,
        refreshToken: newRefreshToken,
      }));

      return token;
    } catch (error) {
      // Clear auth on refresh failure
      logout();
      throw error;
    }
  }, [setAuth, logout]);

  // Get current user
  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    try {
      const userProfile = await authService.getCurrentUser();
      if (userProfile) {
        const { token, refreshToken, ...user } = userProfile;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        setAuth({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return user;
      }
      return null;
    } catch {
      return null;
    }
  }, [setAuth]);

  // Check if user has permission
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!auth.user) return false;
      return auth.user.permissions?.includes(permission) || false;
    },
    [auth.user]
  );

  // Check if user has any of the permissions
  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
      if (!auth.user) return false;
      return permissions.some((permission) =>
        auth.user.permissions?.includes(permission)
      );
    },
    [auth.user]
  );

  // Check if user has all permissions
  const hasAllPermissions = useCallback(
    (permissions: string[]): boolean => {
      if (!auth.user) return false;
      return permissions.every((permission) =>
        auth.user.permissions?.includes(permission)
      );
    },
    [auth.user]
  );

  return {
    auth,
    login,
    register,
    logout,
    refreshToken,
    getCurrentUser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};

export default useAuth;
