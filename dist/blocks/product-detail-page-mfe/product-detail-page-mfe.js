import { importFromStorefrontSDK } from '../../../scripts/scripts.js';
import { renderer } from '../../common/renderer.js';
export default async function decorate(block) {
  block.textContent = '';
  const {
    ProductDetailPage
  } = await importFromStorefrontSDK('/catalog/containers/pdp.js');
  const {
    onAddToCart,
    selectedQuantity,
    onUpdateWishlist,
    onOptionSelect
  } = await importFromStorefrontSDK('/catalog/api.js');
  renderer(ProductDetailPage)(block);
  onAddToCart.register('onAddToCart', data => console.log('Fraklin host / add to cart', data));
  onUpdateWishlist.register('onUpdateWishlist', data => console.log('Franklin host / update wishlist', data));
  onOptionSelect.register('onOptionSelect', data => {
    console.log('Franklin host / select option', data);
    const url = new URL(window.location.href);
    url.searchParams.set(data.option, data.value);
    window.history.replaceState(null, null, url);
  });
  selectedQuantity.watch(newValue => {
    console.log('Franklin host / quantity updated', newValue);
  });
}