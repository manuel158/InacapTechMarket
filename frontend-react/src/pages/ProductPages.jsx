import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiDelete, apiRequest, formatPrice } from '../services/api.js';
import { Feedback, SiteLayout } from '../components/SiteLayout.jsx';

const categories = [
  'Notebooks',
  'Computadores',
  'Monitores',
  'Perifericos',
  'Celulares',
  'Consolas',
  'Componentes',
  'Impresoras',
  'Redes',
  'Otros'
];

function ProductCard({ product, mine = false, onDelete }) {
  return (
    <div className={mine ? 'col-12 col-sm-6 col-lg-3' : 'col'}>
      <article className={`card shadow-sm h-100 ${mine ? 'card-publicacion' : 'card-producto'}`}>
        <img
          src={product.imagen}
          className="imagen-publicacion card-img-top"
          alt={product.nombre}
        />
        <div className="card-body">
          <span className="badge mb-2">{product.categoria}</span>
          <h2 className="h5 card-title">{product.nombre}</h2>
          <p className="text-success fw-bold mb-3">{formatPrice(product.precio)}</p>
          {!mine && product.usuario?.nombre && (
            <p className="text-muted">Publicado por {product.usuario.nombre}</p>
          )}
        </div>
        <div className="card-footer bg-white border-0">
          <div className="d-grid gap-2">
            <Link
              className={mine ? 'btn btn-success' : 'botonVerDetalleProductos'}
              to={`/productos/${product._id}${mine ? '?origen=mis-publicaciones' : ''}`}
            >
              Ver detalle
            </Link>
            {mine && (
              <>
                <Link className="btn btn-warning" to={`/publicar/${product._id}/editar`}>
                  Editar
                </Link>
                <button className="btn btn-danger" onClick={() => onDelete(product._id)}>
                  Eliminar
                </button>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

export function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('Todos');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/productos')
      .then(data => {
        if (!Array.isArray(data)) throw new Error('La respuesta no contiene una lista de productos.');
        setProducts(data);
      })
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = products.reduce((result, product) => {
    result[product.categoria] = (result[product.categoria] || 0) + 1;
    return result;
  }, {});
  const filtered = category === 'Todos'
    ? products
    : products.filter(product => product.categoria === category);

  return (
    <SiteLayout>
      <main className="container py-4">
        <h1 className="text-center mb-4">Productos Publicados</h1>
        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="category-filter">Filtrar por categoría</label>
          <select
            className="form-select"
            id="category-filter"
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            <option value="Todos">Todos ({products.length})</option>
            {categories.map(item => (
              <option key={item} value={item}>{item} ({counts[item] || 0})</option>
            ))}
          </select>
        </div>
        {loading && <p role="status">Cargando productos…</p>}
        <Feedback error={error} />
        {!loading && !error && (
          filtered.length
            ? <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
                {filtered.map(product => <ProductCard key={product._id} product={product} />)}
              </div>
            : <p className="text-muted">No hay productos para mostrar.</p>
        )}
      </main>
    </SiteLayout>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fromMine = searchParams.get('origen') === 'mis-publicaciones';
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(`/api/productos/${encodeURIComponent(id)}`)
      .then(setProduct)
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id]);

  const whatsapp = product?.whatsapp?.replace(/\D/g, '');

  return (
    <SiteLayout>
      <main className="container mt-5 mb-5">
        <h1 className="text-center mb-4">Detalle del Producto</h1>
        {loading && <p role="status">Cargando producto…</p>}
        <Feedback error={error} />
        {product && (
          <div className="card shadow-lg border-0">
            <div className="row g-0">
              <div className="col-md-6 card-detalle-imagen">
                <img className="img-fluid h-100 w-100" src={product.imagen} alt={product.nombre} />
              </div>
              <div className="col-md-6">
                <div className="card-body p-4">
                  <span className="badge bg-primary mb-3">{product.categoria}</span>
                  <h2 className="card-title">{product.nombre}</h2>
                  <h3 className="text-success fw-bold mb-4">{formatPrice(product.precio)}</h3>
                  <h2 className="h5">Descripción</h2>
                  <p className="text-muted">{product.descripcion}</p>
                  <h2 className="h5">Comentario del vendedor</h2>
                  <p>{product.comentario || 'Sin comentarios'}</p>
                  <p><strong>WhatsApp:</strong> {product.whatsapp}</p>
                  <div className="d-grid gap-2 mt-4">
                    {fromMine && (
                      <Link className="btn btn-warning" to={`/publicar/${product._id}/editar`}>
                        Editar publicación
                      </Link>
                    )}
                    {whatsapp && (
                      <a
                        className="btn btn-success"
                        href={`https://wa.me/${whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Contactar por WhatsApp
                      </a>
                    )}
                    <Link className="btn btn-dark" to={fromMine ? '/mis-publicaciones' : '/productos'}>
                      Volver
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </SiteLayout>
  );
}

export function MyListingsPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setError('');
    try {
      const data = await apiRequest('/api/productos/mis-publicaciones');
      setProducts(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function remove(id) {
    if (!window.confirm('¿Eliminar publicación?')) return;
    try {
      await apiDelete(`/api/productos/mis-publicaciones/${encodeURIComponent(id)}`);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <SiteLayout>
      <main className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="mb-0">Mis Publicaciones</h1>
          <Link className="btn btn-primary" to="/publicar">Publicar producto</Link>
        </div>
        {loading && <p role="status">Cargando publicaciones…</p>}
        <Feedback error={error} />
        {!loading && !error && !products.length && <p className="text-muted">Aún no tienes publicaciones.</p>}
        <div className="row g-4">
          {products.map(product => (
            <ProductCard key={product._id} product={product} mine onDelete={remove} />
          ))}
        </div>
      </main>
    </SiteLayout>
  );
}

export function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [values, setValues] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    whatsapp: '',
    comentario: ''
  });

  useEffect(() => {
    if (!editing) return;
    apiRequest('/api/productos/mis-publicaciones')
      .then(products => {
        const product = products.find(item => item._id === id);
        if (!product) throw new Error('No se encontró la publicación en tu cuenta.');
        setValues({
          nombre: product.nombre || '',
          descripcion: product.descripcion || '',
          precio: product.precio ?? '',
          categoria: product.categoria || '',
          whatsapp: product.whatsapp || '',
          comentario: product.comentario || ''
        });
      })
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  function update(event) {
    setValues(current => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    try {
      const response = await fetch(
        editing
          ? `/api/productos/mis-publicaciones/${encodeURIComponent(id)}`
          : '/api/productos',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.mensaje || `Error del servidor (${response.status})`);
      setSuccess(editing ? 'Publicación actualizada correctamente.' : 'Producto publicado correctamente.');
      if (editing) {
        window.setTimeout(() => navigate('/mis-publicaciones'), 700);
      } else {
        formElement.reset();
        setValues({ nombre: '', descripcion: '', precio: '', categoria: '', whatsapp: '', comentario: '' });
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <main className="container mt-5 mb-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <section className="card shadow">
              <div className="card-body">
                <h1 className="h2 text-center mb-4">{editing ? 'Editar Publicación' : 'Publicar Producto'}</h1>
                {loading && <p role="status">Cargando publicación…</p>}
                {!loading && !error && (
                  <form onSubmit={submit}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-name">Nombre</label>
                      <input className="form-control" id="product-name" name="nombre" value={values.nombre} onChange={update} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-description">Descripción</label>
                      <textarea className="form-control" id="product-description" name="descripcion" rows="4" value={values.descripcion} onChange={update} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-price">Precio</label>
                      <input className="form-control" id="product-price" name="precio" type="number" min="0" step="1" value={values.precio} onChange={update} required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-category">Categoría</label>
                      <select className="form-select" id="product-category" name="categoria" value={values.categoria} onChange={update} required>
                        <option value="">Seleccione</option>
                        {categories.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-whatsapp">WhatsApp</label>
                      <input className="form-control" id="product-whatsapp" name="whatsapp" value={values.whatsapp} onChange={update} placeholder="56912345678" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-comment">Comentario</label>
                      <textarea className="form-control" id="product-comment" name="comentario" rows="3" value={values.comentario} onChange={update} />
                    </div>
                    <div className="mb-4">
                      <label className="form-label" htmlFor="product-image">Imagen</label>
                      <input className="form-control" id="product-image" name="imagen" type="file" accept="image/*" required={!editing} />
                      {editing && <small className="form-text text-muted">Si no selecciona una imagen, se conservará la actual.</small>}
                    </div>
                    <div className="d-grid gap-2">
                      <button className="btn btn-primary btn-lg" disabled={busy}>
                        {busy ? 'Guardando…' : editing ? 'Guardar Cambios' : 'Publicar Producto'}
                      </button>
                      <Link className="btn btn-outline-secondary" to="/mis-publicaciones">Cancelar</Link>
                    </div>
                  </form>
                )}
                <Feedback error={error} success={success} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </SiteLayout>
  );
}
