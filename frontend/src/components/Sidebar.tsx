import { NavLink, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { uiState } from '@/store/atoms';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/helpers';
import {
  LayoutDashboard,
  FileText,
  PlusSquare,
  CheckSquare,
  Globe,
  Users,
  Settings,
  BarChart3,
  Bell,
  HelpCircle,
  X,
  Menu,
  Calendar,
  MessageSquare,
  Image,
} from 'lucide-react';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'editor', 'viewer'],
  },
  {
    label: 'Posts',
    href: '/posts',
    icon: FileText,
    roles: ['admin', 'manager', 'editor', 'viewer'],
  },
  {
    label: 'Créer un Post',
    href: '/posts/create',
    icon: PlusSquare,
    roles: ['admin', 'manager', 'editor'],
  },
  {
    label: 'Validation',
    href: '/validations',
    icon: CheckSquare,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Traductions',
    href: '/translations',
    icon: Globe,
    roles: ['admin', 'manager', 'editor'],
  },
  {
    label: 'Calendrier',
    href: '/calendar',
    icon: Calendar,
    roles: ['admin', 'manager', 'editor', 'viewer'],
  },
  {
    label: 'Médias',
    href: '/media',
    icon: Image,
    roles: ['admin', 'manager', 'editor'],
  },
  {
    label: 'Collaboration',
    href: '/collaboration',
    icon: Users,
    roles: ['admin', 'manager', 'editor'],
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageSquare,
    roles: ['admin', 'manager', 'editor'],
  },
  {
    label: 'Analytique',
    href: '/analytics',
    icon: BarChart3,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['admin', 'manager', 'editor'],
  },
  {
    label: 'Paramètres',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'manager', 'editor', 'viewer'],
  },
  {
    label: 'Aide',
    href: '/help',
    icon: HelpCircle,
    roles: ['admin', 'manager', 'editor', 'viewer'],
  },
];

const adminItems = [
  {
    label: 'Utilisateurs',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    label: 'Intégrations',
    href: '/admin/integrations',
    icon: Settings,
    roles: ['admin'],
  },
];

export default function Sidebar() {
  const [ui, setUi] = useRecoilState(uiState);
  const { auth } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setUi((prev) => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  };

  const NavItem = ({ item }: { item: (typeof navigationItems)[0] }) => {
    const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);

    return (
      <NavLink
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
          isActive
            ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 font-medium'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
        )}
      >
        <item.icon className="w-5 h-5" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg"
      >
        {ui.isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-all duration-300',
          ui.isSidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center px-4 border-b dark:border-gray-700">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MKT</span>
            </div>
            <span className="font-semibold text-lg text-gray-900 dark:text-white">WHISE</span>
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100vh-4rem)] p-4">
          {/* Main navigation */}
          <div className="flex-1 space-y-1">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Menu Principal
            </p>
            {navigationItems
              .filter((item) => {
                if (!auth.user) return true;
                return item.roles.includes(auth.user.role);
              })
              .map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
          </div>

          {/* Admin section */}
          {auth.user?.role === 'admin' && (
            <div className="pt-4 border-t dark:border-gray-700">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Administration
              </p>
              {adminItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          )}

          {/* User section */}
          <div className="pt-4 border-t dark:border-gray-700">
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Compte
            </p>
            {auth.user && (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                    {auth.user.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{auth.user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {auth.user.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar overlay for mobile */}
        {ui.isSidebarOpen && (
          <div
            onClick={toggleSidebar}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          />
        )}
      </aside>
    </>
  );
}
