import { Link } from 'react-router-dom';
import { SiteLayout } from '../components/SiteLayout.jsx';

export default function HomePage() {
  return (
    <SiteLayout>
    <main className="container py-5">
      <section className="text-center mb-5">
        <p className="text-uppercase fw-bold mb-2">Tecnología para nuestra comunidad</p>
        <h1 className="display-4 fw-bold">Bienvenido a IntechMarket</h1>
        <p className="lead mx-auto">
          Descubre, publica y encuentra productos tecnológicos en el marketplace de la comunidad educativa.
        </p>
        <Link className="btn btn-primary btn-lg mt-2" to="/productos">Explorar productos</Link>
      </section>
      <div className="row g-4">
        <div className="col-12 col-md-6">
          <article className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <h2 className="h4 card-title">Crea tu cuenta</h2>
              <p>Regístrate para participar en el marketplace y conectar con la comunidad.</p>
              <Link className="btn btn-primary mt-auto" to="/registro">Registrarse</Link>
            </div>
          </article>
        </div>
        <div className="col-12 col-md-6">
          <article className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <h2 className="h4 card-title">Publica tus productos</h2>
              <p>Inicia sesión para crear y administrar tus publicaciones tecnológicas.</p>
              <Link className="btn btn-primary mt-auto" to="/login">Iniciar sesión</Link>
            </div>
          </article>
        </div>
      </div>
    </main>
    </SiteLayout>
  );
}
