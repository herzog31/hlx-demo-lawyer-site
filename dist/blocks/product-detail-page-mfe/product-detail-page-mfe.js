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
  onAddToCart.register('onAddToCart', data => console.log('--FRANKLIN ADD TO CART-- ', data));
  onUpdateWishlist.register('onUpdateWishlist', data => console.log('--FRANKLIN WISHLIST--', data));
  onOptionSelect.register('onOptionSelect', data => {
    console.log('--FRANKLIN OPTION SELECTION-- ', data);
    const url = new URL(window.location.href);
    url.searchParams.set(data.option, data.value);
    window.history.replaceState(null, null, url);
  });
  selectedQuantity.watch(newValue => {
    console.log('--FRANKLIN QUANTITY UPDATED-- ', newValue);
  });
}