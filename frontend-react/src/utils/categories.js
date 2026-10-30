import categories from '../../../shared/categories.json';

const legacyCategories = {
  'Material Académico': 'Trueques',
  'Tecnología': 'Trueques',
  'Vivienda': 'Vivienda y arriendo de cabañas'
};
const legacySubcategories = {
  'Búsqueda de compañero de departamento': 'Búsqueda de compañera/o de piso'
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

export function getProductCategory(product) {
  const categoria = legacyCategories[product.categoria] ||
    (categories.Trueques.includes(product.categoria) ? 'Trueques' : product.categoria);
  if (categories[categoria]) {
    return {
      categoria,
      subcategoria: legacySubcategories[product.subcategoria] || product.subcategoria ||
        (categories.Trueques.includes(product.categoria) ? product.categoria : '')
    };
  }

  return {
    categoria: product.categoria,
    subcategoria: product.subcategoria || ''
  };
}
