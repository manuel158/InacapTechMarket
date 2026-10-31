import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../app/AuthContext.jsx';
import { apiRequest } from '../services/api.js';

function SiteBrand() {
  return (
    <span className="brand-name">
      <span>Inacap</span>
      <span className="brand-tech">Tech</span>
      <span className="brand-market">Market</span>
    </span>
  );
}

function SiteFooter({ user }) {
  return (
    <footer className="footer-inacap">
      <div className="container footer-inacap-content">
        <div className="footer-inacap-about">
          <Link className="navbar-brand fw-bold" to="/">
            <SiteBrand />
          </Link>
          <p>
            Un espacio para compartir, intercambiar y conectar con la comunidad educativa.
          </p>
          <small>Hecho para la comunidad INACAP · Valdivia, Chile</small>
        </div>
        <nav className="footer-inacap-links" aria-label="Enlaces del pie de página">
          <div>
            <h2>Explora</h2>
            <Link to="/productos">Publicaciones</Link>
            <Link to="/terminos">Términos y condiciones</Link>
          </div>
          <div>
            <h2>Participa</h2>
            {user && <Link to="/mensajes">Conversaciones</Link>}
            <Link to={user ? '/publicar' : '/registro'}>
              {user ? 'Crear publicación' : 'Crear una cuenta'}
            </Link>
            {!user && <Link to="/login">Iniciar sesión</Link>}
          </div>
        </nav>
        <div className="footer-inacap-bottom">
          <span>© {new Date().getFullYear()} InacapTechMarket</span>
          <Link to="/terminos">Uso responsable de la plataforma</Link>
        </div>
      </div>
    </footer>
  );
}

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
    <div className="site-layout">
      <nav className="navbar navbar-expand-lg navbar-dark navbar-inacap shadow">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            <SiteBrand />
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
                  Conversaciones
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
      <SiteFooter user={user} />
    </div>
  );
}

export function AuthLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="site-layout">
      <nav className="navbar navbar-dark navbar-inacap shadow">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/"><SiteBrand /></Link>
          <Link className="nav-link text-white" to="/productos">Publicaciones</Link>
        </div>
      </nav>
      <main className="container flex-grow-1 py-5">{children}</main>
      <SiteFooter user={user} />
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
