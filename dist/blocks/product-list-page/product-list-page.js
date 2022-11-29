import { h, render } from '../../../scripts/preact.module.js';
import { useEffect, useState } from '../../../scripts/hooks.module.js';
import { GRAPHQL_ENDPOINT } from '../../../scripts/scripts.js';
import { optimizeImageUrl, formatPrice, Image, linkToProductPage } from '../../common/product.js';
export const GetProductsByCategory = 'query GetProductsByCategory($current_page:Int $phrase:String! $filter:[SearchClauseInput!]$page_size:Int $roles:[String]){productSearch(current_page:$current_page phrase:$phrase filter:$filter page_size:$page_size){facets{attribute title buckets{title __typename ... on RangeBucket{count from to}... on ScalarBucket{count id}... on StatsBucket{max min}}}items{productView{sku name addToCartAllowed images(roles:$roles){roles url label}... on SimpleProductView{price{final{amount{currency value}}}}... on ComplexProductView{priceRange{minimum{final{amount{currency value}}}}}__typename}}page_info{current_page page_size total_pages}total_count}}';
export const fetchCategory = async (endpoint, filter, page = 1) => {
  const url = new URL(endpoint);
  url.searchParams.set('query', GetProductsByCategory);
  url.searchParams.set('variables', JSON.stringify({
    current_page: page,
    phrase: '',
    filter,
    page_size: 12,
    roles: ['thumbnail']
  }));
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(res => res.json());
  if (!response.data.productSearch) {
    return null;
  }

  // TODO: Fix category facets, because the IDs are numbers, but filtering only
  // works with the url keys
  response.data.productSearch.facets = response.data.productSearch.facets.map(facet => {
    if (facet.attribute !== 'categories') {
      return facet;
    }
    facet.buckets = facet.buckets.map(bucket => ({
      ...bucket,
      id: bucket.title
    }));
    return facet;
  });
  return response.data.productSearch;
};
const parseFiltersFromUrl = () => {
  // TODO: Except type Scalar for everything for now
  const params = new URLSearchParams(window.location.search);
  const newFilters = {};

  // Handle page
  newFilters.page = parseInt(params.get('page'), 10) || 1;

  // Handle key
  if (params.has('key')) {
    newFilters.categories = {
      type: 'ScalarBucket',
      values: [params.get('key')]
    };
  }

  // Handle everything else
  params.forEach((value, key) => {
    if (key === 'page' || key === 'key') {
      return;
    }
    newFilters[key] = {
      type: 'ScalarBucket',
      values: value.split(',')
    };
  });
  return newFilters;
};
const updateQueryParams = filter => {
  // Create new search params from filters, ignore existing parameters
  const newParams = new URLSearchParams();
  Object.keys(filter).forEach(key => {
    if (key === 'page') {
      newParams.set(key, filter[key]);
      return;
    }
    newParams.set(key, filter[key].values.join(','));
  });
  window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
};
const filterToGraphQL = filter => Object.keys(filter).map(key => {
  if (filter[key].type === 'ScalarBucket') {
    return {
      attribute: key,
      in: filter[key].values
    };
  }
  // TODO: Implement other types
  return {};
});
const toggleFilter = (currentFilters, attribute, type, id) => {
  const newFilters = {
    ...currentFilters
  };
  // Case A: Add filter if not in filters
  if (!newFilters[attribute]) {
    newFilters[attribute] = {
      type,
      values: [id]
    };
    return newFilters;
  }

  // Case B: Remove filter if available and in values
  if (newFilters[attribute].values.includes(id)) {
    newFilters[attribute].values = newFilters[attribute].values.filter(value => value !== id);
    if (newFilters[attribute].values.length === 0) {
      delete newFilters[attribute];
    }
    return newFilters;
  }

  // Case C: Add filter if available but not in values
  newFilters[attribute].values.push(id);
  return newFilters;
};
const CategoryPage = props => {
  const {
    classes
  } = props;
  const [category, setCategory] = useState(null);
  const [filter, setFilter] = useState(parseFiltersFromUrl);
  const {
    page,
    ...otherFilter
  } = filter;
  useEffect(() => {
    (async () => {
      // Update filters in URL
      updateQueryParams(filter);

      // Check if empty or not
      if (props.content.querySelector(':scope > div > div').textContent !== '') {
        console.debug('Pre-rendered category detected, parse category from DOM');
        // TODO
      } else {
        console.debug('No pre-rendered category detected, load category on the client');
        const categoryResponse = await fetchCategory(GRAPHQL_ENDPOINT, filterToGraphQL(otherFilter), page);
        if (!categoryResponse) {
          document.location = '/404';
          return;
        }
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
  }, [filter]);
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
    page_info: pageInfo,
    facets
  } = category;
  return h("div", {
    className: classes.join(' ')
  }, h("div", {
    className: "product-facets"
  }, h("input", {
    type: "checkbox",
    id: "show-facets",
    name: "show-facets"
  }), h("label", {
    htmlFor: "show-facets",
    className: "facet-button show-facets"
  }, "Show Filters"), h("label", {
    htmlFor: "show-facets",
    className: "facet-button hide-facets"
  }, "Hide Filters"), facets.map(facet => h("div", {
    key: facet.attribute,
    className: "facet"
  }, h("div", {
    className: "facet-title"
  }, facet.title), h("ul", {
    className: "facet-buckets"
  }, facet.buckets.map(bucket => h("li", {
    key: bucket.id,
    className: "facet-bucket"
  }, h("input", {
    type: "checkbox",
    id: `facet-${facet.attribute}-${bucket.id}`,
    checked: filter[facet.attribute] && filter[facet.attribute].values.includes(bucket.id),
    onClick: () => setFilter(currentFilters => toggleFilter(currentFilters, facet.attribute,
    // eslint-disable-next-line no-underscore-dangle
    bucket.__typename, bucket.id))
  }), h("label", {
    htmlFor: `facet-${facet.attribute}-${bucket.id}`
  }, bucket.title, " ", h("span", {
    className: "facet-count"
  }, "(", bucket.count, ")")))))))), h("div", {
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
    onClick: () => setFilter(oldState => ({
      ...oldState,
      page: i + 1
    }))
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