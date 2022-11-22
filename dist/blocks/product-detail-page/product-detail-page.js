function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
import { h, render } from 'https://unpkg.com/preact@latest?module';
import { useEffect, useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';
const endpoint = 'https://www.marbec.click/graphql';
const GetProductsBySkus = 'query GetProductsBySkus($skus: [String]) { products(skus: $skus) { sku name description addToCartAllowed metaDescription metaKeyword metaTitle images(roles: ["image"]) { label url } } }';
const fetchProduct = async sku => {
  const url = new URL(endpoint);
  url.searchParams.set('query', GetProductsBySkus);
  url.searchParams.set('variables', JSON.stringify({
    skus: [sku]
  }));
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json());
  return response.data.products && response.data.products.length > 0 ? response.data.products[0] : null;
};
const optimizeImageUrl = url => {
  const newURL = new URL(url);
  // Rewrite image URL to use venia.magento.com which has CDN to optimize images
  newURL.hostname = 'jnz3dtiuj77ca.dummycachetest.com';
  newURL.protocol = 'https';
  return newURL.toString();
};
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
const Image = props => {
  const {
    breakpoints = [{
      media: '(min-width: 400px)',
      width: '2000'
    }, {
      width: '750'
    }],
    alt = '',
    src,
    eager = false,
    ...otherProps
  } = props;
  const ext = src.substring(src.lastIndexOf('.') + 1);
  const optimizedSources = [];
  breakpoints.forEach(breakpoint => {
    optimizedSources.push(h("source", {
      media: breakpoint.media,
      type: "image/webp",
      srcSet: `${src}?width=${breakpoint.width}&format=webply&optimize=medium`
    }));
  });
  const fallbackSources = [];
  breakpoints.forEach((breakpoint, i) => {
    if (i < breakpoints.length - 1) {
      fallbackSources.push(h("source", {
        media: breakpoint.media,
        srcSet: `${src}?width=${breakpoint.width}&format=${ext}&optimize=medium`
      }));
    } else {
      fallbackSources.push(h("img", _extends({
        src: `${src}?width=${breakpoint.width}&format=${ext}&optimize=medium`,
        alt: alt,
        loading: eager ? 'eager' : 'lazy'
      }, otherProps)));
    }
  });
  return h("picture", null, optimizedSources, fallbackSources);
};
const ProductPage = props => {
  const {
    content
  } = props;
  const [product, setProduct] = useState(null);
  useEffect(() => {
    (async () => {
      // Check if empty or not
      if (props.content.querySelector(':scope > div > div').textContent !== '') {
        console.debug('Pre-rendered product detected, parse product from DOM');
        const domProps = {};
        // Go through block and read product properties
        const rows = Array.from(content.querySelectorAll(':scope > div'));
        rows.forEach(row => {
          let [key, value] = Array.from(row.children);
          key = key.textContent.trim();
          if (key === 'description') {
            value = value.innerHTML;
          } else if (key === 'images') {
            value = Array.from(value.querySelectorAll('img')).map(img => ({
              url: optimizeImageUrl(img.src),
              label: img.alt
            }));
          } else if (key === 'addToCartAllowed') {
            value = value.textContent.trim() === 'true';
          } else {
            value = value.textContent.trim();
          }
          domProps[key] = value;
        });
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
        const productResponse = await fetchProduct(sku);
        productResponse.images = productResponse.images.map(image => ({
          ...image,
          url: optimizeImageUrl(image.url)
        }));
        if (!productResponse) {
          document.location = '/404';
          return;
        }
        setProduct(productResponse);
      }
    })();
  }, []);
  useEffect(() => {
    if (!product) {
      return;
    }

    // Let Franklin now block is fully loaded
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
    return h("div", {
      className: "product-detail-page block"
    });
  }
  const {
    sku,
    name,
    description,
    addToCartAllowed,
    images
  } = product;
  const [firstImage] = images;
  return h("div", {
    className: "product-detail-page block"
  }, h("div", {
    className: "gallery"
  }, h(Image, {
    src: firstImage.url,
    alt: firstImage.label,
    eager: true,
    breakpoints: [{
      width: '350'
    }]
  })), h("div", {
    className: "details"
  }, h("h1", null, name), addToCartAllowed && h("button", {
    "data-sku": sku
  }, "Add to cart"), h("div", {
    className: "description",
    dangerouslySetInnerHTML: {
      __html: description
    }
  })));
};
export default function decorate(block) {
  return new Promise(resolve => {
    const content = block.cloneNode(true);
    block.textContent = '';
    render(h(ProductPage, {
      content: content,
      loadingDone: resolve
    }), block.parentNode, block);
  });
}