import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../app/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

export function SiteLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadError, setUnreadError] = useState('');

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setUnreadError('');
      return undefined;
    }

    let active = true;
    let receivedLiveCount = false;
    const socket = io({
      auth: { token: localStorage.getItem('token') }
    });

    apiRequest('/api/chat/no-leidos')
      .then(data => {
        if (active && !receivedLiveCount && Number.isFinite(data.count)) {
          setUnreadCount(data.count);
          setUnreadError('');
        }
      })
      .catch(error => {
        if (active) setUnreadError(error.message);
      });

    socket.on('chat:unread-count', payload => {
      if (!active || !Number.isFinite(payload?.count)) return;
      receivedLiveCount = true;
      setUnreadCount(payload.count);
      setUnreadError('');
    });
    socket.on('connect_error', () => {
      if (active) setUnreadError('No se pudo actualizar el contador de mensajes.');
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [user]);

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark navbar-inacap shadow">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            InacapTechMarket
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#reactNavbar"
            aria-controls="reactNavbar"
            aria-expanded="false"
            aria-label="Mostrar navegación"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="reactNavbar">
            <div className="navbar-nav me-auto">
              <NavLink className="nav-link" to="/productos">Publicaciones</NavLink>
              {user && (
                <NavLink className="nav-link" to="/mensajes">
                  Mensajes
                  {unreadCount > 0 && (
                    <span className="badge rounded-pill bg-danger ms-2" aria-label={`${unreadCount} mensajes sin leer`}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              )}
              {user && <NavLink className="nav-link" to="/publicar">Publicar</NavLink>}
              {user && <NavLink className="nav-link" to="/mis-publicaciones">Mis publicaciones</NavLink>}
              {user?.rol === 'admin' && <NavLink className="nav-link" to="/admin">Panel Admin</NavLink>}
            </div>
            {user && unreadError && (
              <span className="small text-warning ms-lg-2" role="status">{unreadError}</span>
            )}
            <div className="d-flex align-items-center gap-2">
              {user ? (
                <>
                  <span className="navbar-text text-white">{`Hola, ${user.nombre}`}</span>
                  <button className="btn btn-light" onClick={handleSignOut}>Cerrar sesión</button>
                </>
              ) : (
                <>
                  <Link className="btn btn-outline-light" to="/login">Iniciar sesión</Link>
                  <Link className="btn btn-light" to="/registro">Registrarse</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {children ?? <Outlet />}
      <footer className="footer-inacap">
        <div className="container">
          <h2 className="h5">InacapTechMarket</h2>
          <p className="mb-0">Marketplace de la comunidad educativa.</p>
          <small>Valdivia, Chile · © 2026</small>
        </div>
      </footer>
    </>
  );
}

export function AuthLayout({ children }) {
  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-dark navbar-inacap shadow">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">InacapTechMarket</Link>
          <Link className="nav-link text-white" to="/productos">Publicaciones</Link>
        </div>
      </nav>
      <main className="container flex-grow-1 py-5">{children}</main>
      <footer className="bg-dark text-white py-4 mt-auto">
        <div className="container">Marketplace de la comunidad educativa · Valdivia, Chile</div>
      </footer>
    </div>
  );
}

export function Feedback({ error, success }) {
  if (!error && !success) return null;
  return (
    <div className={`mt-3 ${error ? 'text-danger' : 'text-success'}`} role="status">
      {error || success}
    </div>
  );
}
