export const STORAGE_KEYS = {
  theme: 'medusa_theme_pref',
  cart: 'medusa_cart_items',
  legacyFavorites: 'medusa_favorites_list',
  ratings: 'medusa_user_ratings'
};

const DEFAULT_FILTERS = {
  search: '',
  category: 'all',
  maxPrice: 2500,
  minRating: 0,
  sort: 'featured',
  cartOnly: false
};

export const state = {
  products: [],
  categories: [],
  filters: createDefaultFilters(),
  cart: [],
  userRatings: {},
  selectedProduct: null,
  currentPage: 1,
  filteredProducts: []
};

export function createDefaultFilters() {
  return { ...DEFAULT_FILTERS };
}

export function loadStoredData() {
  try {
    const cart = localStorage.getItem(STORAGE_KEYS.cart) || localStorage.getItem(STORAGE_KEYS.legacyFavorites);
    if (cart) state.cart = JSON.parse(cart);

    const ratings = localStorage.getItem(STORAGE_KEYS.ratings);
    if (ratings) state.userRatings = JSON.parse(ratings);

    return true;
  } catch (error) {
    console.warn('Local storage error', error);
    return false;
  }
}

export function saveStoredData() {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(state.cart));
  localStorage.setItem(STORAGE_KEYS.ratings, JSON.stringify(state.userRatings));
}
