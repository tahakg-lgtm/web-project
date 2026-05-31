import { dom } from './dom.js';
import { createDefaultFilters, state } from './state.js';
import { formatPrice, getCalculatedRating } from './utils.js';

export function renderCategories() {
  const options = state.categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('');
  dom.categorySelect.innerHTML = `<option value="all">All Categories</option>${options}`;
}

const PRODUCTS_PER_PAGE = 8;

export function applyFilters() {
  state.currentPage = 1;
  const filtered = state.products.filter(matchesActiveFilters);
  sortProducts(filtered);
  state.filteredProducts = filtered;
  renderProducts();
  renderActiveFilters();
  renderCartCheckout();
}

export function changePage(page) {
  state.currentPage = page;
  renderProducts();
  const catalog = document.getElementById('catalog');
  if (catalog) catalog.scrollIntoView({ behavior: 'smooth' });
}

function matchesActiveFilters(product) {
  const { search, category, maxPrice, minRating, cartOnly } = state.filters;
  const searchMatch = !search ||
    [product.name, product.category, product.description, ...(product.tags || [])].join(' ').toLowerCase().includes(search);
  const categoryMatch = category === 'all' || product.category === category;
  const priceMatch = product.price <= maxPrice;
  const ratingMatch = getCalculatedRating(product).avg >= minRating;
  const cartMatch = !cartOnly || state.cart.includes(product.id);

  return searchMatch && categoryMatch && priceMatch && ratingMatch && cartMatch;
}

function sortProducts(products) {
  products.sort((a, b) => {
    const ratingA = getCalculatedRating(a).avg;
    const ratingB = getCalculatedRating(b).avg;

    switch (state.filters.sort) {
      case 'price-asc': return a.price - b.price;
      case 'price-desc': return b.price - a.price;
      case 'rating': return ratingB - ratingA;
      case 'alphabetical': return a.name.localeCompare(b.name);
      case 'featured':
      default:
        if (ratingB !== ratingA) return ratingB - ratingA;
        return a.id - b.id;
    }
  });
}

function renderProducts() {
  const products = state.filteredProducts;
  dom.resultsCount.textContent = `${products.length} product${products.length !== 1 ? 's' : ''}`;

  if (products.length === 0) {
    dom.productsGrid.hidden = true;
    dom.emptyState.hidden = false;
    if (dom.pagination) dom.pagination.hidden = true;
    return;
  }

  dom.emptyState.hidden = true;
  dom.productsGrid.hidden = false;

  const startIndex = (state.currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = products.slice(startIndex, endIndex);

  dom.productsGrid.innerHTML = paginatedProducts.map(product => {
    const isInCart = state.cart.includes(product.id);
    const rating = getCalculatedRating(product);

    return `
      <div class="product-preview" data-id="${product.id}">
        <div class="product-thumbnail">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
          <button class="product-cart ${isInCart ? 'active' : ''}" aria-label="${isInCart ? 'Remove from cart' : 'Add to cart'}">
            ${isInCart ? '&#10003;' : '+'}
          </button>
          <img src="${product.image}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
          <div class="flex-col">
             <span class="product-title">${product.name}</span>
             <div class="product-rating-row">
               <span class="star-color">★</span>
               <span>${rating.avg.toFixed(1)}</span>
             </div>
          </div>
          <div class="product-price">
            ${formatPrice(product.price)}
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  renderPagination(products.length);
}

function renderPagination(totalItems) {
  if (!dom.pagination) return;
  const totalPages = Math.ceil(totalItems / PRODUCTS_PER_PAGE);
  
  if (totalPages <= 1) {
    dom.pagination.hidden = true;
    return;
  }
  
  dom.pagination.hidden = false;
  let html = '';
  
  html += `<button class="page-btn" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''}>Prev</button>`;
  
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  
  html += `<button class="page-btn" data-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? 'disabled' : ''}>Next</button>`;
  
  dom.pagination.innerHTML = html;
}

function renderActiveFilters() {
  const chips = [];
  if (state.filters.search) chips.push(`"${state.filters.search}"`);
  if (state.filters.category !== 'all') chips.push(state.filters.category);
  if (state.filters.maxPrice < 2500) chips.push(`Under ${formatPrice(state.filters.maxPrice)}`);
  if (state.filters.minRating > 0) chips.push(`${state.filters.minRating}+ Stars`);
  if (state.filters.cartOnly) chips.push('Cart');

  dom.activeFilters.innerHTML = chips.map(chip => `<span class="filter-chip">${chip} <button class="clear-btn">&times;</button></span>`).join('');
}

function renderCartCheckout() {
  const cartProducts = state.products.filter(product => state.cart.includes(product.id));
  const showCheckout = state.filters.cartOnly && cartProducts.length > 0;
  dom.cartCheckout.hidden = !showCheckout;

  if (!showCheckout) return;

  const total = cartProducts.reduce((sum, product) => sum + product.price, 0);
  dom.cartTotal.textContent = `${cartProducts.length} item${cartProducts.length !== 1 ? 's' : ''} - ${formatPrice(total)}`;
}

export function resetAllFilters() {
  state.filters = createDefaultFilters();

  dom.search.value = '';
  dom.clearSearch.hidden = true;
  dom.categorySelect.value = 'all';
  dom.priceRange.value = 2500;
  dom.priceDisplay.textContent = formatPrice(2500);
  dom.sortSelect.value = 'featured';
  dom.cartToggle.setAttribute('aria-pressed', 'false');

  updateRatingPillsUI();
  applyFilters();
}

export function updateRatingPillsUI() {
  const pills = dom.ratingFilters.querySelectorAll('.rating-pill');
  pills.forEach(pill => pill.classList.toggle('active', Number(pill.dataset.rating) === state.filters.minRating));
}

export function filterByCategory(category) {
  resetAllFilters();
  state.filters.category = category;
  dom.categorySelect.value = category;
  applyFilters();
}

export function filterTopRated() {
  resetAllFilters();
  state.filters.minRating = 4.5;
  state.filters.sort = 'rating';
  dom.sortSelect.value = 'rating';
  updateRatingPillsUI();
  applyFilters();
}
