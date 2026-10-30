import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiDelete, apiPost, apiRequest, formatPrice } from '../services/api.js';
import { useAuth } from '../app/AuthContext.jsx';
import { Feedback, SiteLayout } from '../components/SiteLayout.jsx';
import {
  categoryDetails,
  categoryNames,
  categorySubcategories,
  getProductCategory
} from '../utils/categories.js';

function formatListingPrice(price) {
  return Number(price) === 0 ? 'Gratis / sin costo' : formatPrice(price);
}

function productImages(product) {
  return product.imagenes?.length ? product.imagenes : [product.imagen].filter(Boolean);
}

function showsEstimatedValue(category) {
  return ![
    'Comunidad y Recreación',
    'Avisos y Oportunidades',
    'Objetos Perdidos y Encontrados'
  ].includes(category);
}

function publicationStatus(product) {
  return product.estado || 'aprobada';
}

function searchWords(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('es-CL')
    .match(/[\p{L}\p{N}]+/gu) || [];
}

function matchesKeyword(product, keyword) {
  const keywords = searchWords(keyword);
  if (!keywords.length) return true;

  const { categoria, subcategoria } = getProductCategory(product);
  const productWords = new Set(searchWords([
    product.nombre,
    product.descripcion,
    categoria,
    subcategoria,
    product.sePermutaPor,
    product.detalleCategoria,
    product.comentario
  ].filter(Boolean).join(' ')));

  return keywords.every(word => productWords.has(word));
}

