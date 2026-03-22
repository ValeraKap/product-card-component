const CARD_SELECTOR = '[data-assessment-product-card]';
const SWATCH_SELECTOR = '[data-swatch-button]';
const SWATCH_LIST_SELECTOR = '[data-swatch-list]';
const LINK_SELECTOR = '[data-product-link]';
const MEDIA_FRAME_SELECTOR = '.assessment-media-frame[data-product-link]';
const SALE_BADGE_TRIGGER_SELECTOR = '[data-sale-badge-trigger]';
const SALE_BADGE_TOOLTIP_SELECTOR = '[data-sale-badge-tooltip]';
const SALE_TOOLTIP_TIMEOUT_MS = 2200;
const SWIPE_THRESHOLD_PX = 36;
const SWIPE_VERTICAL_RATIO = 1.1;
const SWIPE_SUPPRESS_CLICK_MS = 350;
const saleBadgeTooltipTimers = new WeakMap();

/**
 * @param {HTMLElement} card
 */
function positionSaleBadgeTooltip(card) {
  const saleBadgeTrigger = card.querySelector(SALE_BADGE_TRIGGER_SELECTOR);
  const saleBadgeTooltip = card.querySelector(SALE_BADGE_TOOLTIP_SELECTOR);
  if (!(saleBadgeTrigger instanceof HTMLElement) || !(saleBadgeTooltip instanceof HTMLElement)) return;

  const triggerRect = saleBadgeTrigger.getBoundingClientRect();
  const tooltipHeight = saleBadgeTooltip.offsetHeight || 28;
  const horizontalCenter = triggerRect.left + triggerRect.width / 2;
  const preferredTop = triggerRect.top - tooltipHeight - 12;
  const shouldPlaceBottom = preferredTop < 8;

  saleBadgeTooltip.style.left = `${horizontalCenter}px`;
  saleBadgeTooltip.style.top = shouldPlaceBottom ? `${triggerRect.bottom}px` : `${triggerRect.top}px`;
  saleBadgeTooltip.dataset.placement = shouldPlaceBottom ? 'bottom' : 'top';
}

/**
 * @param {HTMLElement} card
 */
function isSaleBadgeTooltipVisible(card) {
  const saleBadgeTooltip = card.querySelector(SALE_BADGE_TOOLTIP_SELECTOR);
  return saleBadgeTooltip instanceof HTMLElement && saleBadgeTooltip.classList.contains('is-visible');
}

/**
 * Hide all sale badge tooltips.
 */
function hideAllSaleBadgeTooltips() {
  const cards = document.querySelectorAll(CARD_SELECTOR);
  for (const card of cards) {
    if (card instanceof HTMLElement) {
      hideSaleBadgeTooltip(card);
    }
  }
}

/**
 * @param {HTMLElement} card
 */
function hideSaleBadgeTooltip(card) {
  const saleBadgeTrigger = card.querySelector(SALE_BADGE_TRIGGER_SELECTOR);
  const saleBadgeTooltip = card.querySelector(SALE_BADGE_TOOLTIP_SELECTOR);

  if (saleBadgeTrigger instanceof HTMLElement) {
    saleBadgeTrigger.setAttribute('aria-expanded', 'false');
  }

  if (saleBadgeTooltip instanceof HTMLElement) {
    saleBadgeTooltip.classList.remove('is-visible');
    saleBadgeTooltip.setAttribute('aria-hidden', 'true');
    saleBadgeTooltip.removeAttribute('data-placement');
  }

  const activeTimer = saleBadgeTooltipTimers.get(card);
  if (activeTimer) {
    window.clearTimeout(activeTimer);
    saleBadgeTooltipTimers.delete(card);
  }
}

/**
 * @param {HTMLElement} card
 */
function showSaleBadgeTooltip(card) {
  const saleBadgeTrigger = card.querySelector(SALE_BADGE_TRIGGER_SELECTOR);
  const saleBadgeTooltip = card.querySelector(SALE_BADGE_TOOLTIP_SELECTOR);

  if (!(saleBadgeTrigger instanceof HTMLElement) || !(saleBadgeTooltip instanceof HTMLElement)) return;
  if (card.dataset.saleBadgeVisible === 'false') return;

  hideSaleBadgeTooltip(card);
  positionSaleBadgeTooltip(card);
  saleBadgeTrigger.setAttribute('aria-expanded', 'true');
  saleBadgeTooltip.classList.add('is-visible');
  saleBadgeTooltip.setAttribute('aria-hidden', 'false');

  const timerId = window.setTimeout(() => {
    hideSaleBadgeTooltip(card);
  }, SALE_TOOLTIP_TIMEOUT_MS);

  saleBadgeTooltipTimers.set(card, timerId);
}

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
 * @param {{ commit?: boolean }} [options]
 */
