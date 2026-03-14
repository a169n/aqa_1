import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { LoadingState } from './loading-state';

export const ProtectedRoute = () => {
  const location = useLocation();
  const { isAuthenticated, isReady } = useAuth();

  if (!isReady) {
    return <LoadingState label="Restoring your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

