import { h, render } from 'https://unpkg.com/preact@latest?module';
import { useEffect, useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';

// TODO: Move to some config
const endpoint = 'https://catalog-service.adobe.io/graphql';
const headers = {
  'Magento-Environment-Id': '1f131648-b696-4bd1-af57-2021c7080b56',
  'Magento-Website-Code': 'base',
  'Magento-Store-View-Code': 'default',
  'Magento-Store-Code': 'main_website_store',
  'Magento-Customer-Group': '356a192b7913b04c54574d18c28d46e6395428ab',
  'x-api-key': 'adobe-consulting-de-1',
  'Content-Type': 'application/json',
};

const query = (sku) => `{
    products(skus: ["${sku}"]) {
        sku  
        name
        description
        addToCartAllowed
        metaDescription
        metaKeyword
        metaTitle
        images(roles: ["image"]) {
            label
            url
        }
    }
  }`;

const fetchProduct = async (sku) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: query(sku),
    }),
  }).then((res) => res.json());

  return response.data.products && response.data.products.length > 0 ?
    response.data.products[0] : null;
};

const Image = (props) => {
  const {
    breakpoints = [{ media: '(min-width: 400px)', width: '2000' }, { width: '750' }], alt = '', eager = false, ...otherProps
  } = props;
  let { src } = props;

  const ext = src.substring(src.lastIndexOf('.') + 1);

  // Enforce https
  if (src.startsWith('http://')) {
    src = src.replace('http://', 'https://');
  }

  console.log('src', src);

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

const ProductPage = (props) => {
  const { content } = props;
  const [product, setProduct] = useState(null);

  useEffect(() => {
    (async () => {
      // Check if empty or not
      if (props.content.querySelector(':scope > div > div').textContent !== '') {
        console.debug('Pre-rendered product detected, parse product from DOM');

        const domProps = {};
        const rows = Array.from(content.querySelectorAll(':scope > div'));
        rows.forEach((row) => {
          let [key, value] = Array.from(row.children);
          key = key.textContent.trim();

          if (key === 'description') {
            value = value.innerHTML;
          } else if (key === 'images') {
            value = Array.from(value.querySelectorAll('img')).map((img) => ({
              url: img.src,
              label: img.alt,
            }));
          } else if (key === 'addToCartAllowed') {
            value = value.textContent.trim() === 'true';
          } else {
            value = value.textContent.trim();
          }
          domProps[key] = value;
        });
        console.debug('Got product', domProps);
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
        if (!productResponse) {
          document.location = '/404';
          return;
        }
        console.debug('Got product', productResponse);
        setProduct(productResponse);
      }
    })();
  }, []);

  if (!product) {
    return <div>Loading...</div>;
  }

  const {
    sku, name, description, addToCartAllowed, images
  } = product;
  const [firstImage] = images;

  return <div className="product-detail-page block">
    <div className="gallery">
      <Image src={firstImage.url} alt={firstImage.label} breakpoints={[{ width: '350' }]} />
    </div>
    <div className="details">
      <h1>{name}</h1>
      {addToCartAllowed && <button data-sku={sku}>Add to cart</button>}
      <div className="description" dangerouslySetInnerHTML={{ __html: description }} />
    </div>
  </div>;
};

export default function decorate(block) {
  const content = block.cloneNode(true);
  block.textContent = '';
  render(<ProductPage content={content} />, block.parentNode, block);
}
