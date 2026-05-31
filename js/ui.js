import { dom } from './dom.js';
import { STORAGE_KEYS } from './state.js';

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme);
  const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (systemPreference ? 'dark' : 'light'));

  dom.themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE_KEYS.theme, next);
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const lightIcon = dom.themeToggle.querySelector('.theme-icon-light');
  const darkIcon = dom.themeToggle.querySelector('.theme-icon-dark');
  if (theme === 'dark') {
    lightIcon.style.display = 'none';
    darkIcon.style.display = 'block';
  } else {
    lightIcon.style.display = 'block';
    darkIcon.style.display = 'none';
  }
}

export function closeHeaderMenu() {
  dom.headerMenu.hidden = true;
  dom.mobileMenuBtn.setAttribute('aria-expanded', 'false');
}

export function updateCartUI(count) {
  dom.cartCount.textContent = count;
}

export function updateModalCartUI(isInCart) {
  dom.modalCartBtn.classList.toggle('btn-secondary', isInCart);
  dom.modalCartBtn.classList.toggle('btn-primary', !isInCart);
  dom.modalCartText.textContent = isInCart ? 'Remove from cart' : 'Add to cart';
}

export function updateModalStarsUI(rating) {
  const buttons = dom.interactiveStars.querySelectorAll('button');
  buttons.forEach(button => {
    button.classList.toggle('active', Number(button.dataset.star) <= rating);
  });
}

export function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
  }, 2500);

  setTimeout(() => {
    if (toast.parentElement) toast.parentElement.removeChild(toast);
  }, 2800);
}
