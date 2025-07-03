import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { LogoutConfirmDialog } from '@/components/auth/LogoutConfirmDialog';
import { useKeyboardShortcuts, createLogoutShortcut, createLogoutShortcutMac } from '@/hooks/useKeyboardShortcuts';

export function Header() {
  const { user, logout } = useAuthStore();
  const { addToast } = useUIStore();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      setShowLogoutConfirm(false);
      
      addToast({
        type: 'success',
        title: 'Signed Out',
        message: 'You have been successfully signed out.',
      });
      
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      
      addToast({
        type: 'error',
        title: 'Logout Error',
        message: 'There was an issue signing out, but you have been logged out locally.',
      });
      
      // Even if logout fails, redirect to login
      setShowLogoutConfirm(false);
      navigate('/login');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  // Keyboard shortcuts for logout
  useKeyboardShortcuts([
    createLogoutShortcut(handleLogoutClick),
    createLogoutShortcutMac(handleLogoutClick),
  ]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/20 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 shadow">
        <div className="flex h-16 items-center px-8">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative transition-transform group-hover:scale-105">
              <img 
                src="/logo.svg" 
                alt="AI Video Studio" 
                className="h-8 w-8 drop-shadow-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                AI Video Studio
              </span>
              <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
            </div>
          </Link>

          <div className="ml-auto flex items-center space-x-6">
            <nav className="flex items-center space-x-8">
              <Link
                to="/"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
              </Link>
              <Link
                to="/projects"
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors relative group"
              >
                Projects
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
              </Link>
            </nav>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-3 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all duration-200 group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-slate-700">{user?.name}</div>
                  <div className="text-xs text-slate-500">{user?.email}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-hover:text-slate-600" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-soft-lg border border-slate-200/60 z-50 animate-scale-in">
                  <div className="p-2">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="font-medium text-slate-900 truncate">{user?.name}</div>
                      <div className="text-sm text-slate-500 truncate">{user?.email}</div>
                    </div>
                    
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center w-full px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 transition-colors rounded-xl mt-2"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backdrop to close dropdown */}
        {isDropdownOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />
        )}
      </header>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        userName={user?.name}
      />
    </>
  );
}
