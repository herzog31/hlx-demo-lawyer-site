// eslint-disable-next-line import/no-cycle
import { sampleRUM } from './lib-franklin.js';

// Storefront SDK
import { ProductDetailPage } from './catalog-pdp/containers/CatalogPdp.js';
import { renderer } from './catalog-pdp/api.js';

// Render
const elem = Object.assign(document.createElement('div'), {
  id: 'catalog-pdp',
});

renderer(ProductDetailPage)(elem);
document.body.append(elem);

// Core Web Vitals RUM collection
sampleRUM('cwv');
