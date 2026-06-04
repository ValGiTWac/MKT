import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationToast from '@/components/NotificationToast';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import PostsPage from '@/pages/Posts';
import PostCreatePage from '@/pages/PostCreate';
import PostEditPage from '@/pages/PostEdit';
import UsersPage from '@/pages/admin/Users';
import IntegrationsPage from '@/pages/admin/Integrations';
import SettingsPage from '@/pages/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/posts" element={<PostsPage />} />
                <Route path="/posts/create" element={<PostCreatePage />} />
                <Route path="/posts/:id/edit" element={<PostEditPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                
                {/* Admin Routes */}
                <Route path="/admin/users" element={<UsersPage />} />
                <Route path="/admin/integrations" element={<IntegrationsPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <NotificationToast />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
