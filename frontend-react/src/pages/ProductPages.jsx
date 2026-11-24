import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiDelete, apiPost, apiRequest, formatPrice } from '../services/api.js';
import { useAuth } from '../app/AuthContext.jsx';
import { Feedback, SiteLayout } from '../components/SiteLayout.jsx';
import {
  categoryNames,
  categorySubcategories,
  getCategoryDetails,
  getProductCategory
} from '../utils/categories.js';

function formatListingPrice(price) {
  return Number(price) === 0 ? 'Gratis / sin costo' : formatPrice(price);
}

function productImages(product) {
  return product.imagenes?.length ? product.imagenes : [product.imagen].filter(Boolean);
}

function showsEstimatedValue(category, subcategory) {
  return ![
    'Comunidad y Recreación',
    'Avisos y Oportunidades',
    'Objetos Perdidos y Encontrados',
    'Todo mascotas'
  ].includes(category) &&
    !(category === 'Servicios Estudiantiles' &&
      subcategory === 'Difusión de emprendimientos');
}

function descriptionPlaceholder(category, subcategory) {
  const placeholders = {
    'Todo mascotas': {
      'Mascotas en adopción': 'Describe su personalidad, rutina, salud y condiciones que buscas para su nuevo hogar.',
      'Busco adoptar una mascota': 'Cuéntanos qué mascota buscas y cómo será el hogar y cuidado que puedes ofrecer.',
      'Mascota perdida': 'Indica especie, características, lugar y fecha en que se perdió, y un medio seguro para contactarte.',
      'Mascota encontrada': 'Indica especie, características, lugar y fecha en que la encontraste, y cómo coordinar una devolución segura.'
    },
    'Servicios Estudiantiles': {
      'Paseador de perros': 'Describe tu experiencia, cómo organizas los paseos y qué cuidados ofreces.',
      'Difusión de emprendimientos': 'Describe tu emprendimiento, el público al que quieres llegar y el tipo de difusión que buscas.'
    }
  };

  return placeholders[category]?.[subcategory] ||
    (category === 'Trueques'
      ? 'Describe lo que ofreces y las condiciones de la permuta.'
      : 'Describe tu publicación.');
}

function publicationStatus(product) {
  return product.estado || 'aprobada';
}

