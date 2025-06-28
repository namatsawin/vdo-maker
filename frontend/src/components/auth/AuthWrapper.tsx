import React, { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { LoginForm } from './LoginForm';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => window.location.reload()} />;
  }

  return <>{children}</>;
};
