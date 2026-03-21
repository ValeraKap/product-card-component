# Product Card Technical Assessment

Custom Shopify product card built from scratch in Dawn with TailwindCSS.

## Current Functionality

- Pixel-focused product card layout based on the provided Figma design.
- Sale badge supports both automatic sale detection (`compare_at_price > price`) and manual control via metafields:
  - `custom.sale_badge_text` (single line text): `Sale!` (default), examples: `Limited Offer`, `Final Sale`
  - `custom.sale_badge_enabled` (boolean): manual/forced badge activation even if there is no `compare_at_price`
- Variant swatches update selected variant image, secondary hover image, URL, and price.
- Product text supports display fallbacks for heading/title (including product type and optional metafields).
- `Plain T-shirt` is currently sourced from `Product type`; if needed, this can be overridden via metafields.

## Implemented User Stories

- Sale state: displays `On Sale!` badge and markdown price (`compare_at_price` + sale price).
- Variant swatches: clicking a color swatch switches variant imagery, URL, and pricing.
- Variant hover image: hover over card image shows the secondary image for the selected variant.
- Product info: brand (`product.vendor`), title, and pricing are rendered on every card.

## Tech Stack

- Shopify Dawn (headed environment)
- Liquid snippets and blocks
- TailwindCSS (compiled to `assets/tailwind.css`)
- Vanilla JS module for client-side variant switching

## Local Setup

1. Install dependencies:
   `npm install`
2. Build Tailwind output:
   `npm run build:css`
3. Start Shopify theme dev server:
   `shopify theme dev`

For active Tailwind development:
`npm run watch:css`

## Main Files Changed

- `snippets/assessment-product-card.liquid`
- `assets/assessment-product-card.js`
- `src/tailwind.css`
- `assets/tailwind.css`
- `snippets/stylesheets.liquid`
- `snippets/scripts.liquid`
- `blocks/_product-card.liquid`
- `blocks/product-card.liquid`

## Submission

- GitHub repo: https://github.com/ValeraKap/product-card-component
- Working prototype: https://we1ckj-07.myshopify.com/
- Preview password: `steere`
