/**
 * Medusa Store application initialization and interaction handlers.
 */

import {
  applyFilters,
  filterByCategory,
  filterTopRated,
  renderCategories,
  resetAllFilters,
  updateRatingPillsUI,
  changePage
} from './catalog.js';
import { dom } from './dom.js';
import { loadStoredData, saveStoredData, state } from './state.js';
import {
  closeHeaderMenu,
  initTheme,
  showToast,
  updateCartUI,
  updateModalCartUI,
  updateModalStarsUI
} from './ui.js';
import { formatPrice, getCalculatedRating } from './utils.js';

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  initTheme();
  if (loadStoredData()) updateCartUI(state.cart.length);
  bindEvents();

  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch('data/products.json'),
      fetch('data/categories.json')
    ]);

    if (!productsResponse.ok || !categoriesResponse.ok) throw new Error('Data fetch failed');

    state.products = await productsResponse.json();
    state.categories = await categoriesResponse.json();

    renderCategories();
    applyFilters();
  } catch (error) {
    console.error('Initialization error:', error);
    dom.resultsCount.textContent = 'Failed to load catalog';
    dom.productsGrid.innerHTML = '';
  }
}

function bindEvents() {
  dom.search.addEventListener('input', event => {
    state.filters.search = event.target.value.toLowerCase().trim();
    dom.clearSearch.hidden = !state.filters.search;
    applyFilters();
  });

  dom.clearSearch.addEventListener('click', () => {
    dom.search.value = '';
    state.filters.search = '';
    dom.clearSearch.hidden = true;
    dom.search.focus();
    applyFilters();
  });

  dom.cartToggle.addEventListener('click', () => {
    state.filters.cartOnly = !state.filters.cartOnly;
    dom.cartToggle.setAttribute('aria-pressed', state.filters.cartOnly);
    applyFilters();
    if (state.filters.cartOnly) {
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    }
  });

  dom.scrollCatalog.addEventListener('click', () => {
    document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
  });

  dom.mobileMenuBtn.addEventListener('click', () => {
    const isOpen = !dom.headerMenu.hidden;
    dom.headerMenu.hidden = isOpen;
    dom.mobileMenuBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  document.addEventListener('click', event => {
    if (dom.headerMenu.hidden || event.target.closest('.nav-left')) return;
    closeHeaderMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || dom.headerMenu.hidden) return;
    closeHeaderMenu();
    dom.mobileMenuBtn.focus();
  });

  dom.categorySelect.addEventListener('change', event => {
    state.filters.category = event.target.value;
    applyFilters();
  });

  dom.priceRange.addEventListener('input', event => {
    state.filters.maxPrice = Number(event.target.value);
    dom.priceDisplay.textContent = formatPrice(state.filters.maxPrice);
    applyFilters();
  });

  dom.ratingFilters.addEventListener('click', event => {
    const button = event.target.closest('.rating-pill');
    if (!button) return;
    state.filters.minRating = Number(button.dataset.rating);
    updateRatingPillsUI();
    applyFilters();
  });

  dom.sortSelect.addEventListener('change', event => {
    state.filters.sort = event.target.value;
    applyFilters();
  });

  dom.resetFilters.addEventListener('click', resetAllFilters);
  dom.emptyClearBtn.addEventListener('click', resetAllFilters);

  dom.footer.addEventListener('click', event => {
    const categoryLink = event.target.closest('[data-footer-category]');
    const topRatedLink = event.target.closest('[data-footer-top-rated]');

    if (categoryLink) {
      filterByCategory(categoryLink.dataset.footerCategory);
    } else if (topRatedLink) {
      filterTopRated();
    }
  });

  dom.productsGrid.addEventListener('click', event => {
    const card = event.target.closest('.product-preview');
    const cartButton = event.target.closest('.product-cart');

    if (cartButton && card) {
      event.stopPropagation();
      toggleCartItem(Number(card.dataset.id));
      return;
    }

    if (card) openProductModal(Number(card.dataset.id));
  });

  if (dom.pagination) {
    dom.pagination.addEventListener('click', event => {
      const button = event.target.closest('.page-btn');
      if (!button || button.disabled) return;
      const page = Number(button.dataset.page);
      if (page) {
        changePage(page);
      }
    });
  }

  dom.modalClose.addEventListener('click', closeModal);
  dom.modal.addEventListener('click', event => {
    if (event.target === dom.modal) closeModal();
  });

  dom.modalCartBtn.addEventListener('click', () => {
    if (state.selectedProduct) toggleCartItem(state.selectedProduct.id);
  });

  dom.modalBuy.addEventListener('click', () => {
    if (state.selectedProduct) purchaseProducts([state.selectedProduct.id]);
  });

  dom.buyCartBtn.addEventListener('click', () => {
    purchaseProducts([...state.cart]);
  });

  dom.interactiveStars.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !state.selectedProduct) return;

    const rating = Number(button.dataset.star);
    state.userRatings[state.selectedProduct.id] = rating;
    saveStoredData();

    updateModalStarsUI(rating);
    dom.ratingFeedback.textContent = `You rated this ${rating} star${rating > 1 ? 's' : ''}.`;
    showToast('Rating saved offline.');
    applyFilters();
  });
}

