import { Link, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { uiState } from '@/store/atoms';
import { useAuth } from '@/hooks/useAuth';
import {
  Menu,
  Bell,
  Search,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/DropdownMenu';

export default function Header() {
  const [ui, setUi] = useRecoilState(uiState);
  const { auth, logout } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setUi((prev) => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  };

  const toggleTheme = () => {
    const newTheme = ui.currentTheme === 'dark' ? 'light' : 'dark';
    setUi((prev) => ({ ...prev, currentTheme: newTheme }));
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    switch (path) {
      case '/':
        return 'Dashboard';
      case '/posts':
        return 'Tous les Posts';
      case '/posts/create':
        return 'Créer un Post';
      case '/validations':
        return 'Validations';
      case '/translations':
        return 'Traductions';
      case '/calendar':
        return 'Calendrier';
      case '/media':
        return 'Médias';
      case '/collaboration':
        return 'Collaboration';
      case '/messages':
        return 'Messages';
      case '/analytics':
        return 'Analytique';
      case '/notifications':
        return 'Notifications';
      case '/settings':
        return 'Paramètres';
      case '/help':
        return 'Aide';
      default:
        return 'WHISE Marketing Platform';
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-30">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          {/* Breadcrumb / Page title */}
          <div className="hidden lg:block">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {auth.user ? `Bonjour, ${auth.user.name}` : 'Bienvenue'}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="hidden md:flex">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Rechercher..."
                className="pl-10 w-64 bg-gray-100 dark:bg-gray-700 border-0 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {ui.currentTheme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>

          {/* User menu */}
          {auth.isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                      {auth.user?.name.charAt(0)}
                    </span>
                  </div>
                  <span className="hidden md:block">{auth.user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Mon profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <span>Paramètres</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => (window.location.href = '/login')}>
              Se connecter
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
