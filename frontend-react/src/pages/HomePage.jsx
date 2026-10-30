import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/AuthContext.jsx';
import { SiteLayout } from '../components/SiteLayout.jsx';
import { apiRequest, formatPrice } from '../services/api.js';
import { categoryNames, getProductCategory } from '../utils/categories.js';

function productImage(product) {
  return product.imagenes?.[0] || product.imagen;
}

const categoryDescriptions = {
  'Trueques': 'Encuentra artículos para intercambiar con otros estudiantes.',
  'Servicios Estudiantiles': 'Ofrece tus habilidades o encuentra apoyo.',
  'Avisos y Oportunidades': 'Descubre oportunidades, prácticas y avisos.',
  'Objetos Perdidos y Encontrados': 'Ayuda a que los objetos vuelvan a sus dueños.',
  'Vivienda y arriendo de cabañas': 'Busca alojamiento y comparte alternativas.',
  'Comunidad y Recreación': 'Organiza actividades y conecta con la comunidad.'
};

export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest('/api/productos')
      .then(data => {
        if (!Array.isArray(data)) {
          throw new Error('La respuesta no contiene una lista de publicaciones.');
        }
        setProducts(data);
      })
      .catch(requestError => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const newestProducts = [...products].sort(
    (left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0)
  );
  const slides = newestProducts.slice(0, 3);
  const featuredProduct = slides[activeSlide];
  const homeCategories = categoryNames.slice(0, 4);

  function moveSlide(direction) {
    setActiveSlide(current => (current + direction + slides.length) % slides.length);
  }

  return (
    <SiteLayout>
      <main className="home-page">
        <section className="home-hero" aria-label="Publicaciones destacadas">
          <div className="container home-hero-content">
            <div className="home-hero-copy">
              <p className="home-eyebrow">La comunidad INACAP, más conectada</p>
              {featuredProduct ? (
                <>
                  <p className="home-hero-kicker">Destacado de la comunidad</p>
                  <h1>{featuredProduct.nombre}</h1>
                  <p className="home-hero-description">
                    {featuredProduct.descripcion || 'Descubre esta publicación y conecta con su autor.'}
                  </p>
                  <div className="home-hero-actions">
                    <Link className="btn btn-light" to={`/productos/${featuredProduct._id}`}>
                      Ver publicación
                    </Link>
                    <Link className="home-text-link" to="/productos">
                      Explorar publicaciones <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="home-hero-kicker">Comparte, encuentra e intercambia</p>
                  <h1>Tu comunidad tiene mucho para compartir.</h1>
                  <p className="home-hero-description">
                    Encuentra productos, servicios y nuevas oportunidades en un solo lugar.
                  </p>
                  <div className="home-hero-actions">
                    <Link className="btn btn-light" to="/productos">Explorar publicaciones</Link>
                    <Link className="home-text-link" to={user ? '/publicar' : '/registro'}>
                      {user ? 'Publicar ahora' : 'Únete a la comunidad'} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
            <div className={`home-hero-visual ${featuredProduct ? '' : 'home-hero-visual-empty'}`}>
              {featuredProduct && productImage(featuredProduct) ? (
                <>
                  <img src={productImage(featuredProduct)} alt={featuredProduct.nombre} />
                  <div className="home-hero-image-caption">
                    <span>{getProductCategory(featuredProduct).categoria}</span>
                    {featuredProduct.precio !== undefined && featuredProduct.precio !== null && (
                      <strong>{Number(featuredProduct.precio) === 0
                        ? 'Gratis / sin costo'
                        : formatPrice(featuredProduct.precio)}</strong>
                    )}
                  </div>
                </>
              ) : (
                <div className="home-hero-art" aria-hidden="true">
                  <span className="home-art-orbit home-art-orbit-one" />
                  <span className="home-art-orbit home-art-orbit-two" />
                  <span className="home-art-tile home-art-tile-one">T</span>
                  <span className="home-art-tile home-art-tile-two">+</span>
                  <span className="home-art-tile home-art-tile-three">↗</span>
                  <span className="home-art-caption">Conecta · Comparte · Crece</span>
                </div>
              )}
            </div>
          </div>
          <div className="home-carousel-controls">
            <div className="container home-carousel-inner">
              <button
                type="button"
                className="home-carousel-arrow"
                onClick={() => moveSlide(-1)}
                disabled={slides.length < 2}
                aria-label="Publicación destacada anterior"
              >
                ←
              </button>
              <div className="home-carousel-dots" aria-label="Elegir publicación destacada">
                {slides.map((product, index) => (
                  <button
                    key={product._id}
                    type="button"
                    className={`home-carousel-dot ${index === activeSlide ? 'active' : ''}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Mostrar publicación ${index + 1}: ${product.nombre}`}
                    aria-current={index === activeSlide ? 'true' : undefined}
                  />
                ))}
                {!slides.length && <span className="home-carousel-dot active" />}
              </div>
              <button
                type="button"
                className="home-carousel-arrow"
                onClick={() => moveSlide(1)}
                disabled={slides.length < 2}
                aria-label="Siguiente publicación destacada"
              >
                →
              </button>
            </div>
          </div>
        </section>

        <section className="container home-shortcuts" aria-label="Accesos rápidos">
          <Link to="/productos">
            <span className="home-shortcut-icon" aria-hidden="true">⌕</span>
            Explorar publicaciones
          </Link>
          <Link to={user ? '/publicar' : '/registro'}>
            <span className="home-shortcut-icon" aria-hidden="true">＋</span>
            {user ? 'Publicar' : 'Únete a INACAP'}
          </Link>
          <Link to="/productos">
            <span className="home-shortcut-icon" aria-hidden="true">↗</span>
            Ver oportunidades
          </Link>
        </section>

        <section className="container home-section home-listings">
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow home-eyebrow-light">Lo último de la comunidad</p>
              <h2>Publicaciones recientes</h2>
            </div>
            <Link className="home-section-link" to="/productos">
              Ver todas <span aria-hidden="true">→</span>
            </Link>
          </div>
          {loading && <p role="status">Cargando publicaciones…</p>}
          {error && <p className="text-danger" role="status">{error}</p>}
          {!loading && !error && newestProducts.length > 0 && (
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
              {newestProducts.slice(0, 4).map(product => {
                const { categoria, subcategoria } = getProductCategory(product);
                return (
                  <article className="col" key={product._id}>
                    <div className="home-listing-card">
                      <Link
                        className="home-listing-image"
                        to={`/productos/${product._id}`}
                        aria-label={`Ver publicación: ${product.nombre}`}
                      >
                        {productImage(product)
                          ? <img src={productImage(product)} alt="" />
                          : <span className="home-listing-placeholder">{categoria}</span>}
                      </Link>
                      <div className="home-listing-body">
                        <span className="home-listing-category">
                          {categoria}{subcategoria ? ` · ${subcategoria}` : ''}
                        </span>
                        <h3>{product.nombre}</h3>
                        <p>{product.descripcion || 'Conoce más sobre esta publicación.'}</p>
                        <Link className="home-card-link" to={`/productos/${product._id}`}>
                          Ver detalle <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          {!loading && !error && !newestProducts.length && (
            <div className="home-empty-listings">
              <p>Todavía no hay publicaciones disponibles.</p>
              <Link to={user ? '/publicar' : '/registro'}>
                {user ? 'Crear la primera publicación' : 'Únete y comparte la primera'}
              </Link>
            </div>
          )}
        </section>

        <section className="container home-promo">
          <div className="home-promo-copy">
            <p className="home-eyebrow home-eyebrow-light">Una comunidad que comparte</p>
            <h2>Lo que ya no necesitas puede ser justo lo que alguien busca.</h2>
            <p>Publica un trueque, ofrece un servicio o comparte una oportunidad con otros estudiantes.</p>
            <Link className="btn btn-primary" to={user ? '/publicar' : '/registro'}>
              {user ? 'Crear publicación' : 'Comienza ahora'}
            </Link>
          </div>
          <div className="home-promo-visual" aria-hidden="true">
            <span className="home-promo-circle home-promo-circle-one" />
            <span className="home-promo-circle home-promo-circle-two" />
            <span className="home-promo-card home-promo-card-one">Intercambia</span>
            <span className="home-promo-card home-promo-card-two">Conecta</span>
          </div>
        </section>

        <section className="home-discover">
          <div className="container home-section">
            <div className="home-section-heading">
              <div>
                <p className="home-eyebrow home-eyebrow-light">Encuentra lo que necesitas</p>
                <h2>Explora la comunidad</h2>
              </div>
              <Link className="home-section-link" to="/productos">
                Explorar todo <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
              {homeCategories.map((category, index) => (
                <article className="col" key={category}>
                  <div className="home-category-card">
                    <span className="home-category-number">0{index + 1}</span>
                    <h3>{category}</h3>
                    <p>{categoryDescriptions[category] || 'Descubre publicaciones de esta categoría.'}</p>
                    <Link to="/productos">
                      Ver publicaciones <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
