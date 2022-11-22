import { h, render } from 'https://unpkg.com/preact@latest?module';
import { useEffect, useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';
import { GRAPHQL_ENDPOINT } from '../../../scripts/scripts.js';
import { fetchProduct, optimizeImageUrl, readDomProps, Image, linkToProductPage } from '../../common/product.js';
const ProductTeaser = props => {
  const {
    content,
    classes
  } = props;
  const [product, setProduct] = useState(null);
  useEffect(() => {
    (async () => {
      const domProps = readDomProps(content);
      if (domProps.sku && !domProps.name) {
        const productResponse = await fetchProduct(GRAPHQL_ENDPOINT, domProps.sku);
        if (!productResponse) {
          console.error('Could not load product', domProps.sku);
          this.loadingDone();
          return;
        }
        productResponse.images = productResponse.images.map(image => ({
          ...image,
          url: optimizeImageUrl(image.url)
        }));
        setProduct({
          ...domProps,
          ...productResponse
        });
      } else if (domProps.sku && domProps.name) {
        setProduct(domProps);
      } else {
        console.error('Invalid block, do nothing');
        this.loadingDone();
      }
    })();
  }, []);
  useEffect(() => {
    if (!product) {
      return;
    }

    // Block is fully loaded
    console.debug('Done loading product', product);
    props.loadingDone();
  }, [product]);
  if (!product) {
    return h("div", {
      className: classes.join(' ')
    });
  }
  const {
    sku,
    name,
    addToCartAllowed,
    images,
    action
  } = product;
  const [firstImage] = images;
  return h("div", {
    className: classes.join(' ')
  }, h("div", {
    className: "teaser-image"
  }, h(Image, {
    src: firstImage.url,
    alt: firstImage.label,
    breakpoints: [{
      width: '350'
    }]
  })), h("div", {
    className: "teaser-content"
  }, h("h2", {
    className: "teaser-title"
  }, name), h("div", {
    className: "teaser-actions"
  }, String(action).toLowerCase() === 'link' && h("a", {
    href: linkToProductPage(sku),
    className: "teaser-action"
  }, "View"), String(action).toLowerCase() === 'addtocart' && addToCartAllowed && h("button", {
    onClick: () => alert(`add product with sku ${sku} to cart`),
    className: "teaser-action"
  }, "Buy Now"))));
};
export default function decorate(block) {
  return new Promise(resolve => {
    const content = block.cloneNode(true);
    const classes = Array.from(content.classList);
    block.textContent = '';
    render(h(ProductTeaser, {
      content: content,
      classes: classes,
      loadingDone: resolve
    }), block.parentNode, block);
  });
}