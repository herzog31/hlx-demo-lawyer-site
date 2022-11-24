import { h, render } from 'https://unpkg.com/preact@latest?module';
import { useEffect, useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';
import { GRAPHQL_ENDPOINT } from '../../../scripts/scripts.js';
import { optimizeImageUrl, formatPrice, Image, linkToProductPage } from '../../common/product.js';
export const GetProductsByCategory = 'query GetProductsByCategory($current_page:Int $phrase:String! $filter:[SearchClauseInput!]$page_size:Int $roles:[String]){productSearch(current_page:$current_page phrase:$phrase filter:$filter page_size:$page_size){items{productView{sku name addToCartAllowed images(roles:$roles){roles url label}... on SimpleProductView{price{final{amount{currency value}}}}... on ComplexProductView{priceRange{minimum{final{amount{currency value}}}}}__typename}}page_info{current_page page_size total_pages}total_count}}';
export const fetchCategory = async (endpoint, key, page = 1) => {
  const url = new URL(endpoint);
  url.searchParams.set('query', GetProductsByCategory);
  url.searchParams.set('variables', JSON.stringify({
    current_page: page,
    phrase: '',
    filter: [{
      attribute: 'categories',
      in: [key]
    }],
    page_size: 12,
    roles: ['thumbnail']
  }));
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json());
  return response.data.productSearch ? response.data.productSearch : null;
};
const CategoryPage = props => {
  const {
    classes
  } = props;
  const [category, setCategory] = useState(null);

  // Current page
  const params = new URLSearchParams(window.location.search);
  const [page, setPage] = useState(parseInt(params.get('page'), 10) || 1);
  useEffect(() => {
    (async () => {
      // Update page parameter
      const newParams = new URLSearchParams(window.location.search);
      if (page === 1) {
        newParams.delete('page');
      } else {
        newParams.set('page', page);
      }
      window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);

      // Check if empty or not
      if (props.content.querySelector(':scope > div > div').textContent !== '') {
        console.debug('Pre-rendered category detected, parse category from DOM');
        // TODO
      } else {
        console.debug('No pre-rendered category detected, load category by identifier');
        // Get Identifier
        if (!params.has('key')) {
          document.location = '/404';
          return;
        }
        const key = params.get('key');
        console.debug('Got category key', key, page);
        const categoryResponse = await fetchCategory(GRAPHQL_ENDPOINT, key, page);
        if (!categoryResponse) {
          document.location = '/404';
          return;
        }
        categoryResponse.key = key;
        categoryResponse.items.forEach(product => {
          if (!product.productView.images) {
            return;
          }
          product.productView.images = product.productView.images.map(image => ({
            ...image,
            url: optimizeImageUrl(image.url)
          }));
        });
        setCategory(categoryResponse);
      }
    })();
  }, [page]);
  useEffect(() => {
    if (!category) {
      return;
    }

    // Block is fully loaded
    console.debug('Done loading category', category);
    props.loadingDone();

    // TODO Set metadata once data is available
  }, [category]);
  if (!category) {
    return h("div", {
      className: classes.join(' ')
    });
  }
  const {
    items,
    page_info: pageInfo
  } = category;
  return h("div", {
    className: classes.join(' ')
  }, h("div", {
    className: "product-list"
  }, items.map(({
    productView: product
  }) => {
    // Image
    let firstImage;
    if (product.images && product.images.length > 0) {
      [firstImage] = product.images;
    }

    // Price
    let price;
    if (product.price) {
      price = formatPrice('en-US', product.price.final.amount.currency, product.price.final.amount.value);
    } else if (product.priceRange) {
      price = `from ${formatPrice('en-US', product.priceRange.minimum.final.amount.currency, product.priceRange.minimum.final.amount.value)}`;
    }
    return h("div", {
      key: product.sku,
      className: "product-list-item"
    }, h("a", {
      href: linkToProductPage(product.sku)
    }, h("div", {
      className: "product-image"
    }, firstImage && h(Image, {
      src: firstImage.url,
      alt: firstImage.label,
      breakpoints: [{
        width: '390'
      }]
    })), h("span", {
      className: "product-name"
    }, product.name || product.sku)), h("span", {
      className: "product-price"
    }, price), h("button", null, "Add to Cart"));
  }), items.length === 0 && h("div", {
    className: "no-products"
  }, "No products found")), h("div", {
    className: "pagination"
  }, h("ul", null, Array(pageInfo.total_pages).fill().map((_, i) => h("li", {
    key: i
  }, h("button", {
    disabled: page === i + 1,
    onClick: () => setPage(i + 1)
  }, i + 1))))));
};
export default function decorate(block) {
  return new Promise(resolve => {
    const content = block.cloneNode(true);
    const classes = Array.from(content.classList);
    block.textContent = '';
    render(h(CategoryPage, {
      content: content,
      classes: classes,
      loadingDone: resolve
    }), block.parentNode, block);
  });
}