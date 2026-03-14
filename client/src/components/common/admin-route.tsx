import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { LoadingState } from './loading-state';

export const AdminRoute = () => {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <LoadingState label="Checking admin access..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

