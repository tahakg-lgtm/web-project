import { state } from './state.js';

export function formatPrice(number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(number);
}

export function getCalculatedRating(product) {
  const userRating = state.userRatings[product.id];
  if (!userRating) return { avg: product.rating, count: product.ratingCount };

  const average = ((product.rating * product.ratingCount) + userRating) / (product.ratingCount + 1);
  return { avg: average, count: product.ratingCount + 1 };
}
