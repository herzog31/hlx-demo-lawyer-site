import { h } from '../../../scripts/preact.module.js';

export const GetProductsBySkus = 'query GetProductsBySkus($skus:[String]){products(skus:$skus){sku name description addToCartAllowed metaDescription metaKeyword metaTitle images(roles:["image"]){label url}... on SimpleProductView{price{final{amount{value currency}}}}... on ComplexProductView{priceRange{minimum{final{amount{value currency}}}}}}}';
export const GetProductPricesBySkus = 'query GetProductPricesBySkus($skus:[String]){products(skus:$skus){... on SimpleProductView{price{final{amount{value currency}}}}... on ComplexProductView{priceRange{minimum{final{amount{value currency}}}}}}}';

export const fetchProduct = async (endpoint, sku) => {
  const url = new URL(endpoint);
  url.searchParams.set('query', GetProductsBySkus);
  url.searchParams.set('variables', JSON.stringify({ skus: [sku] }));

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => res.json());

  return response.data.products && response.data.products.length > 0
    ? response.data.products[0] : null;
};

export const fetchProductPrice = async (endpoint, sku) => {
  const url = new URL(endpoint);
  url.searchParams.set('query', GetProductPricesBySkus);
  url.searchParams.set('variables', JSON.stringify({ skus: [sku] }));

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }).then((res) => res.json());

  if (!response.data.products || response.data.products.length === 0) {
    return [null, false];
  }

  if (response.data.products[0].priceRange) {
    return [response.data.products[0].priceRange, true];
  }

  return [response.data.products[0].price, false];
};

export const optimizeImageUrl = (url) => {
  const newURL = new URL(url);
  // Rewrite image URL to use venia.magento.com which has CDN to optimize images
  newURL.hostname = 'jnz3dtiuj77ca.dummycachetest.com';
  newURL.protocol = 'https';

  return newURL.toString();
};

export const readDomProps = (content) => {
  const domProps = {};
  // Go through block and read product properties
  const rows = Array.from(content.querySelectorAll(':scope > div'));
  rows.forEach((row) => {
    let [key, value] = Array.from(row.children);
    key = key.textContent.trim();

    if (key === 'description') {
      value = value.innerHTML;
    } else if (key === 'images') {
      value = Array.from(value.querySelectorAll('img')).map((img) => ({
        url: optimizeImageUrl(img.src),
        label: img.alt,
      }));
    } else if (key === 'addToCartAllowed') {
      value = value.textContent.trim() === 'true';
    } else {
      value = value.textContent.trim();
    }

    domProps[key] = value;
  });

  return domProps;
};

export const Image = (props) => {
  const {
    breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }], alt = '', src, eager = false, ...otherProps
  } = props;

  const ext = src.substring(src.lastIndexOf('.') + 1);

  const optimizedSources = [];
  breakpoints.forEach((breakpoint) => {
    optimizedSources.push(<source media={breakpoint.media} type="image/webp" srcSet={`${src}?width=${breakpoint.width}&format=webply&optimize=medium`} />);
  });

  const fallbackSources = [];
  breakpoints.forEach((breakpoint, i) => {
    if (i < breakpoints.length - 1) {
      fallbackSources.push(<source media={breakpoint.media} srcSet={`${src}?width=${breakpoint.width}&format=${ext}&optimize=medium`} />);
    } else {
      fallbackSources.push(<img src={`${src}?width=${breakpoint.width}&format=${ext}&optimize=medium`} alt={alt} loading={eager ? 'eager' : 'lazy'} {...otherProps} />);
    }
  });

  return <picture>
    {optimizedSources}
    {fallbackSources}
  </picture>;
};

export const linkToProductPage = (sku) => {
  const url = new URL(window.location.href);
  if (url.hostname === 'www.marbec.click') {
    return `/product-page/${sku}`;
  }
  return `/product-page?sku=${sku}`;
};

export const formatPrice = (locale, currency, value) => {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  });
  return formatter.format(value);
};
