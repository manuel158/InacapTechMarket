import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/AuthContext.jsx';
import { SiteLayout } from '../components/SiteLayout.jsx';
import { apiRequest } from '../services/api.js';
import { categoryNames, getProductCategory } from '../utils/categories.js';

function productImage(product) {
  return product.imagenes?.[0] || product.imagen;
}

const carouselSlides = [
  {
    image: '/images/home/club-lectura.jpg',
    alt: 'Estudiantes reunidos compartiendo una sesión de lectura',
    eyebrow: 'Comunidad y recreación',
    title: 'Un espacio para compartir historias.',
    description: 'Encuentra actividades, conoce nuevos intereses y participa junto a la comunidad.'
  },
  {
    image: '/images/home/mascotas.jpg',
    alt: 'Perro y gato juntos sobre un fondo turquesa',
    eyebrow: 'Todo mascotas',
    title: 'Un nuevo hogar puede cambiarlo todo.',
    description: 'Conecta con personas que buscan dar o encontrar un hogar para una mascota.'
  },
  {
    image: '/images/home/trekking.jpg',
    alt: 'Grupo de excursionistas caminando por la montaña al atardecer',
    eyebrow: 'Comunidad y recreación',
    title: 'La próxima aventura se vive en comunidad.',
    description: 'Descubre actividades y comparte experiencias con otros estudiantes.'
  },
  {
    image: '/images/home/evento-musical.png',
    alt: 'Público disfrutando de un concierto en vivo',
    eyebrow: 'Eventos y comunidad',
    title: 'Conecta con lo que está pasando.',
    description: 'Explora eventos y oportunidades para participar en la vida estudiantil.'
  }
];

const categoryDescriptions = {
  'Trueques': 'Encuentra artículos para intercambiar con otros estudiantes.',
  'Servicios Estudiantiles': 'Ofrece tus habilidades o encuentra apoyo.',
  'Avisos y Oportunidades': 'Descubre oportunidades, prácticas y avisos.',
  'Objetos Perdidos y Encontrados': 'Ayuda a que los objetos vuelvan a sus dueños.',
  'Vivienda y arriendo de cabañas': 'Busca alojamiento y comparte alternativas.',
  'Comunidad y Recreación': 'Organiza actividades y conecta con la comunidad.',
  'Juegos': 'Encuentra juegos para compartir y disfrutar.',
  'Todo mascotas': 'Encuentra o ayuda a una mascota de la comunidad.'
};

const categoryImages = {
  'Trueques': {
    src: '/images/categories/trueques.svg',
    alt: 'Ilustración de artículos preparados para intercambiar'
  },
  'Servicios Estudiantiles': {
    src: '/images/categories/servicios-estudiantiles.svg',
    alt: 'Ilustración de un libro y lápiz para servicios estudiantiles'
  },
  'Avisos y Oportunidades': {
    src: '/images/categories/avisos-oportunidades.svg',
    alt: 'Ilustración de un panel con avisos y oportunidades'
  },
  'Objetos Perdidos y Encontrados': {
    src: '/images/categories/objetos-perdidos.svg',
    alt: 'Ilustración de una mochila y una lupa para objetos perdidos'
  },
  'Vivienda y arriendo de cabañas': {
    src: '/images/categories/vivienda.svg',
    alt: 'Ilustración de una vivienda para estudiantes'
  },
  'Comunidad y Recreación': {
    src: '/images/categories/comunidad-recreacion.svg',
    alt: 'Ilustración de estudiantes compartiendo una actividad'
  },
  'Juegos': {
    src: '/images/categories/juegos.svg',
    alt: 'Ilustración de dados y piezas de juego'
  },
  'Todo mascotas': {
    src: '/images/categories/mascotas.svg',
    alt: 'Ilustración de una mascota acompañada de una huella'
  }
};

const androidReleaseUrl = 'https://github.com/manuel158/InacapTechMarket/releases/latest/download/InacapTechMarket.apk';

