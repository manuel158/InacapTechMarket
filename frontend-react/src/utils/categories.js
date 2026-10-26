import categories from '../../../shared/categories.json';

const legacyTechnologySubcategories = categories.Tecnología;

export const categoryNames = Object.keys(categories);
export const categorySubcategories = categories;

export function getProductCategory(product) {
  if (categories[product.categoria]) {
    return {
      categoria: product.categoria,
      subcategoria: product.subcategoria || ''
    };
  }

  if (legacyTechnologySubcategories.includes(product.categoria)) {
    return {
      categoria: 'Tecnología',
      subcategoria: product.subcategoria || product.categoria
    };
  }

  return {
    categoria: product.categoria,
    subcategoria: product.subcategoria || ''
  };
}
