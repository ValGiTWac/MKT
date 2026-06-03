import { Outlet } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { uiState } from '@/store/atoms';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '@/utils/helpers';

export default function Layout() {
  const [ui, setUi] = useRecoilState(uiState);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div
          className={cn(
            'flex-1 flex flex-col min-h-screen transition-all duration-300',
            ui.isSidebarOpen ? 'ml-64' : 'ml-0'
          )}
        >
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
            <Outlet />
          </main>

          {/* Footer */}
          <footer className="py-4 px-6 text-center text-sm text-gray-500 dark:text-gray-400 border-t dark:border-gray-800">
            © {new Date().getFullYear()} WHISE Marketing Platform. All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
}
