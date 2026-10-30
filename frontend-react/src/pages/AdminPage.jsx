import { useEffect, useState } from 'react';
import { apiDelete, apiRequest } from '../services/api.js';
import { Feedback, SiteLayout } from '../components/SiteLayout.jsx';
import { getProductCategory } from '../utils/categories.js';
import { Link } from 'react-router-dom';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setError('');
    try {
      const [userData, productData] = await Promise.all([
        apiRequest('/api/admin/usuarios'),
        apiRequest('/api/admin/productos')
      ]);
      setUsers(userData);
      setProducts(productData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(path, label) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${label}?`)) return;
    try {
      await apiDelete(path);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function reviewProduct(product, estado) {
    const motivoRechazo = estado === 'rechazada'
      ? window.prompt('Indica el motivo del rechazo (máximo 500 caracteres):')
      : '';
    if (estado === 'rechazada' && motivoRechazo === null) return;

    try {
      await apiRequest(`/api/admin/producto/${encodeURIComponent(product._id)}/revision`, {
        method: 'PATCH',
        body: JSON.stringify({ estado, motivoRechazo })
      });
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  const categoryCounts = products.reduce((result, product) => {
    const { categoria } = getProductCategory(product);
    result[categoria] = (result[categoria] || 0) + 1;
    return result;
  }, {});
  const adminCount = users.filter(user => user.rol === 'admin').length;

  return (
    <SiteLayout>
      <main className="container mt-4">
        <h1 className="mb-4">Panel Administrador</h1>
        <Feedback error={error} />
        {loading && <p role="status">Cargando panel…</p>}
        {!loading && !error && (
          <>
            <div className="row g-3 mb-4">
              {[
                ['Total Usuarios', users.length],
                ['Publicaciones', products.length],
                ['Pendientes de revisión', products.filter(product => product.estado === 'pendiente').length],
                ['Administradores', adminCount],
                ['Categorías', Object.keys(categoryCounts).length]
              ].map(([label, value]) => (
                <div className="col-6 col-lg-4" key={label}>
                  <div className="card text-center shadow">
                    <div className="card-body"><h2 className="h6">{label}</h2><p className="h2 mb-0">{value}</p></div>
                  </div>
                </div>
              ))}
            </div>
            <section className="card shadow mb-4">
              <div className="card-header"><h2 className="h4 mb-0">Reporte de Categorías</h2></div>
              <div className="card-body">
                {Object.entries(categoryCounts).map(([category, count]) => (
                  <div className="d-flex justify-content-between border-bottom py-2" key={category}>
                    <strong>{category}</strong><span>{count}</span>
                  </div>
                ))}
                {!Object.keys(categoryCounts).length && <p className="mb-0">Sin productos registrados.</p>}
              </div>
            </section>
            <section className="card shadow mb-4">
              <div className="card-header"><h2 className="h4 mb-0">Usuarios</h2></div>
              <div className="card-body">
                {users.map(user => (
                  <div className="d-flex justify-content-between align-items-center border-bottom py-2 gap-3" key={user._id}>
                    <div>
                      <strong>{user.nombre}</strong><br />
                      {user.correo}<span className="badge bg-primary ms-2">{user.rol}</span>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => remove(`/api/admin/usuario/${encodeURIComponent(user._id)}`, 'este usuario')}>
                      Eliminar
                    </button>
                  </div>
                ))}
                {!users.length && <p className="mb-0">No hay usuarios.</p>}
              </div>
            </section>
            <section className="card shadow">
              <div className="card-header"><h2 className="h4 mb-0">Publicaciones</h2></div>
              <div className="card-body">
                {products.map(product => (
                  <div className="d-flex justify-content-between align-items-center border-bottom py-2 gap-3" key={product._id}>
                    <div>
                      <strong>{product.nombre}</strong>
                      <div className="small text-muted">
                        {product.categoria} · {product.estado || 'aprobada'}
                      </div>
                      {product.estado === 'rechazada' && product.motivoRechazo && (
                        <div className="small text-danger">Motivo: {product.motivoRechazo}</div>
                      )}
                    </div>
                    <div className="d-flex gap-2">
                      <Link className="btn btn-outline-primary btn-sm" to={`/productos/${product._id}`}>
                        Ver publicación
                      </Link>
                      {product.estado === 'pendiente' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => reviewProduct(product, 'aprobada')}>
                            Aprobar
                          </button>
                          <button className="btn btn-warning btn-sm" onClick={() => reviewProduct(product, 'rechazada')}>
                            Rechazar
                          </button>
                        </>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => remove(`/api/admin/producto/${encodeURIComponent(product._id)}`, 'esta publicación')}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {!products.length && <p className="mb-0">No hay publicaciones.</p>}
              </div>
            </section>
          </>
        )}
      </main>
    </SiteLayout>
  );
}