function setVariant(card, variantId, options = {}) {
  const { commit = true } = options;
  const variantMap = getVariantMap(card);
  if (!variantMap) return;

  const variant = variantMap[String(variantId)];
  if (!variant) return;
  const fallbackAlt = card.dataset.productTitle || 'Product image';

  if (commit) {
    card.dataset.selectedVariantId = String(variant.id);
    card.dataset.committedVariantId = String(variant.id);
  }
  card.dataset.onSale = variant.onSale ? 'true' : 'false';
  const saleBadgeMode = (card.dataset.saleBadgeMode || 'default').toLowerCase();
  const manualSaleBadgeEnabled = card.dataset.manualSaleBadge === 'true';
  let saleBadgeVisible = variant.onSale || manualSaleBadgeEnabled;

  if (saleBadgeMode === 'force_show') {
    saleBadgeVisible = true;
  } else if (saleBadgeMode === 'force_hide') {
    saleBadgeVisible = false;
  }

  card.dataset.saleBadgeVisible = saleBadgeVisible ? 'true' : 'false';
  if (!saleBadgeVisible) {
    hideSaleBadgeTooltip(card);
  }

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
    if (variant.primarySrcset) {
      primaryImage.srcset = variant.primarySrcset;
    } else {
      primaryImage.removeAttribute('srcset');
    }
    primaryImage.alt = variant.primaryAlt || fallbackAlt;
  }

  if (secondaryImage instanceof HTMLImageElement) {
    if (variant.secondaryImage) {
      secondaryImage.src = variant.secondaryImage;
      if (variant.secondarySrcset) {
        secondaryImage.srcset = variant.secondarySrcset;
      } else {
        secondaryImage.removeAttribute('srcset');
      }
      secondaryImage.alt = variant.secondaryAlt || fallbackAlt;
      secondaryImage.classList.remove('hidden');
      primaryImage?.classList.add('has-secondary');
    } else {
      secondaryImage.removeAttribute('src');
      secondaryImage.removeAttribute('srcset');
      secondaryImage.alt = fallbackAlt;
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
  if (commit) {
    for (const swatchButton of swatchButtons) {
      const isActive = swatchButton.dataset.variantId === String(variant.id);
      swatchButton.dataset.active = isActive ? 'true' : 'false';
      swatchButton.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
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
    card.dataset.committedVariantId = requestedVariantId;
    setVariant(card, requestedVariantId);
    return;
  }

  const fallbackVariantId = Object.keys(variantMap)[0];
  if (fallbackVariantId) {
    card.dataset.committedVariantId = fallbackVariantId;
    setVariant(card, fallbackVariantId);
  }
}

function canUseHoverPreview() {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * @returns {boolean}
 */
function canUseTouchSwipe() {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

/**
 * @param {HTMLElement} card
 * @returns {string[]}
 */
function getSwipeVariantIds(card) {
  const swatchButtons = Array.from(card.querySelectorAll(SWATCH_SELECTOR));
  const swatchIds = [];
  const seen = new Set();

  for (const swatchButton of swatchButtons) {
    const variantId = swatchButton.dataset.variantId;
    if (!variantId || seen.has(variantId)) continue;
    seen.add(variantId);
    swatchIds.push(variantId);
  }

  if (swatchIds.length > 0) return swatchIds;

  const variantMap = getVariantMap(card);
  return variantMap ? Object.keys(variantMap) : [];
}

/**
 * @param {HTMLElement} card
 * @param {number} step
 */
function swipeToSiblingVariant(card, step) {
  const variantIds = getSwipeVariantIds(card);
  if (variantIds.length < 2) return;

  const currentVariantId = card.dataset.committedVariantId || card.dataset.selectedVariantId || variantIds[0];
  const currentIndex = Math.max(0, variantIds.indexOf(String(currentVariantId)));
  const nextIndex = (currentIndex + step + variantIds.length) % variantIds.length;
  const nextVariantId = variantIds[nextIndex];
  if (!nextVariantId) return;

  setVariant(card, nextVariantId);
}

/**
 * @param {HTMLElement} card
 */
function bindTouchSwipe(card) {
  if (!canUseTouchSwipe()) return;
  if (card.dataset.swipeBound === 'true') return;

  const mediaFrame = card.querySelector(MEDIA_FRAME_SELECTOR);
  if (!(mediaFrame instanceof HTMLElement)) return;

  card.dataset.swipeBound = 'true';

  const swipeState = {
    startX: 0,
    startY: 0,
    active: false,
    suppressClickUntil: 0,
  };

  mediaFrame.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches.length !== 1) {
        swipeState.active = false;
        return;
      }
      const touch = event.touches[0];
      swipeState.startX = touch.clientX;
      swipeState.startY = touch.clientY;
      swipeState.active = true;
    },
    { passive: true }
  );

  mediaFrame.addEventListener(
    'touchend',
    (event) => {
      if (!swipeState.active || event.changedTouches.length !== 1) return;
      swipeState.active = false;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - swipeState.startX;
      const deltaY = touch.clientY - swipeState.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX < SWIPE_THRESHOLD_PX) return;
      if (absX <= absY * SWIPE_VERTICAL_RATIO) return;

      swipeToSiblingVariant(card, deltaX < 0 ? 1 : -1);
      swipeState.suppressClickUntil = Date.now() + SWIPE_SUPPRESS_CLICK_MS;
    },
    { passive: true }
  );

  mediaFrame.addEventListener(
    'click',
    (event) => {
      if (Date.now() < swipeState.suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true
  );
}

document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const swatchButton = target?.closest(SWATCH_SELECTOR);

  if (swatchButton instanceof HTMLElement) {
    const card = swatchButton.closest(CARD_SELECTOR);
    if (!(card instanceof HTMLElement)) return;

    const { variantId } = swatchButton.dataset;
    if (!variantId) return;

    setVariant(card, variantId);
    return;
  }

  const saleBadgeTrigger = target?.closest(SALE_BADGE_TRIGGER_SELECTOR);
  if (saleBadgeTrigger instanceof HTMLElement) {
    const card = saleBadgeTrigger.closest(CARD_SELECTOR);
    if (!(card instanceof HTMLElement)) return;

    if (isSaleBadgeTooltipVisible(card)) {
      hideSaleBadgeTooltip(card);
    } else {
      showSaleBadgeTooltip(card);
    }
    return;
  }

  hideAllSaleBadgeTooltips();
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  hideAllSaleBadgeTooltips();
});