function productConditionLabel(condition) {
  return ({
    nuevo: 'Nuevo',
    'usado-excelente': 'Usado: excelente estado',
    'usado-buen-estado': 'Usado: buen estado',
    'usado-aceptable': 'Usado: aceptable'
  })[condition] || '';
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
  const location = useLocation();
  const { categoria, subcategoria } = getProductCategory(product);
  const status = publicationStatus(product);
  const statusLabels = {
    pendiente: 'Pendiente de aprobación',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    pausada: 'Pausada'
  };

  const card = (
    <article className={`card shadow-sm h-100 ${mine ? 'card-publicacion' : 'card-producto'}`}>
      <img
        src={productImages(product)[0]}
        className="imagen-publicacion card-img-top"
        alt={product.nombre}
      />
      <div className="card-body">
        <span className="badge product-category-badge mb-2">
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
          <p className="product-card-trade fw-semibold mb-3">
            Se permuta por: {product.sePermutaPor}
          </p>
        )}
        {!mine && product.usuario?.nombre && (
          <p className="product-card-publisher text-muted">
            Publicado por {product.usuario.nombre}
          </p>
        )}
      </div>
      {mine && (
        <div className="card-footer bg-white border-0">
          <div className="d-grid gap-2 publication-card-actions">
            <Link className="btn btn-success" to={`/productos/${product._id}?origen=mis-publicaciones`}>
              Ver detalle
            </Link>
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
          </div>
        </div>
      )}
    </article>
  );

  return (
    <div className={mine ? 'col-12 col-sm-6 col-lg-3' : 'col'}>
      {mine
        ? card
        : (
          <Link
            className="product-card-link"
            to={`/productos/${product._id}`}
            state={{ returnTo: `${location.pathname}${location.search}` }}
            aria-label={`Ver detalle de ${product.nombre}`}
          >
            {card}
          </Link>
        )}
    </div>
  );
}

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = categoryNames.includes(searchParams.get('categoria'))
    ? searchParams.get('categoria')
    : 'Todos';
  const initialSubcategory = categorySubcategories[initialCategory]?.includes(
    searchParams.get('subcategoria')
  )
    ? searchParams.get('subcategoria')
    : 'Todas';
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [keyword, setKeyword] = useState('');
  const [dateOrder, setDateOrder] = useState('recent');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function saveCategoryFilters(nextCategory, nextSubcategory) {
    setSearchParams(currentParams => {
      const nextParams = new URLSearchParams(currentParams);
      if (nextCategory === 'Todos') {
        nextParams.delete('categoria');
      } else {
        nextParams.set('categoria', nextCategory);
      }

      if (nextCategory === 'Todos' || nextSubcategory === 'Todas') {
        nextParams.delete('subcategoria');
      } else {
        nextParams.set('subcategoria', nextSubcategory);
      }

      return nextParams;
    }, { replace: true });
  }

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
              const nextCategory = event.target.value;
              setCategory(nextCategory);
              setSubcategory('Todas');
              saveCategoryFilters(nextCategory, 'Todas');
            }}
          >
            <option value="Todos">Todos ({products.length})</option>
            {categoryNames.map(item => (
              <option key={item} value={item}>{item} ({counts[item] || 0})</option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
            <label className="form-label fw-semibold mb-0" htmlFor="subcategory-filter">Filtrar por subcategoría</label>
            <button
              type="button"
              className="subcategory-filter-clear"
              onClick={() => {
                setCategory('Todos');
                setSubcategory('Todas');
                saveCategoryFilters('Todos', 'Todas');
              }}
            >
              Limpiar filtro
            </button>
          </div>
          <select
            className="form-select"
            id="subcategory-filter"
            value={subcategory}
            disabled={category === 'Todos'}
            onChange={event => {
              const nextSubcategory = event.target.value;
              setSubcategory(nextSubcategory);
              saveCategoryFilters(category, nextSubcategory);
            }}
          >
            {category === 'Todos'
              ? <option value="Todas">Selecciona una categoría primero</option>
              : <>
                  <option value="Todas">Todas ({counts[category] || 0})</option>
                  {categorySubcategories[category].map(item => (
                    <option key={item} value={item}>{item} ({subcategoryCounts[item] || 0})</option>
                  ))}
                </>}
          </select>
        </div>
        {loading && <p role="status">Cargando publicaciones…</p>}
        <Feedback error={error} />
        {!loading && !error && (
          filtered.length
            ? <div className="row row-cols-2 row-cols-sm-3 row-cols-lg-4 row-cols-xl-5 g-4 product-list-grid">
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
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const fromMine = searchParams.get('origen') === 'mis-publicaciones';
  const fromAdmin = searchParams.get('origen') === 'admin';
  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showReferenceValue, setShowReferenceValue] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatError, setChatError] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setProduct(null);
    setShowReferenceValue(false);
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
  const canReview = fromAdmin && isAdmin && product?.estado === 'pendiente';
  const canContact = product &&
    (product.estado === 'aprobada' || product.estado === undefined);
  const images = product ? productImages(product) : [];
  const productCategory = product ? getProductCategory(product) : null;
  const productDetails = product
    ? getCategoryDetails(productCategory.categoria, productCategory.subcategoria)
    : null;

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

  async function reviewProduct(estado) {
    setReviewError('');
    let motivoRechazo = '';
    if (estado === 'rechazada') {
      const response = window.prompt('Indica el motivo del rechazo (máximo 500 caracteres):');
      if (response === null) return;
      motivoRechazo = response.trim();
      if (!motivoRechazo || motivoRechazo.length > 500) {
        setReviewError('Indica un motivo de rechazo de hasta 500 caracteres.');
        return;
      }
    }

    setReviewBusy(true);
    try {
      await apiRequest(`/api/admin/producto/${encodeURIComponent(id)}/revision`, {
        method: 'PATCH',
        body: JSON.stringify({ estado, motivoRechazo })
      });
      setProduct(current => current
        ? { ...current, estado, motivoRechazo }
        : current);
    } catch (requestError) {
      setReviewError(requestError.message);
    } finally {
      setReviewBusy(false);
    }
  }

  function returnToOrigin() {
    if (fromAdmin && location.state?.fromAdmin) {
      navigate(-1);
      return;
    }
    if (!fromAdmin && !fromMine && typeof location.state?.returnTo === 'string') {
      navigate(location.state.returnTo, { replace: true });
      return;
    }
    navigate(fromAdmin
      ? '/admin?seccion=publicaciones'
      : fromMine
        ? '/mis-publicaciones'
        : '/productos', { replace: fromAdmin });
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
                  <span className="badge product-category-badge product-detail-category-badge mb-3">
                    {productCategory.categoria}
                    {productCategory.subcategoria
                      ? ` · ${productCategory.subcategoria}`
                      : ''}
                  </span>
                  <h2 className="card-title">{product.nombre}</h2>
                  {product.usuario?.nombre && (
                    <p className="text-muted mb-3">
                      Publicado por {product.usuario.nombre}
                    </p>
                  )}
                  {productConditionLabel(product.condicion) && (
                    <p className="text-muted">
                      Condición: {productConditionLabel(product.condicion)}
                    </p>
                  )}
                  {(fromMine || isAdmin) && product.estado && product.estado !== 'aprobada' && (
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
                  <h2 className="h5">Descripción</h2>
                  <p className="text-muted">{product.descripcion}</p>
                  {product.detalleCategoria && (
                    <>
                      <h2 className="h5">{productDetails?.label || 'Detalles'}</h2>
                      <p className="text-muted">{product.detalleCategoria}</p>
                    </>
                  )}
                  <h2 className="h5">Comentario</h2>
                  <p>{product.comentario || 'Sin comentarios'}</p>
                  {showsEstimatedValue(productCategory.categoria, productCategory.subcategoria) &&
                    product.precio !== undefined && product.precio !== null && (
                    <div className="mt-4">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          id="show-reference-value"
                          type="checkbox"
                          checked={showReferenceValue}
                          onChange={event => setShowReferenceValue(event.target.checked)}
                        />
                        <label className="form-check-label" htmlFor="show-reference-value">
                          Mostrar valor referencial
                        </label>
                      </div>
                      {showReferenceValue && (
                        <p className="text-muted mt-2 mb-0">
                          Producto / Servicio evaluado en: {formatListingPrice(product.precio)}
                        </p>
                      )}
                    </div>
                  )}
                  <Feedback error={chatError} />
                  {canReview && <Feedback error={reviewError} />}
                  <div className="d-grid gap-2 mt-4">
                    {fromMine && (
                      <Link className="btn btn-warning" to={`/publicar/${product._id}/editar`}>
                        Editar publicación
                      </Link>
                    )}
                    {user && !isOwner && canContact && (
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
                    {canReview && (
                      <>
                        <button
                          className="btn btn-success"
                          type="button"
                          onClick={() => reviewProduct('aprobada')}
                          disabled={reviewBusy}
                        >
                          Aceptar
                        </button>
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => reviewProduct('rechazada')}
                          disabled={reviewBusy}
                        >
                          Rechazar
                        </button>
                      </>
                    )}
                    <button className="btn btn-dark" type="button" onClick={returnToOrigin}>
                      Volver
                    </button>
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
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState([]);
  const previewUrls = useRef(new Set());
  const [values, setValues] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria: '',
    subcategoria: '',
    sePermutaPor: '',
    condicion: '',
    detalleCategoria: '',
    comentario: ''
  });
  const validSubcategories = categorySubcategories[values.categoria] || [];
  const formDetails = getCategoryDetails(values.categoria, values.subcategoria);
  const formSubcategories = editing && values.subcategoria &&
    !validSubcategories.includes(values.subcategoria)
    ? [...validSubcategories, values.subcategoria]
    : validSubcategories;
  const selectedImages = selectedImagePreviews.map(preview => preview.file);
  const totalImageCount = existingImages.length + selectedImagePreviews.length;

  useEffect(() => {
    return () => {
      previewUrls.current.forEach(url => URL.revokeObjectURL(url));
      previewUrls.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!editing) return;
    apiRequest('/api/productos/mis-publicaciones')
      .then(products => {
        const product = products.find(item => item._id === id);
        if (!product) throw new Error('No se encontró la publicación en tu cuenta.');
        const productCategory = getProductCategory(product);
        setExistingImages(productImages(product));
        setValues({
          nombre: product.nombre || '',
          descripcion: product.descripcion || '',
          precio: product.precio ?? '',
          categoria: productCategory.categoria || '',
          subcategoria: productCategory.subcategoria || '',
          sePermutaPor: product.sePermutaPor || '',
          condicion: product.condicion || '',
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
        ? { subcategoria: '', sePermutaPor: '', condicion: '', detalleCategoria: '' }
        : {})
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!totalImageCount || (!editing && !selectedImages.length)) {
      setError('Debes agregar al menos una imagen.');
      return;
    }
    if (totalImageCount > 3) {
      setError('Puedes guardar como máximo 3 imágenes.');
      return;
    }
    setBusy(true);
    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    selectedImages.forEach(file => formData.append('imagenes', file));
    if (editing) {
      formData.append('imagenesMantener', JSON.stringify(existingImages));
    }
    try {
      await apiRequest(
        editing
          ? `/api/productos/mis-publicaciones/${encodeURIComponent(id)}`
          : '/api/productos',
        {
          method: editing ? 'PUT' : 'POST',
          body: formData
        }
      );
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
          condicion: '',
          detalleCategoria: '',
          comentario: ''
        });
        previewUrls.current.forEach(url => URL.revokeObjectURL(url));
        previewUrls.current.clear();
        setSelectedImagePreviews([]);
        setExistingImages([]);
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
            <section className="card shadow product-form-card">
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
                    {values.categoria === 'Trueques' && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="product-condition">Condición del producto</label>
                        <select
                          className="form-select"
                          id="product-condition"
                          name="condicion"
                          value={values.condicion}
                          onChange={update}
                          required
                        >
                          <option value="">Seleccione</option>
                          <option value="nuevo">Nuevo</option>
                          <option value="usado-excelente">Usado: excelente estado</option>
                          <option value="usado-buen-estado">Usado: buen estado</option>
                          <option value="usado-aceptable">Usado: aceptable</option>
                        </select>
                      </div>
                    )}
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
                        placeholder={descriptionPlaceholder(values.categoria, values.subcategoria)}
                        required
                      />
                    </div>
                    {showsEstimatedValue(values.categoria, values.subcategoria) && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="product-price">
                          Producto / Servicio evaluado en:
                        </label>
                        <input className="form-control" id="product-price" name="precio" type="number" min="0" step="1" value={values.precio} onChange={update} required />
                        <div className="form-text">Valor referencial; no se mostrará en el aviso.</div>
                      </div>
                    )}
                    {formDetails && (
                      <div className="mb-3">
                        <label className="form-label" htmlFor="product-category-details">
                          {values.categoria === 'Trueques' ? 'Características y/o detalles' : formDetails.label}
                        </label>
                        <textarea
                          className="form-control"
                          id="product-category-details"
                          name="detalleCategoria"
                          rows="3"
                          value={values.detalleCategoria}
                          onChange={update}
                          placeholder={formDetails.placeholder}
                        />
                      </div>
                    )}
                    <div className="mb-3">
                      <label className="form-label" htmlFor="product-comment">Comentario</label>
                      <textarea className="form-control" id="product-comment" name="comentario" rows="3" value={values.comentario} onChange={update} />
                    </div>
                    <div className="mb-4">
                      <label className="form-label" htmlFor="product-images">Fotos (máximo 3)</label>
                      <p className="form-text">
                        {totalImageCount} de 3 fotos agregadas. Puedes elegir más fotos en varias selecciones.
                      </p>
                      <input
                        className="form-control"
                        id="product-images"
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={totalImageCount >= 3}
                        onChange={event => {
                          const addedFiles = Array.from(event.target.files || []);
                          event.target.value = '';
                          if (totalImageCount + addedFiles.length > 3) {
                            setError(`Solo puedes agregar ${3 - totalImageCount} foto(s) más.`);
                            return;
                          }
                          setError('');
                          const previews = addedFiles.map(file => {
                            const url = URL.createObjectURL(file);
                            previewUrls.current.add(url);
                            return { file, url };
                          });
                          setSelectedImagePreviews(current => [...current, ...previews]);
                        }}
                      />
                      {Boolean(existingImages.length || selectedImagePreviews.length) && (
                        <div className="row row-cols-2 row-cols-sm-3 g-3 mt-1">
                          {existingImages.map((image, index) => (
                            <div className="col" key={`existing-${image}-${index}`}>
                              <div className="card h-100">
                                <img
                                  src={image}
                                  className="card-img-top"
                                  alt={`Foto existente ${index + 1}`}
                                  style={{ height: '140px', objectFit: 'cover' }}
                                />
                                <div className="card-body p-2">
                                  <button
                                    className="btn btn-outline-danger btn-sm w-100"
                                    type="button"
                                    onClick={() => setExistingImages(current =>
                                      current.filter((_, imageIndex) => imageIndex !== index)
                                    )}
                                  >
                                    Quitar foto
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {selectedImagePreviews.map((preview, index) => (
                            <div className="col" key={`selected-${preview.file.name}-${index}`}>
                              <div className="card h-100">
                                <img
                                  src={preview.url}
                                  className="card-img-top"
                                  alt={`Foto nueva ${index + 1}`}
                                  style={{ height: '140px', objectFit: 'cover' }}
                                />
                                <div className="card-body p-2">
                                  <button
                                    className="btn btn-outline-danger btn-sm w-100"
                                    type="button"
                                    onClick={() => {
                                      const preview = selectedImagePreviews[index];
                                      if (preview) {
                                        URL.revokeObjectURL(preview.url);
                                        previewUrls.current.delete(preview.url);
                                      }
                                      setSelectedImagePreviews(current =>
                                        current.filter((_, imageIndex) => imageIndex !== index)
                                      );
                                    }}
                                  >
                                    Quitar foto
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {editing && (
                        <small className="form-text text-muted">
                          Las fotos existentes se conservan. Puedes quitarlas o agregar fotos nuevas; los cambios se aplicarán al guardar.
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
