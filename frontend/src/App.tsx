import { Routes, Route, Navigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { uiState } from '@/store/atoms';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import { cn } from '@/utils/helpers';

// Import pages
import DashboardPage from '@/pages/Dashboard';
import PostsPage from '@/pages/Posts';
import PostCreatePage from '@/pages/PostCreate';
import PostEditPage from '@/pages/PostEdit';
import ValidationsPage from '@/pages/Validations';
import TranslationsPage from '@/pages/Translations';
import CalendarPage from '@/pages/Calendar';
import MediaPage from '@/pages/Media';
import CollaborationPage from '@/pages/Collaboration';
import MessagesPage from '@/pages/Messages';
import AnalyticsPage from '@/pages/Analytics';
import NotificationsPage from '@/pages/Notifications';
import SettingsPage from '@/pages/Settings';
import HelpPage from '@/pages/Help';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import ProfilePage from '@/pages/Profile';
import AdminUsersPage from '@/pages/admin/Users';
import AdminIntegrationsPage from '@/pages/admin/Integrations';
import AccessDeniedPage from '@/pages/AccessDenied';
import NotFoundPage from '@/pages/NotFound';

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
  redirectTo?: string;
}

function ProtectedRoute({ children, roles, redirectTo = '/login' }: ProtectedRouteProps) {
  const { auth, hasPermission } = useAuth();

  if (!auth.isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && !hasPermission(`role:${roles.join('|')}`)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

// Public Route component
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { auth } = useAuth();

  if (auth.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Main App component
function App() {
  const [ui, setUi] = useRecoilState(uiState);

  return (
    <div className={cn('min-h-screen', ui.currentTheme)}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/create" element={<PostCreatePage />} />
          <Route path="/posts/:id/edit" element={<PostEditPage />} />
          <Route path="/posts/:id" element={<PostEditPage />} />
          <Route path="/validations" element={<ValidationsPage />} />
          <Route path="/translations" element={<TranslationsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/collaboration" element={<CollaborationPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Admin routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/integrations"
            element={
              <ProtectedRoute roles={['admin']}>
                <AdminIntegrationsPage />
              </ProtectedRoute>
            }
          />

          {/* Special pages */}
          <Route path="/access-denied" element={<AccessDeniedPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
