import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();

  return user
    ? <Outlet />
    : <Navigate to="/login" replace state={{ from: location }} />;
}

export function RequireAdmin() {
  const { user } = useAuth();

  return user?.rol === 'admin'
    ? <Outlet />
    : <Navigate to={user ? '/productos' : '/login'} replace />;
}
