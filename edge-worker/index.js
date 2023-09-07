import { Router } from 'itty-router';
import compress from 'graphql-query-compress';

import ProductDetailPageRewriter from './ProductDetailPageRewriter';
import ProductTeaserRewriter from './ProductTeaserRewriter';

const router = Router();

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
    'Access-Control-Max-Age': '86400',
};

const endpoint = 'https://catalog-service.adobe.io/graphql';
const headers = {
    'Magento-Environment-Id': '...',
    'Magento-Website-Code': 'base',
    'Magento-Store-View-Code': 'default',
    'Magento-Store-Code': 'main_website_store',
    'Magento-Customer-Group': '...',
    'x-api-key': '...',
    'Content-Type': 'application/json'
};

function handleOptions(request) {
    const headers = request.headers;
    if (
        headers.get('Origin') !== null &&
        headers.get('Access-Control-Request-Method') !== null &&
        headers.get('Access-Control-Request-Headers') !== null
    ) {
        const respHeaders = {
            ...corsHeaders,
            'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers'),
        };

        return new Response(null, {
            headers: respHeaders,
        });
    } else {
        return new Response(null, {
            headers: {
                Allow: 'GET, HEAD, POST, OPTIONS',
            },
        });
    }
};

const rewriteReq = (request) => {
    const url = new URL(request.url);
    url.hostname = ORIGIN_HOSTNAME;
    const req = new Request(url, request);
    req.headers.set('x-forwarded-host', req.headers.get('host'));
    req.headers.set('x-byo-cdn-type', 'cloudflare');

    return new Request(url, request);
};

const rewriteResponse = (response) => {
    const resp = new Response(response.body, response);
    resp.headers.delete('age');
    resp.headers.delete('x-robots-tag');
    return resp;
};

const GetProductsBySkus = compress(`query GetProductsBySkus($skus: [String]) {
    products(skus: $skus) {
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
}`);

const fetchProduct = async (sku) => {
    let url = new URL(endpoint);
    url.searchParams.set('query', GetProductsBySkus);
    url.searchParams.set('variables', JSON.stringify({ skus: [sku] }));

    const response = await fetch(url, {
        method: 'GET',
        headers,
        cf: {
            cacheTtl: 60 * 60 * 24, // Cache responses for one day
            cacheEverything: true
        }
    }).then(res => res.json());

    return response.data.products && response.data.products.length > 0 ? response.data.products[0] : null;
};

router.get('/product-page/:sku', async (request) => {
    const req = rewriteReq(request);

    const productPage = new URL(req.url);
    productPage.pathname = '/product-page';

    // Get SKU from original request, gets lost during rewrite
    const sku = request.params.sku;
    if (!sku) {
        return new Response('Not found.', { status: 404 });
    }

    // Get product data
    const product = await fetchProduct(sku);
    if (!product) {
        // Abort early if no product was found
        return new Response('Not found.', { status: 404 });
    }
    console.log('Got product', product);

    // Get product page
    let res = await fetch(productPage, {
        cf: {
            cacheEverything: true,
        }
    });
    res = rewriteResponse(res);

    // Early hint for product image
    res.headers.append('Link', `<${product.images[0].url}?width=350&format=webply&optimize=medium>; rel=preload; as=image`);

    // Rewriter, add meta data and replace product block
    return new HTMLRewriter()
        .on('title, meta, .product-detail-page', new ProductDetailPageRewriter(product, req))
        .transform(res);
});

router.all('/graphql', async (request) => {
    // Change request to catalog services
    const newUrl = new URL(request.url);
    newUrl.hostname = 'catalog-service.adobe.io';
    newUrl.pathname = '/graphql';


    const req = new Request(newUrl, request);
    Object.keys(headers).forEach((key) => {
        req.headers.set(key, headers[key]);
    });

    return fetch(req, {
        cf: {
            cacheEverything: true,
        }
    });
});

router.all('/graphql-monolith', async (request) => {
    if (request.method === 'OPTIONS') {
        console.log('got options request');
        return handleOptions(request);
    }

    // Change request to monolith GraphQL
    const newUrl = new URL(request.url);
    newUrl.hostname = 'venia.magento.com';
    newUrl.pathname = '/graphql';

    const req = new Request(newUrl, request);

    let resp = await fetch(req, {
        cf: {
            cacheEverything: true,
        }
    });

    resp = new Response(resp.body, resp);
    resp.headers.set('Access-Control-Allow-Origin', '*');
    resp.headers.append('Vary', 'Origin');

    return resp;
});

router.all('*', async (request) => {
    // Get actual Helix content
    const req = rewriteReq(request);
    let res = await fetch(req, {
        cf: {
            cacheEverything: true,
        }
    });
    res = rewriteResponse(res);

    // Apply rewriting
    return new HTMLRewriter()
        .on('.product-teaser', new ProductTeaserRewriter(fetchProduct))
        .transform(res);
});

addEventListener('fetch', event => {
    event.respondWith(router.handle(event.request))
});