export default function HomePage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeCategorySlide, setActiveCategorySlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listingsTrackRef = useRef(null);

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
  const listingCarouselProducts = newestProducts.length
    ? Array.from({ length: 10 }, (_, index) => newestProducts[index % newestProducts.length])
    : [];
  const featuredSlide = carouselSlides[activeSlide];
  const homeCategories = categoryNames;
  const activeCategory = homeCategories[activeCategorySlide];
  const activeCategoryImage = categoryImages[activeCategory];

  function moveSlide(direction) {
    setActiveSlide(current => (
      current + direction + carouselSlides.length
    ) % carouselSlides.length);
  }

  function moveCategorySlide(direction) {
    setActiveCategorySlide(current => (
      current + direction + homeCategories.length
    ) % homeCategories.length);
  }

  function moveListings(direction) {
    const track = listingsTrackRef.current;
    const firstSlide = track?.firstElementChild;
    if (!track || !firstSlide) return;

    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
    const slideOffset = firstSlide.getBoundingClientRect().width + gap;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const atStart = track.scrollLeft <= 1;
    const atEnd = maxScroll - track.scrollLeft <= 1;

    if (direction > 0 && atEnd) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction < 0 && atStart) {
      track.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: direction * slideOffset, behavior: 'smooth' });
    }
  }

  return (
    <SiteLayout>
      <main className="home-page">
        <section className="home-hero" aria-label="Publicaciones destacadas">
          <div className="container home-hero-content">
            <div className="home-hero-copy">
              <p className="home-hero-kicker">{featuredSlide.eyebrow}</p>
              <h1>{featuredSlide.title}</h1>
              <p className="home-hero-description">{featuredSlide.description}</p>
              <div className="home-hero-actions">
                <Link className="btn btn-light" to="/productos">
                  Explorar publicaciones
                </Link>
                <Link className="home-text-link home-button-link home-button-link-hero" to={user ? '/publicar' : '/registro'}>
                  {user ? 'Publicar ahora' : 'Únete a la comunidad'} <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div
              className={`home-hero-visual ${activeSlide === 1 ? 'home-hero-visual-pets' : ''}`}
              style={activeSlide === 1
                ? { '--home-hero-image': `url("${featuredSlide.image}")` }
                : undefined}
            >
              <div className="home-hero-glassboard" aria-hidden="true">
                <span className="home-board-pin home-board-pin-top" />
                <span className="home-board-pin home-board-pin-bottom" />
                <div className="home-board-header">PANEL DE AVISOS INACAP</div>
                <div className="home-board-image-frame">
                  <img src={featuredSlide.image} alt={featuredSlide.alt} />
                </div>
                <div className="home-board-note home-board-note-left">
                  <strong>Juntos</strong>
                  <span>hacemos<br />más <b>☺</b></span>
                </div>
                <div className="home-board-note home-board-note-right">
                  <strong>Ideas<br />personas<br />oportunidades</strong>
                </div>
                <div className="home-board-side-card">
                  <strong>EVENTO</strong>
                  <span>Tecnológico</span>
                  <small>Conecta con la comunidad</small>
                </div>
                <div className="home-board-lower-note">
                  <strong>BUSCA<br />INTEGRANTE</strong>
                  <small>Proyecto estudiantil</small>
                </div>
                <div className="home-board-bottom-note">
                  <strong>Se arriendan<br />piezas</strong>
                  <small>Para estudiantes</small>
                </div>
                <div className="home-board-extra-note home-board-trueque-note">
                  <strong>TRUEQUES</strong>
                  <span>Intercambia<br />y comparte</span>
                </div>
                <div className="home-board-extra-note home-board-cabin-note">
                  <strong>SE ARRIENDA</strong>
                  <span>Cabaña<br />para estudiantes</span>
                </div>
                <div className="home-board-extra-note home-board-gamer-note">
                  <strong>EVENTO GAMER</strong>
                  <span>Juega y<br />conecta</span>
                </div>
                <div className="home-board-extra-note home-board-notebook-note">
                  <strong>BUSCO NOTEBOOK</strong>
                  <span>Oferta o<br />trueque</span>
                </div>
                <div className="home-board-extra-note home-board-pet-note">
                  <strong>MASCOTA PERDIDA</strong>
                  <span>Ayuda a<br />encontrarla</span>
                </div>
                <div className="home-board-extra-note home-board-class-note">
                  <strong>CLASES</strong>
                  <span>Particulares<br />y apoyo</span>
                </div>
              </div>
              <img src={featuredSlide.image} alt={featuredSlide.alt} />
            </div>
          </div>
          <div className="home-carousel-controls">
            <div className="container home-carousel-inner">
              <button
                type="button"
                className="home-carousel-arrow"
                onClick={() => moveSlide(-1)}
                aria-label="Diapositiva anterior"
              >
                ←
              </button>
              <div className="home-carousel-dots" aria-label="Elegir diapositiva">
                {carouselSlides.map((slide, index) => (
                  <button
                    key={slide.image}
                    type="button"
                    className={`home-carousel-dot ${index === activeSlide ? 'active' : ''}`}
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Mostrar diapositiva ${index + 1}: ${slide.eyebrow}`}
                    aria-current={index === activeSlide ? 'true' : undefined}
                  />
                ))}
              </div>
              <button
                type="button"
                className="home-carousel-arrow"
                onClick={() => moveSlide(1)}
                aria-label="Siguiente diapositiva"
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

        <section className="container home-app-download" aria-label="Aplicación para Android">
          <div className="home-app-download-copy">
            <span className="home-app-download-icon" aria-hidden="true">↓</span>
            <div>
              <p className="home-eyebrow home-eyebrow-light">Disponible para Android</p>
              <h2>InacapTechMarket en tu teléfono</h2>
              <p>Inicia sesión con las mismas credenciales del sitio.</p>
            </div>
          </div>
          <a className="btn btn-primary" href={androidReleaseUrl}>
            Descargar APK
          </a>
        </section>

        <section
          className="container home-section home-listings home-community"
          aria-labelledby="home-community-title"
        >
          <div className="home-community-intro">
            <div className="home-community-copy">
              <p className="home-eyebrow home-community-eyebrow">Una comunidad que comparte</p>
              <h2 id="home-community-title">
                Lo que ya no necesitas puede ser justo lo que alguien busca.
              </h2>
              <p>
                Publica un trueque, ofrece un servicio o comparte una oportunidad con otros estudiantes.
              </p>
            </div>
            <Link className="btn home-community-cta" to={user ? '/publicar' : '/registro'}>
              {user ? 'Crear publicación' : 'Comienza ahora'}
            </Link>
          </div>
          <div className="home-section-heading">
            <h2 id="home-listings-title">Publicaciones recientes de la comunidad</h2>
          </div>
          {loading && <p role="status">Cargando publicaciones…</p>}
          {error && <p className="text-danger" role="status">{error}</p>}
          {!loading && !error && newestProducts.length > 0 && (
            <>
              <div
                className="home-listings-carousel"
                role="region"
                aria-roledescription="carrusel"
                aria-label="Diez publicaciones recientes"
              >
                <div className="home-listings-track" ref={listingsTrackRef}>
                  {listingCarouselProducts.map((product, index) => {
                    const { categoria, subcategoria } = getProductCategory(product);
                    return (
                      <article className="home-listing-slide" key={`${product._id}-${index}`}>
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
                            <Link className="home-card-link home-button-link" to={`/productos/${product._id}`}>
                              Ver detalle <span aria-hidden="true">→</span>
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
              <div className="home-listings-controls">
                <button
                  type="button"
                  className="home-carousel-arrow"
                  onClick={() => moveListings(-1)}
                  aria-label="Publicación anterior"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="home-carousel-arrow"
                  onClick={() => moveListings(1)}
                  aria-label="Siguiente publicación"
                >
                  →
                </button>
              </div>
            </>
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

        <section className="home-discover" aria-labelledby="home-discover-title">
          <div className="container home-discover-layout">
            <div className="home-discover-visual">
              <img
                src="/images/home/community-board.jpg"
                alt="Pizarrón turquesa con avisos de la comunidad estudiantil"
                loading="lazy"
              />
            </div>
            <div className="home-discover-content">
              <div className="home-section-heading">
                <h2 id="home-discover-title">
                  <span className="home-discover-title-accent">Todas las</span>{' '}
                  <span>categorías</span>
                </h2>
              </div>
              <article
                className="home-category-carousel"
                aria-roledescription="carrusel"
                aria-label="Categorías de publicaciones"
              >
                <div className="home-category-card" aria-live="polite">
                  <div className="home-category-image">
                    <img
                      src={activeCategoryImage.src}
                      alt={activeCategoryImage.alt}
                      loading="lazy"
                    />
                  </div>
                  <div className="home-category-copy">
                    <span className="home-category-number">
                      {String(activeCategorySlide + 1).padStart(2, '0')}
                    </span>
                    <h3>{activeCategory}</h3>
                    <p>
                      {categoryDescriptions[activeCategory] ||
                        'Descubre publicaciones de esta categoría.'}
                    </p>
                    <Link className="home-category-link home-button-link" to="/productos">
                      Ver publicaciones <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
                <div className="home-category-controls">
                  <button
                    type="button"
                    className="home-carousel-arrow"
                    onClick={() => moveCategorySlide(-1)}
                    aria-label="Categoría anterior"
                  >
                    ←
                  </button>
                  <div className="home-carousel-dots" aria-label="Elegir categoría">
                    {homeCategories.map((category, index) => (
                      <button
                        key={category}
                        type="button"
                        className={`home-carousel-dot ${index === activeCategorySlide ? 'active' : ''}`}
                        onClick={() => setActiveCategorySlide(index)}
                        aria-label={`Mostrar categoría ${category}`}
                        aria-current={index === activeCategorySlide ? 'true' : undefined}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="home-carousel-arrow"
                    onClick={() => moveCategorySlide(1)}
                    aria-label="Siguiente categoría"
                  >
                    →
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
