import { h, render } from 'https://unpkg.com/preact@latest?module';
import { useEffect, useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';
import { GRAPHQL_ENDPOINT } from '../../../scripts/scripts.js';
import {
  optimizeImageUrl,
  fetchProduct,
  readDomProps,
  Image,
} from '../../common/product.js';

const setMetaIfNotExists = (name, content, property = false) => {
  if (!content) {
    return;
  }
  const meta = document.querySelector(`meta[${property ? 'property' : 'name'}="${name}"]`);
  if (!meta) {
    const newMeta = document.createElement('meta');
    newMeta[property ? 'property' : 'name'] = name;
    newMeta.content = content;
    document.head.append(newMeta);
    return;
  }
  meta.content = content;
};

const ProductPage = (props) => {
  const { content } = props;
  const [product, setProduct] = useState(null);

  useEffect(() => {
    (async () => {
      // Check if empty or not
      if (props.content.querySelector(':scope > div > div').textContent !== '') {
        console.debug('Pre-rendered product detected, parse product from DOM');
        const domProps = readDomProps(content);
        setProduct(domProps);
      } else {
        console.debug('No pre-rendered product detected, load product by sku');
        // Get SKU
        const params = new URLSearchParams(window.location.search);
        if (!params.has('sku')) {
          document.location = '/404';
          return;
        }
        const sku = params.get('sku');
        console.debug('Got sku', sku);

        const productResponse = await fetchProduct(GRAPHQL_ENDPOINT, sku);
        if (!productResponse) {
          document.location = '/404';
          return;
        }

        productResponse.images = productResponse.images.map((image) => ({
          ...image,
          url: optimizeImageUrl(image.url),
        }));

        setProduct(productResponse);
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

    // Set metadata
    if (product.metaTitle) {
      document.title = product.metaTitle;
    }
    setMetaIfNotExists('og:title', product.metaTitle, true);
    setMetaIfNotExists('og:image', product.images[0].url, true);
    setMetaIfNotExists('og:image:secure_url', product.images[0].url, true);
    setMetaIfNotExists('og:url', `https://www.marbec.click/product-page/${product.sku}`, true);
    setMetaIfNotExists('description', product.metaDescription);
    setMetaIfNotExists('twitter:title', product.metaTitle);
    setMetaIfNotExists('twitter:description', product.metaDescription);
    setMetaIfNotExists('twitter:image', product.images[0].url);
  }, [product]);

  if (!product) {
    return <div className="product-detail-page block" />;
  }

  const {
    sku, name, description, addToCartAllowed, images,
  } = product;
  const [firstImage] = images;

  return <div className="product-detail-page block">
    <div className="gallery">
      <Image src={firstImage.url} alt={firstImage.label} eager={true} breakpoints={[{ width: '350' }]} />
    </div>
    <div className="details">
      <h1>{name}</h1>
      {addToCartAllowed && <button data-sku={sku}>Add to cart</button>}
      <div className="description" dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  </div>;
};

export default function decorate(block) {
  return new Promise((resolve) => {
    const content = block.cloneNode(true);
    block.textContent = '';
    render(<ProductPage content={content} loadingDone={resolve} />, block.parentNode, block);
  });
}
