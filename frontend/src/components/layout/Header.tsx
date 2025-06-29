import { Link, useNavigate } from 'react-router-dom';
import { Video, User, LogOut, ChevronDown } from 'lucide-react';
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
      <header className="border-b bg-white">
        <div className="flex h-16 items-center px-6">
          <Link to="/" className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VDO Maker</span>
          </Link>

          <div className="ml-auto flex items-center space-x-4">
            <nav className="flex items-center space-x-6">
              <Link
                to="/"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                to="/projects"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Projects
              </Link>
            </nav>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="text-sm font-medium">{user?.name}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b [&>*]:truncate">
                      <div className="font-medium">{user?.name}</div>
                      <div className="text-gray-500">{user?.email}</div>
                    </div>
                    
                    <button
                      onClick={handleLogoutClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
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
