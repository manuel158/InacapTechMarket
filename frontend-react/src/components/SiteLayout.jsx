import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthContext.jsx';

export function SiteLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
              {user && <NavLink className="nav-link" to="/mensajes">Mensajes</NavLink>}
              {user && <NavLink className="nav-link" to="/publicar">Publicar</NavLink>}
              {user && <NavLink className="nav-link" to="/mis-publicaciones">Mis publicaciones</NavLink>}
              {user?.rol === 'admin' && <NavLink className="nav-link" to="/admin">Panel Admin</NavLink>}
            </div>
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
