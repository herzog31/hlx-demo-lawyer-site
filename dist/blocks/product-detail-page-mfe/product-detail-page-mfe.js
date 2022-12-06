import { importFromStorefrontSDK } from '../../../scripts/scripts.js';
import { renderer } from '../../common/renderer.js';
export default async function decorate(block) {
  block.textContent = '';
  const {
    ProductDetailPage
  } = await importFromStorefrontSDK('/catalog/containers/pdp.js');
  renderer(ProductDetailPage)(block);
}