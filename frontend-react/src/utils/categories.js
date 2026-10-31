import categories from '../../../shared/categories.json';

const legacyCategories = {
  'Material Académico': 'Trueques',
  'Tecnología': 'Trueques',
  'Vivienda': 'Vivienda y arriendo de cabañas'
};
const legacySubcategories = {
  'Búsqueda de compañero de departamento': 'Búsqueda de compañera/o de piso',
  'Compra de libros usados': 'Libros',
  'Venta de libros usados': 'Libros',
  'Intercambio de libros': 'Libros',
  'Donación de libros': 'Libros',
  'Donación de materiales académicos': 'Libros',
  'Préstamo de libros': 'Libros'
};
export const categoryNames = Object.keys(categories);
export const categorySubcategories = categories;
export const categoryDetails = {
  'Trueques': {
    label: 'Detalles del producto y estado',
    placeholder: 'Describe el estado, accesorios incluidos u otros detalles relevantes.'
  },
  'Servicios Estudiantiles': {
    label: 'Detalles del servicio',
    placeholder: 'Indica el ramo, nivel, modalidad y disponibilidad.'
  },
  'Avisos y Oportunidades': {
    label: 'Detalles de la oportunidad',
    placeholder: 'Agrega fechas, requisitos, lugar o información para postular.'
  },
  'Objetos Perdidos y Encontrados': {
    label: 'Lugar y fecha',
    placeholder: 'Indica dónde y cuándo se perdió o encontró el objeto.'
  },
  'Vivienda y arriendo de cabañas': {
    label: 'Ubicación y condiciones',
    placeholder: 'Indica ubicación, disponibilidad, gastos y condiciones.'
  },
  'Comunidad y Recreación': {
    label: 'Detalles de la actividad',
    placeholder: 'Indica fecha, hora, lugar y cómo participar.'
  }
};

export function getCategoryDetails(category, subcategory) {
  const subcategoryDetails = {
    'Todo mascotas': {
      'Mascotas en adopción': {
        label: 'Información de la mascota',
        placeholder: 'Indica especie, edad aproximada, salud, vacunas, personalidad, requisitos de adopción y comuna.'
      },
      'Busco adoptar una mascota': {
        label: 'Mascota que buscas',
        placeholder: 'Indica especie, edad o tamaño aproximado y las condiciones del hogar que puedes ofrecer.'
      }
    },
    'Servicios Estudiantiles': {
      'Paseador de perros': {
        label: 'Detalles de los paseos',
        placeholder: 'Indica comuna o sector, disponibilidad, duración, tamaño de perros que paseas y tarifa.'
      },
      'Difusión de emprendimientos': {
        label: 'Datos del emprendimiento',
        placeholder: 'Indica el nombre del emprendimiento, qué productos o servicios ofrece, sus redes o medio de contacto y qué difusión buscas.'
      }
    }
  };

  return subcategoryDetails[category]?.[subcategory] || categoryDetails[category];
}

export function getProductCategory(product) {
  const categoria = legacyCategories[product.categoria] ||
    (categories.Trueques.includes(product.categoria) ||
      Object.hasOwn(legacySubcategories, product.categoria)
      ? 'Trueques'
      : product.categoria);
  if (categories[categoria]) {
    return {
      categoria,
      subcategoria: legacySubcategories[product.subcategoria] ||
        legacySubcategories[product.categoria] ||
        product.subcategoria ||
        (categories.Trueques.includes(product.categoria) ? product.categoria : '')
    };
  }

  return {
    categoria: product.categoria,
    subcategoria: product.subcategoria || ''
  };
}