function ProductCard({ product, mine = false, onDelete, onStatusChange }) {
  const { categoria, subcategoria } = getProductCategory(product);
  const status = publicationStatus(product);
  const statusLabels = {
    pendiente: 'Pendiente de aprobación',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    pausada: 'Pausada'
  };

  return (
    <div className={mine ? 'col-12 col-sm-6 col-lg-3' : 'col'}>
      <article className={`card shadow-sm h-100 ${mine ? 'card-publicacion' : 'card-producto'}`}>
        <img
          src={productImages(product)[0]}
          className="imagen-publicacion card-img-top"
          alt={product.nombre}
        />
        <div className="card-body">
          <span className="badge mb-2">
            {categoria}{subcategoria ? ` · ${subcategoria}` : ''}
          </span>
          {mine && (
            <span className={`badge ms-2 mb-2 ${status === 'aprobada' ? 'bg-success' : status === 'rechazada' ? 'bg-danger' : 'bg-secondary'}`}>
              {statusLabels[status] || status}
            </span>
          )}
          <h2 className="h5 card-title">{product.nombre}</h2>
          {mine && status === 'rechazada' && product.motivoRechazo && (
            <p className="small text-danger">Motivo: {product.motivoRechazo}</p>
          )}
          {categoria === 'Trueques' && product.sePermutaPor && (
            <p className="fw-semibold mb-3">Se permuta por: {product.sePermutaPor}</p>
          )}
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
                {['aprobada', 'pausada'].includes(status) && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => onStatusChange(
                      product._id,
                      status === 'aprobada' ? 'pausada' : 'aprobada'
                    )}
                  >
                    {status === 'aprobada' ? 'Pausar publicación' : 'Reanudar publicación'}
                  </button>
                )}
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
  const [subcategory, setSubcategory] = useState('Todas');
  const [keyword, setKeyword] = useState('');
  const [dateOrder, setDateOrder] = useState('recent');
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
    const { categoria: productCategory } = getProductCategory(product);
    result[productCategory] = (result[productCategory] || 0) + 1;
    return result;
  }, {});
  const subcategoryCounts = products.reduce((result, product) => {
    const productCategory = getProductCategory(product);
    if (category === 'Todos' || productCategory.categoria === category) {
      result[productCategory.subcategoria] =
        (result[productCategory.subcategoria] || 0) + 1;
    }
    return result;
  }, {});
  const filtered = products
    .filter(product => {
      const productCategory = getProductCategory(product);
      return (category === 'Todos' || productCategory.categoria === category) &&
        (subcategory === 'Todas' || productCategory.subcategoria === subcategory) &&
        matchesKeyword(product, keyword);
    })
    .sort((left, right) => {
      const leftDate = Date.parse(left.createdAt);
      const rightDate = Date.parse(right.createdAt);
      const leftValid = Number.isFinite(leftDate);
      const rightValid = Number.isFinite(rightDate);

      if (!leftValid || !rightValid) {
        return leftValid === rightValid ? 0 : leftValid ? -1 : 1;
      }

      return dateOrder === 'oldest' ? leftDate - rightDate : rightDate - leftDate;
    });

  return (
    <SiteLayout>
      <main className="container py-4">
        <h1 className="text-center mb-4">Publicaciones</h1>
        <div className="row g-3 mb-4">
          <div className="col-md-8">
            <label className="form-label fw-semibold" htmlFor="keyword-filter">Buscar palabra clave</label>
            <input
              className="form-control"
              id="keyword-filter"
              type="search"
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              placeholder="Busca palabras completas en las publicaciones"
            />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold" htmlFor="date-order-filter">Ordenar por fecha</label>
            <select
              className="form-select"
              id="date-order-filter"
              value={dateOrder}
              onChange={event => setDateOrder(event.target.value)}
            >
              <option value="recent">Más recientes primero</option>
              <option value="oldest">Más antiguas primero</option>
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor="category-filter">Filtrar por categoría</label>
          <select
            className="form-select"
            id="category-filter"
            value={category}
            onChange={event => {
              setCategory(event.target.value);
              setSubcategory('Todas');
            }}
          >
            <option value="Todos">Todos ({products.length})</option>
            {categoryNames.map(item => (
              <option key={item} value={item}>{item} ({counts[item] || 0})</option>
            ))}
          </select>
        </div>
        {category !== 'Todos' && (
          <div className="mb-4">
            <label className="form-label fw-semibold" htmlFor="subcategory-filter">Filtrar por subcategoría</label>
            <select
              className="form-select"
              id="subcategory-filter"
              value={subcategory}
              onChange={event => setSubcategory(event.target.value)}
            >
              <option value="Todas">Todas ({counts[category] || 0})</option>
              {categorySubcategories[category].map(item => (
                <option key={item} value={item}>{item} ({subcategoryCounts[item] || 0})</option>
              ))}
            </select>
          </div>
        )}
        {loading && <p role="status">Cargando publicaciones…</p>}
        <Feedback error={error} />
        {!loading && !error && (
          filtered.length
            ? <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4 g-4">
                {filtered.map(product => <ProductCard key={product._id} product={product} />)}
              </div>
            : <p className="text-muted">No hay publicaciones para mostrar.</p>
        )}
      </main>
    </SiteLayout>
  );
}

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const fromMine = searchParams.get('origen') === 'mis-publicaciones';
  const fromAdmin = searchParams.get('origen') === 'admin';
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState('');

  useEffect(() => {
    setLoading(true);
    apiRequest(`/api/productos/${encodeURIComponent(id)}`)
      .then(data => {
        setProduct(data);
        setActiveImage(0);
      })
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [id]);

  const publicadorId = product?.usuario?._id || product?.usuario;
  const isOwner = user && String(publicadorId) === String(user.id);
  const isAdmin = user?.rol === 'admin';
  const canContact = product &&
    (product.estado === 'aprobada' || product.estado === undefined);
  const images = product ? productImages(product) : [];
  const productCategory = product ? getProductCategory(product) : null;

  async function startChat() {
    setChatError('');
    setChatBusy(true);
    try {
      const conversation = await apiPost(
        `/api/chat/publicaciones/${encodeURIComponent(id)}/conversacion`,
        {}
      );
      navigate(`/mensajes/${conversation._id}`);
    } catch (requestError) {
      setChatError(requestError.message);
    } finally {
      setChatBusy(false);
    }
  }

  return (
    <SiteLayout>
      <main className="container mt-5 mb-5">
        <h1 className="text-center mb-4">Detalle de la publicación</h1>
        {loading && <p role="status">Cargando publicación…</p>}
        <Feedback error={error} />
        {product && (
          <div className="card shadow-lg border-0">
            <div className="row g-0">
              <div className="col-md-6 card-detalle-imagen">
                <img className="img-fluid h-100 w-100" src={images[activeImage]} alt={product.nombre} />
                {images.length > 1 && (
                  <div className="detalle-miniaturas" aria-label="Fotos de la publicación">
                    {images.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        className={`detalle-miniatura ${index === activeImage ? 'activa' : ''}`}
                        onClick={() => setActiveImage(index)}
                        aria-label={`Ver foto ${index + 1}`}
                        aria-pressed={index === activeImage}
                      >
                        <img src={image} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                <div className="card-body p-4">
                  <span className="badge bg-primary mb-3">
                    {productCategory.categoria}
                    {productCategory.subcategoria
                      ? ` · ${productCategory.subcategoria}`
                      : ''}
                  </span>
                  <h2 className="card-title">{product.nombre}</h2>
                  {(fromMine || isAdmin) && product.estado && (
                    <p className="text-muted">
                      Estado: {product.estado === 'pendiente'
                        ? 'Pendiente de aprobación'
                        : product.estado === 'aprobada'
                          ? 'Aprobada'
                          : product.estado === 'rechazada'
                            ? 'Rechazada'
                            : 'Pausada'}
                    </p>
                  )}
                  {(fromMine || isAdmin) && product.estado === 'rechazada' && product.motivoRechazo && (
                    <p className="text-danger">Motivo del rechazo: {product.motivoRechazo}</p>
                  )}
                  {productCategory.categoria === 'Trueques' && product.sePermutaPor && (
                    <p className="fw-semibold mb-3">
                      Se permuta por: {product.sePermutaPor}
                    </p>
                  )}
                  {showsEstimatedValue(productCategory.categoria) &&
                    product.precio !== undefined && product.precio !== null && (
                    <small className="text-muted d-block mb-3">
                      Producto / Servicio evaluado en: {formatListingPrice(product.precio)}
                    </small>
                  )}
                  <h2 className="h5">Descripción</h2>
                  <p className="text-muted">{product.descripcion}</p>
                  {product.detalleCategoria && (
                    <>
                      <h2 className="h5">{categoryDetails[productCategory.categoria]?.label || 'Detalles'}</h2>
                      <p className="text-muted">{product.detalleCategoria}</p>
                    </>
                  )}
                  <h2 className="h5">Comentario</h2>
                  <p>{product.comentario || 'Sin comentarios'}</p>
                  <Feedback error={chatError} />
                  <div className="d-grid gap-2 mt-4">
                    {fromMine && (
                      <Link className="btn btn-warning" to={`/publicar/${product._id}/editar`}>
                        Editar publicación
                      </Link>
                    )}
                    {user && !isOwner && !isAdmin && canContact && (
                      <button
                        className="btn btn-primary"
                        onClick={startChat}
                        disabled={chatBusy}
                      >
                        {chatBusy ? 'Abriendo chat…' : 'Enviar mensaje'}
                      </button>
                    )}
                    {!user && canContact && (
                      <Link
                        className="btn btn-primary"
                        to="/login"
                        state={{ from: { pathname: `/productos/${product._id}` } }}
                      >
                        Inicia sesión para enviar un mensaje
                      </Link>
                    )}
                    <Link
                      className="btn btn-dark"
                      to={fromAdmin ? '/admin' : fromMine ? '/mis-publicaciones' : '/productos'}
                    >
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

  async function changeStatus(id, estado) {
    try {
      await apiRequest(`/api/productos/mis-publicaciones/${encodeURIComponent(id)}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado })
      });
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
          <Link className="btn btn-primary" to="/publicar">Crear publicación</Link>
        </div>
        {loading && <p role="status">Cargando publicaciones…</p>}
        <Feedback error={error} />
        {!loading && !error && !products.length && <p className="text-muted">Aún no tienes publicaciones.</p>}
        <div className="row g-4">
          {products.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              mine
              onDelete={remove}
              onStatusChange={changeStatus}
            />
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
    subcategoria: '',
    sePermutaPor: '',
    detalleCategoria: '',
    comentario: ''
  });
  const validSubcategories = categorySubcategories[values.categoria] || [];
  const formSubcategories = editing && values.subcategoria &&
    !validSubcategories.includes(values.subcategoria)
    ? [...validSubcategories, values.subcategoria]
    : validSubcategories;

  useEffect(() => {
    if (!editing) return;
    apiRequest('/api/productos/mis-publicaciones')
      .then(products => {
        const product = products.find(item => item._id === id);
        if (!product) throw new Error('No se encontró la publicación en tu cuenta.');
        const productCategory = getProductCategory(product);
        setValues({
          nombre: product.nombre || '',
          descripcion: product.descripcion || '',
          precio: product.precio ?? '',
          categoria: productCategory.categoria || '',
          subcategoria: productCategory.subcategoria || '',
          sePermutaPor: product.sePermutaPor || '',
          detalleCategoria: product.detalleCategoria || '',
          comentario: product.comentario || ''
        });
      })
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [editing, id]);

  function update(event) {
    const { name, value } = event.target;
    setValues(current => ({
      ...current,
      [name]: value,
      ...(name === 'categoria'
        ? { subcategoria: '', sePermutaPor: '', detalleCategoria: '' }
        : {})
    }));
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
      setSuccess(editing
        ? 'Cambios enviados a revisión. La publicación no será visible hasta que se apruebe.'
        : 'Publicación enviada a revisión. Será visible cuando administración la apruebe.');
      if (editing) {
        window.setTimeout(() => navigate('/mis-publicaciones'), 700);
      } else {
        formElement.reset();
        setValues({
          nombre: '',
          descripcion: '',
          precio: '',
          categoria: '',
          subcategoria: '',
          sePermutaPor: '',
          detalleCategoria: '',
          comentario: ''
        });
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
                <h1 className="h2 text-center mb-4">{editing ? 'Editar publicación' : 'Crear publicación'}</h1>
                {loading && <p role="status">Cargando publicación…</p>}
                {!loading && !error && (
                  <form onSubmit={submit}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-category">Categoría</label>
                      <select className="form-select" id="product-category" name="categoria" value={values.categoria} onChange={update} required>
                        <option value="">Seleccione</option>
                        {categoryNames.map(item => <option key={item} value={item}>{item}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-subcategory">Subcategoría</label>
                      <select
                        className="form-select"
                        id="product-subcategory"
                        name="subcategoria"
                        value={values.subcategoria}
                        onChange={update}
                        required
                        disabled={!values.categoria}
                      >
                        <option value="">Seleccione</option>
                        {formSubcategories.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-name">
                        {values.categoria === 'Trueques' ? 'Producto a publicar' : 'Título'}
                      </label>
                      <input className="form-control" id="product-name" name="nombre" value={values.nombre} onChange={update} required />
                    </div>
                    {values.categoria === 'Trueques' && (
                      <div className="mb-3">
                        <label className="form-label fw-bold" htmlFor="product-trade">Se permuta por</label>
                        <input
                          className="form-control"
                          id="product-trade"
                          name="sePermutaPor"
                          value={values.sePermutaPor}
                          onChange={update}
                          placeholder="¿Qué producto o material buscas a cambio?"
                          required
                        />
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-description">Descripción</label>
                      <textarea
                        className="form-control"
                        id="product-description"
                        name="descripcion"
                        rows="4"
                        value={values.descripcion}
                        onChange={update}
                        placeholder={values.categoria === 'Trueques'
                          ? 'Describe lo que ofreces y las condiciones de la permuta.'
                          : 'Describe tu publicación.'}
                        required
                      />
                    </div>
                    {showsEstimatedValue(values.categoria) && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="product-price">
                          Producto / Servicio evaluado en:
                        </label>
                        <input className="form-control" id="product-price" name="precio" type="number" min="0" step="1" value={values.precio} onChange={update} required />
                        <div className="form-text">Valor referencial; no se mostrará en el aviso.</div>
                      </div>
                    )}
                    {categoryDetails[values.categoria] && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="product-category-details">
                          {categoryDetails[values.categoria].label}
                        </label>
                        <textarea
                          className="form-control"
                          id="product-category-details"
                          name="detalleCategoria"
                          rows="3"
                          value={values.detalleCategoria}
                          onChange={update}
                          placeholder={categoryDetails[values.categoria].placeholder}
                        />
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-comment">Comentario</label>
                      <textarea className="form-control" id="product-comment" name="comentario" rows="3" value={values.comentario} onChange={update} />
                    </div>
                    <div className="mb-4">
                      <label className="form-label" htmlFor="product-images">Fotos (máximo 3)</label>
                      <input
                        className="form-control"
                        id="product-images"
                        name="imagenes"
                        type="file"
                        accept="image/*"
                        multiple
                        required={!editing}
                        onChange={event => {
                          if (event.target.files.length > 3) {
                            setError('Puedes seleccionar como máximo 3 fotos.');
                            event.target.value = '';
                          } else {
                            setError('');
                          }
                        }}
                      />
                      {editing && (
                        <small className="form-text text-muted">
                          Si seleccionas fotos nuevas, reemplazarán las fotos actuales. Si no seleccionas ninguna, se conservarán.
                        </small>
                      )}
                    </div>
                    <div className="d-grid gap-2">
                      <button className="btn btn-primary btn-lg" disabled={busy}>
                        {busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear publicación'}
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
