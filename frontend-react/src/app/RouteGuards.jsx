import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export function RequireAuth() {
  const { user, loading, sessionError } = useAuth();
  const location = useLocation();

  if (loading) {
    return <main className="container py-5 text-center" role="status">Verificando sesión…</main>;
  }

  return user
    ? <Outlet />
    : <Navigate
      to="/login"
      replace
      state={{ from: location, error: sessionError || undefined }}
    />;
}

export function RequireAdmin() {
  const { user } = useAuth();

  return user?.rol === 'admin'
    ? <Outlet />
    : <Navigate to={user ? '/productos' : '/login'} replace />;
}