window.addEventListener('resize', () => {
  const cards = document.querySelectorAll(CARD_SELECTOR);
  for (const card of cards) {
    if (!(card instanceof HTMLElement) || !isSaleBadgeTooltipVisible(card)) continue;
    positionSaleBadgeTooltip(card);
  }
});

window.addEventListener(
  'scroll',
  () => {
    hideAllSaleBadgeTooltips();
  },
  { passive: true }
);

document.addEventListener('mouseover', (event) => {
  if (!canUseHoverPreview()) return;

  const target = event.target instanceof Element ? event.target : null;
  const swatchButton = target?.closest(SWATCH_SELECTOR);
  if (!(swatchButton instanceof HTMLElement)) return;

  const card = swatchButton.closest(CARD_SELECTOR);
  if (!(card instanceof HTMLElement)) return;

  const { variantId } = swatchButton.dataset;
  if (!variantId) return;

  setVariant(card, variantId, { commit: false });
});

document.addEventListener('mouseout', (event) => {
  if (!canUseHoverPreview()) return;

  const target = event.target instanceof Element ? event.target : null;
  const relatedTarget = event.relatedTarget instanceof Element ? event.relatedTarget : null;
  const swatchList = target?.closest(SWATCH_LIST_SELECTOR);
  if (!(swatchList instanceof HTMLElement)) return;
  if (relatedTarget && swatchList.contains(relatedTarget)) return;

  const card = swatchList.closest(CARD_SELECTOR);
  if (!(card instanceof HTMLElement)) return;

  const committedVariantId = card.dataset.committedVariantId || card.dataset.selectedVariantId;
  if (!committedVariantId) return;

  setVariant(card, committedVariantId, { commit: false });
});

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll(CARD_SELECTOR);
  for (const card of cards) {
    if (!(card instanceof HTMLElement)) continue;
    initializeCard(card);
    bindTouchSwipe(card);
  }
});
