import { renderer } from '../../../scripts/catalog-pdp/api.js';
import { ProductDetailPage } from '../../../scripts/catalog-pdp/containers/CatalogPdp.js';
export default function decorate(block) {
  block.textContent = '';
  const elem = Object.assign(document.createElement('div'), {
    id: 'catalog-pdp'
  });
  renderer(ProductDetailPage)(elem);
  block.append(elem);
}