const CARD_SELECTOR = '[data-assessment-product-card]';
const SWATCH_SELECTOR = '[data-swatch-button]';
const LINK_SELECTOR = '[data-product-link]';

/**
 * @param {HTMLElement} card
 * @returns {Record<string, any> | null}
 */
function getVariantMap(card) {
  if (card.__assessmentVariantMap) return card.__assessmentVariantMap;

  const jsonElement = card.querySelector('[data-variant-json]');
  if (!jsonElement) return null;

  try {
    const parsed = JSON.parse(jsonElement.textContent || '{}');
    card.__assessmentVariantMap = parsed;
    return parsed;
  } catch (error) {
    console.error('Invalid variant JSON for assessment product card', error);
    return null;
  }
}

/**
 * @param {HTMLElement} card
 * @param {string} variantId
 */
function setVariant(card, variantId) {
  const variantMap = getVariantMap(card);
  if (!variantMap) return;

  const variant = variantMap[String(variantId)];
  if (!variant) return;

  card.dataset.selectedVariantId = String(variant.id);
  card.dataset.onSale = variant.onSale ? 'true' : 'false';

  const productLinks = card.querySelectorAll(LINK_SELECTOR);
  for (const link of productLinks) {
    if (link instanceof HTMLAnchorElement && variant.url) {
      link.href = variant.url;
    }
  }

  const primaryImage = card.querySelector('[data-primary-image]');
  const secondaryImage = card.querySelector('[data-secondary-image]');

  if (primaryImage instanceof HTMLImageElement) {
    if (variant.primaryImage) {
      primaryImage.src = variant.primaryImage;
    }
    primaryImage.alt = variant.primaryAlt || '';
  }

  if (secondaryImage instanceof HTMLImageElement) {
    if (variant.secondaryImage) {
      secondaryImage.src = variant.secondaryImage;
      secondaryImage.alt = variant.secondaryAlt || '';
      secondaryImage.classList.remove('hidden');
      primaryImage?.classList.add('has-secondary');
    } else {
      secondaryImage.removeAttribute('src');
      secondaryImage.removeAttribute('srcset');
      secondaryImage.alt = '';
      secondaryImage.classList.add('hidden');
      primaryImage?.classList.remove('has-secondary');
    }
  }

  const comparePrice = card.querySelector('[data-compare-price]');
  const currentPrice = card.querySelector('[data-current-price]');

  if (comparePrice) {
    comparePrice.textContent = variant.onSale ? variant.compareAtPrice : '';
  }

  if (currentPrice) {
    currentPrice.textContent = variant.price || '';
  }

  const swatchButtons = card.querySelectorAll(SWATCH_SELECTOR);
  for (const swatchButton of swatchButtons) {
    const isActive = swatchButton.dataset.variantId === String(variant.id);
    swatchButton.dataset.active = isActive ? 'true' : 'false';
    swatchButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
}

/**
 * @param {HTMLElement} card
 */
function initializeCard(card) {
  const requestedVariantId = card.dataset.selectedVariantId;
  const variantMap = getVariantMap(card);

  if (!variantMap) return;

  if (requestedVariantId && variantMap[requestedVariantId]) {
    setVariant(card, requestedVariantId);
    return;
  }

  const fallbackVariantId = Object.keys(variantMap)[0];
  if (fallbackVariantId) {
    setVariant(card, fallbackVariantId);
  }
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const swatchButton = target?.closest(SWATCH_SELECTOR);

  if (!(swatchButton instanceof HTMLElement)) return;

  const card = swatchButton.closest(CARD_SELECTOR);
  if (!(card instanceof HTMLElement)) return;

  const { variantId } = swatchButton.dataset;
  if (!variantId) return;

  setVariant(card, variantId);
});

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll(CARD_SELECTOR);
  for (const card of cards) {
    if (!(card instanceof HTMLElement)) continue;
    initializeCard(card);
  }
});
