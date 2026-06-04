import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Plug,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';

const Layout: React.FC = () => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Posts', href: '/posts', icon: FileText },
    ...(hasRole(['admin', 'manager'])
      ? [
          { label: 'Utilisateurs', href: '/admin/users', icon: Users },
          { label: 'Intégrations', href: '/admin/integrations', icon: Plug },
        ]
      : [],
    { label: 'Paramètres', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-30 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="font-semibold text-secondary-900">WHISE MKT</span>
          </Link>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`);
              
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                    )}
                  >
                    <item.icon size={20} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary-200 rounded-full flex items-center justify-center">
              <span className="text-secondary-700 font-medium text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-secondary-900">{user?.name}</p>
              <p className="text-xs text-secondary-500">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main
        className={clsx(
          'lg:ml-64 min-h-screen transition-all duration-300',
          isSidebarOpen ? 'ml-0' : ''
        )}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-secondary-900">
                {navItems.find((item) => 
                  location.pathname === item.href ||
                  location.pathname.startsWith(`${item.href}/`)
                )?.label || 'WHISE MKT'}
              </h1>
              <p className="text-sm text-secondary-500">
                Plateforme de gestion de contenu marketing
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
