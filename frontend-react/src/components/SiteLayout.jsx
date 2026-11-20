import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext.jsx';
import { apiRequest } from '../services/api.js';
import { socketUrl } from '../services/platform.js';
import { createAuthenticatedSocket } from '../services/socket.js';

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
            <Link to="/consejos-trueque">Consejos para trueques seguros</Link>
            <Link to="/terminos">Términos y condiciones</Link>
          </div>
          <div>
            <h2>Participa</h2>
            {user && <Link to="/mensajes">Conversaciones</Link>}
            {user && <Link to="/perfil">Mi perfil</Link>}
            <Link to={user ? '/publicar' : '/registro'}>
              {user ? 'Crear publicación' : 'Crear una cuenta'}
            </Link>
            {!user && <Link to="/login">Iniciar sesión</Link>}
            <Link to="/contacto">Contáctanos</Link>
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
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadError, setUnreadError] = useState('');
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [pendingReviewError, setPendingReviewError] = useState('');
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setUnreadError('');
      return undefined;
    }

    let active = true;
    let receivedLiveCount = false;
    let socket;

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

    createAuthenticatedSocket(socketUrl())
      .then(authenticatedSocket => {
        if (!active) {
          authenticatedSocket.disconnect();
          return;
        }
        socket = authenticatedSocket;
        socket.on('chat:unread-count', payload => {
          if (!active || !Number.isFinite(payload?.count)) return;
          receivedLiveCount = true;
          setUnreadCount(payload.count);
          setUnreadError('');
        });
        socket.on('chat:conversation-deleted', payload => {
          if (!active || typeof payload?.conversacionId !== 'string') return;
          window.dispatchEvent(new CustomEvent('chat:conversation-deleted', {
            detail: payload
          }));
        });
        socket.on('connect_error', () => {
          if (active) setUnreadError('No se pudo actualizar el contador de mensajes.');
        });
      })
      .catch(error => {
        if (active) setUnreadError(error.message);
      });

    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (user?.rol !== 'admin') {
      setPendingReviewCount(0);
      setPendingReviewError('');
      return undefined;
    }

    let active = true;
    let loading = false;
    let timer;

    async function refreshPendingReviews() {
      if (!active || loading) return;
      loading = true;
      try {
        const data = await apiRequest('/api/admin/productos/pendientes/count');
        if (!Number.isInteger(data.count) || data.count < 0) {
          throw new Error('El contador de publicaciones pendientes no es válido.');
        }
        if (active) {
          setPendingReviewCount(data.count);
          setPendingReviewError('');
        }
      } catch (error) {
        if (active) setPendingReviewError(error.message);
      } finally {
        loading = false;
        if (active) timer = window.setTimeout(refreshPendingReviews, 30000);
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState !== 'visible' || loading) return;
      window.clearTimeout(timer);
      refreshPendingReviews();
    }

    refreshPendingReviews();
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);
    return () => {
      active = false;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [user, pathname]);

  async function handleSignOut() {
    setLogoutError('');
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      setLogoutError(error.message);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="site-layout">
      <nav className="navbar navbar-expand-xxl navbar-light navbar-inacap shadow">
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
              {pathname !== '/' && (
                <NavLink className="nav-link" to="/productos">Publicaciones</NavLink>
              )}
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
              {user && <NavLink className="nav-link" to="/perfil">Mi perfil</NavLink>}
              {user?.rol === 'admin' && (
                <NavLink className="nav-link" to="/admin">
                  Panel Admin
                  {pendingReviewCount > 0 && (
                    <span
                      className="badge rounded-pill admin-pending-badge ms-2"
                      aria-label={`${pendingReviewCount} publicaciones pendientes de revisión`}
                    >
                      {pendingReviewCount > 99 ? '99+' : pendingReviewCount}
                    </span>
                  )}
                </NavLink>
              )}
            </div>
            {user?.rol === 'admin' && pendingReviewError && (
              <span className="small text-warning ms-lg-2" role="status">
                No se pudo consultar las revisiones pendientes.
              </span>
            )}
            {user && unreadError && (
              <span className="small text-warning ms-lg-2" role="status">{unreadError}</span>
            )}
            {user && logoutError && (
              <span className="small text-warning ms-lg-2" role="alert">{logoutError}</span>
            )}
            <div className="d-flex align-items-center gap-2">
              {user ? (
                <>
                  <span className="navbar-text">{`Hola, ${user.nombre}`}</span>
                  <button className="btn btn-light" onClick={handleSignOut} disabled={signingOut}>
                    {signingOut ? 'Cerrando…' : 'Cerrar sesión'}
                  </button>
                </>
              ) : (
                <>
                  <Link className="btn btn-outline-primary" to="/login">Iniciar sesión</Link>
                  <Link className="btn btn-primary" to="/registro">Registrarse</Link>
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
      <nav className="navbar navbar-light navbar-inacap shadow">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/"><SiteBrand /></Link>
          <Link className="nav-link" to="/productos">Publicaciones</Link>
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
