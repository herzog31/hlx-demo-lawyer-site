import { h, render } from '../../../scripts/preact.module.js';
import { useEffect, useState } from '../../../scripts/hooks.module.js';
import { GRAPHQL_ENDPOINT } from '../../../scripts/scripts.js';
import {
  optimizeImageUrl,
  fetchProduct,
  readDomProps,
  Image,
  fetchProductPrice,
  formatPrice,
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

const updateMetadata = (product) => {
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
};

const ProductPage = (props) => {
  const { content, classes } = props;
  const [product, setProduct] = useState(null);

  useEffect(() => {
    (async () => {
      // Check if empty or not
      if (props.content.querySelector(':scope > div > div').textContent !== '') {
        console.debug('Pre-rendered product detected, parse product from DOM');
        const domProps = readDomProps(content);
        setProduct(domProps);
      } else {
        // Get SKU
        const params = new URLSearchParams(window.location.search);
        if (!params.has('sku')) {
          document.location = '/404';
          return;
        }
        const sku = params.get('sku');
        console.debug('No pre-rendered product detected, load product by sku', sku);

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
    console.debug('Loaded product, first rendering done, resolving block promise', product);
    props.loadingDone();

    // Set metadata
    updateMetadata(product);

    (async () => {
      // Client-side price fetching for when the product is in the DOM
      if (!product.price && !product.priceRange) {
        const [price, isRange] = await fetchProductPrice(GRAPHQL_ENDPOINT, product.sku);
        console.debug('Enrich server-side rendered product with client-side pricing', price);
        setProduct((oldProduct) => ({
          ...oldProduct,
          [isRange ? 'priceRange' : 'price']: price,
        }));
      }
    })();
  }, [product]);

  if (!product) {
    return <div className={classes.join(' ')} />;
  }

  const {
    sku, name, description, addToCartAllowed, images, price, priceRange,
  } = product;
  const [firstImage] = images;

  // Price
  let formattedPrice;
  if (price) {
    formattedPrice = formatPrice('en-US', price.final.amount.currency, price.final.amount.value);
  } else if (priceRange) {
    formattedPrice = `from ${formatPrice('en-US', priceRange.minimum.final.amount.currency, priceRange.minimum.final.amount.value)}`;
  }

  return <div className={classes.join(' ')}>
    <div className="gallery">
      <Image src={firstImage.url} alt={firstImage.label} eager={true} breakpoints={[{ width: '350' }]} />
    </div>
    <div className="details">
      <h1>{name}</h1>
      <div className="pricing">
        <span className="price">{formattedPrice}</span>
        {addToCartAllowed && <button data-sku={sku}>Add to cart</button>}
      </div>
      <div className="description" dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  </div>;
};

export default function decorate(block) {
  return new Promise((resolve) => {
    const content = block.cloneNode(true);
    const classes = Array.from(content.classList);
    block.textContent = '';
    render(<ProductPage
      content={content}
      classes={classes}
      loadingDone={resolve} />, block.parentNode, block);
  });
}
