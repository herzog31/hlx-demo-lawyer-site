import { h, render } from 'https://unpkg.com/preact@latest?module';
import { useEffect, useState } from 'https://unpkg.com/preact@latest/hooks/dist/hooks.module.js?module';
import { GRAPHQL_ENDPOINT } from '../../../scripts/scripts.js';
import { optimizeImageUrl, fetchProduct, readDomProps, Image } from '../../common/product.js';

/* const setMetaIfNotExists = (name, content, property = false) => {
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
}; */

export const GetProductsByCategory = `query GetProductsByCategory(
    $current_page: Int
    $phrase: String!
    $filter: [SearchClauseInput!]
    $page_size: Int
    $roles: [String]
) {
    productSearch(
        current_page: $current_page
        phrase: $phrase
        filter: $filter
        page_size: $page_size
    ) {
        items {
            productView {
                sku
                name
                addToCartAllowed
                images(roles: $roles) {
                    roles
                    url
                    label
                }
                ... on SimpleProductView {
                    price {
                        final {
                            amount {
                                currency
                                value
                            }
                        }
                    }
                }
                ... on ComplexProductView {
                    priceRange {
                        minimum {
                            final {
                                amount {
                                    currency
                                    value
                                }
                            }
                        }
                    }
                }
                __typename
            }
        }
        page_info {
            current_page
            page_size
            total_pages
        }
        total_count
    }
}`;
export const fetchCategory = async (endpoint, key, page = 1) => {
  const url = new URL(endpoint);
  url.searchParams.set('query', GetProductsByCategory);
  url.searchParams.set('variables', JSON.stringify({
    current_page: 1,
    phrase: '',
    filter: [{
      attribute: 'categories',
      in: [key]
    }],
    page_size: 20,
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
    content,
    classes
  } = props;
  const [category, setCategory] = useState(null);
  useEffect(() => {
    (async () => {
      // Check if empty or not
      if (props.content.querySelector(':scope > div > div').textContent !== '') {
        console.debug('Pre-rendered category detected, parse category from DOM');
        // TODO
      } else {
        console.debug('No pre-rendered category detected, load category by identifier');
        // Get Identifier
        const params = new URLSearchParams(window.location.search);
        if (!params.has('key')) {
          document.location = '/404';
          return;
        }
        const key = params.get('key');
        const page = params.get('page') || 1;
        console.debug('Got category key', key);
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
  }, []);
  useEffect(() => {
    if (!category) {
      return;
    }
    console.log('if page has changed, update category');

    // Block is fully loaded
    console.debug('Done loading category', category);
    props.loadingDone();

    // Set metadata
    // TODO
  }, [category]);
  if (!category) {
    return h("div", {
      className: classes.join(' ')
    });
  }
  const {
    key,
    items,
    page_info: pageInfo
  } = category;
  console.log('category', category);
  return h("div", {
    className: classes.join(' ')
  }, h("div", {
    className: "product-list"
  }, items.map(({
    productView: product
  }) => h("div", {
    key: product.sku,
    className: "product-list-item"
  }, h("a", {
    href: `/product-page?sku=${product.sku}`
  }, product.name || product.sku)))), h("div", {
    className: "pagination"
  }, h("ul", null, Array(pageInfo.total_pages).fill().map((_, i) => h("li", {
    key: i
  }, h("button", {
    onClick: () => {
      setCategory(currentState => ({
        ...currentState,
        page: i + 1
      }));
    }
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