function toggleCartItem(id) {
  const index = state.cart.indexOf(id);
  const product = state.products.find(item => item.id === id);

  if (index > -1) {
    state.cart.splice(index, 1);
    showToast(`Removed ${product?.name || 'item'} from cart`);
  } else {
    state.cart.push(id);
    showToast(`Added ${product?.name || 'item'} to cart`);
  }

  saveStoredData();
  updateCartUI(state.cart.length);

  if (state.filters.cartOnly) {
    applyFilters();
  } else {
    const cardButton = document.querySelector(`.product-preview[data-id="${id}"] .product-cart`);
    if (cardButton) cardButton.classList.toggle('active', index === -1);
    if (cardButton) cardButton.innerHTML = index === -1 ? '&#10003;' : '+';
    if (cardButton) cardButton.setAttribute('aria-label', index === -1 ? 'Remove from cart' : 'Add to cart');

    if (state.selectedProduct && state.selectedProduct.id === id) {
      updateModalCartUI(state.cart.includes(id));
    }
  }
}

function purchaseProducts(productIds) {
  if (!productIds.length) return;

  state.cart = state.cart.filter(id => !productIds.includes(id));
  saveStoredData();
  updateCartUI(state.cart.length);
  updateModalCartUI(state.selectedProduct ? state.cart.includes(state.selectedProduct.id) : false);
  applyFilters();
  showToast('Purchase completed.');
}

function openProductModal(id) {
  const product = state.products.find(item => item.id === id);
  if (!product) return;
  state.selectedProduct = product;

  const rating = getCalculatedRating(product);
  const isInCart = state.cart.includes(product.id);

  dom.modalImg.src = product.image;
  dom.modalImg.alt = product.name;
  dom.modalCat.textContent = product.category;
  dom.modalName.textContent = product.name;
  dom.modalDesc.textContent = product.description;
  dom.modalPrice.textContent = formatPrice(product.price);
  dom.modalRating.textContent = `${rating.avg.toFixed(1)} (${rating.count} reviews)`;
  dom.modalTags.innerHTML = (product.tags || []).map(tag => `<span>${tag}</span>`).join('');

  updateModalCartUI(isInCart);

  const userRating = state.userRatings[product.id] || 0;
  updateModalStarsUI(userRating);
  dom.ratingFeedback.textContent = userRating ? `You rated this ${userRating} star${userRating > 1 ? 's' : ''}.` : '';

  document.body.classList.add('modal-open');
  dom.modal.showModal();
}

function closeModal() {
  dom.modal.close();
  document.body.classList.remove('modal-open');
  state.selectedProduct = null;
}
